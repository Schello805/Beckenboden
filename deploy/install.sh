#!/usr/bin/env bash
set -euo pipefail
APP_DIR="/opt/mein-kraftbaum"
APP_USER="kraftbaum"
REPO_URL="https://github.com/Schello805/Beckenboden.git"
if [[ "${EUID}" -ne 0 ]]; then echo "Bitte als root ausführen."; exit 1; fi
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y git curl ca-certificates rsync openssl gnupg sqlite3 sudo
if ! command -v node >/dev/null 2>&1 || [[ "$(node -p 'Number(process.versions.node.split(`.`)[0])' 2>/dev/null || echo 0)" -lt 22 ]]; then
  install -d -m 0755 /etc/apt/keyrings
  curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor --yes -o /etc/apt/keyrings/nodesource.gpg
  printf 'deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main\n' > /etc/apt/sources.list.d/nodesource.list
  apt-get update
  apt-get install -y nodejs
fi
echo "Node.js $(node --version), npm $(npm --version)"
id "${APP_USER}" >/dev/null 2>&1 || useradd --system --create-home --shell /usr/sbin/nologin "${APP_USER}"
if [[ ! -d "${APP_DIR}/.git" ]]; then
  git clone --branch main --single-branch "${REPO_URL}" "${APP_DIR}"
  chown -R "${APP_USER}:${APP_USER}" "${APP_DIR}"
else
  chown -R "${APP_USER}:${APP_USER}" "${APP_DIR}"
  runuser -u "${APP_USER}" -- git -C "${APP_DIR}" fetch origin main
  runuser -u "${APP_USER}" -- git -C "${APP_DIR}" checkout main
  runuser -u "${APP_USER}" -- git -C "${APP_DIR}" pull --ff-only origin main
fi
install -d -o "${APP_USER}" -g "${APP_USER}" -m 0700 "${APP_DIR}/data"
if [[ ! -f /etc/mein-kraftbaum.env ]]; then
  SESSION_SECRET="$(openssl rand -hex 32)"
  INSTALL_TOKEN="$(openssl rand -hex 24)"
  install -m 0600 /dev/null /etc/mein-kraftbaum.env
  printf 'SESSION_SECRET=%s\nINSTALL_TOKEN=%s\nDATA_DIR=%s\nAPP_REVISION=%s\nAPP_URL=%s\n' "${SESSION_SECRET}" "${INSTALL_TOKEN}" "${APP_DIR}/data" "0.20.0" "${APP_URL:-http://localhost:3000}" > /etc/mein-kraftbaum.env
  echo "Einmaliger Installationsschlüssel: ${INSTALL_TOKEN}"
fi
install -d -m 0750 /var/backups/mein-kraftbaum
install -m 0644 "${APP_DIR}/deploy/mein-kraftbaum.service" /etc/systemd/system/mein-kraftbaum.service
install -m 0644 "${APP_DIR}/deploy/mein-kraftbaum-update.service" /etc/systemd/system/mein-kraftbaum-update.service
SYSTEMCTL_BIN="$(command -v systemctl)"
printf '%s ALL=(root) NOPASSWD: %s start --no-block mein-kraftbaum-update.service\n' "${APP_USER}" "${SYSTEMCTL_BIN}" > /etc/sudoers.d/mein-kraftbaum-update
chmod 0440 /etc/sudoers.d/mein-kraftbaum-update
systemctl daemon-reload
runuser -u "${APP_USER}" -- bash -c "cd '${APP_DIR}' && npm ci && npm run build"
systemctl enable --now mein-kraftbaum
sleep 2
curl --fail --silent --show-error http://127.0.0.1:3000/api/health >/dev/null
echo
echo "Installation und Gesundheitstest erfolgreich."
echo "Die App lauscht lokal auf Port 3000. Konfiguriere deinen HTTPS-Reverse-Proxy separat."
echo "Installationsschlüssel anzeigen: grep INSTALL_TOKEN /etc/mein-kraftbaum.env"
