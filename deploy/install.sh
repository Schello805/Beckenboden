#!/usr/bin/env bash
set -euo pipefail
APP_DIR="/opt/mein-kraftbaum"
APP_USER="kraftbaum"
APP_CACHE="/var/cache/mein-kraftbaum"
REPO_URL="https://github.com/Schello805/Beckenboden.git"
if [[ "${EUID}" -ne 0 ]]; then echo "Bitte als root ausführen."; exit 1; fi
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y git curl ca-certificates rsync openssl gnupg sqlite3 sudo build-essential python3
if ! command -v node >/dev/null 2>&1 || [[ "$(node -p 'Number(process.versions.node.split(`.`)[0])' 2>/dev/null || echo 0)" -lt 22 ]]; then
  install -d -m 0755 /etc/apt/keyrings
  curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor --yes -o /etc/apt/keyrings/nodesource.gpg
  printf 'deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main\n' > /etc/apt/sources.list.d/nodesource.list
  apt-get update
  apt-get install -y nodejs
fi
echo "Node.js $(node --version), npm $(npm --version)"
id "${APP_USER}" >/dev/null 2>&1 || useradd --system --create-home --shell /usr/sbin/nologin "${APP_USER}"
install -d -o "${APP_USER}" -g "${APP_USER}" -m 0750 "${APP_CACHE}" "${APP_CACHE}/npm"
as_app(){ runuser -u "${APP_USER}" -- env HOME="${APP_CACHE}" NPM_CONFIG_CACHE="${APP_CACHE}/npm" "$@"; }
if [[ ! -d "${APP_DIR}/.git" ]]; then
  git clone --branch main --single-branch "${REPO_URL}" "${APP_DIR}"
  chown -R "${APP_USER}:${APP_USER}" "${APP_DIR}"
else
  chown -R "${APP_USER}:${APP_USER}" "${APP_DIR}"
  as_app git -C "${APP_DIR}" fetch origin main
  as_app git -C "${APP_DIR}" checkout main
  as_app git -C "${APP_DIR}" pull --ff-only origin main
fi
install -d -o "${APP_USER}" -g "${APP_USER}" -m 0700 "${APP_DIR}/data"
if [[ ! -f /etc/mein-kraftbaum.env ]]; then
  SESSION_SECRET="$(openssl rand -hex 32)"
  INSTALL_TOKEN="$(openssl rand -hex 24)"
  install -m 0600 /dev/null /etc/mein-kraftbaum.env
  printf 'SESSION_SECRET=%s\nINSTALL_TOKEN=%s\nDATA_DIR=%s\nAPP_REVISION=%s\nAPP_URL=%s\nBACKUP_KEEP_DAYS=%s\n' "${SESSION_SECRET}" "${INSTALL_TOKEN}" "${APP_DIR}/data" "0.35.6" "${APP_URL:-http://localhost:3000}" "30" > /etc/mein-kraftbaum.env
  echo "Einmaliger Installationsschlüssel: ${INSTALL_TOKEN}"
fi
# shellcheck disable=SC1091
source /etc/mein-kraftbaum.env
install -d -m 0750 /var/backups/mein-kraftbaum
install -m 0644 "${APP_DIR}/deploy/mein-kraftbaum.service" /etc/systemd/system/mein-kraftbaum.service
install -m 0644 "${APP_DIR}/deploy/mein-kraftbaum-update.service" /etc/systemd/system/mein-kraftbaum-update.service
install -m 0644 "${APP_DIR}/deploy/mein-kraftbaum-update.path" /etc/systemd/system/mein-kraftbaum-update.path
install -m 0644 "${APP_DIR}/deploy/mein-kraftbaum-backup.service" /etc/systemd/system/mein-kraftbaum-backup.service
install -m 0644 "${APP_DIR}/deploy/mein-kraftbaum-backup.timer" /etc/systemd/system/mein-kraftbaum-backup.timer
chmod 0755 "${APP_DIR}/deploy/preflight.sh" "${APP_DIR}/deploy/update.sh" "${APP_DIR}/deploy/rollback.sh" "${APP_DIR}/deploy/backup.sh"
rm -f /etc/sudoers.d/mein-kraftbaum-update
systemctl daemon-reload
systemctl enable --now mein-kraftbaum-backup.timer
systemctl enable --now mein-kraftbaum-update.path
systemctl start mein-kraftbaum-backup.service
if ! as_app bash -c "cd '${APP_DIR}' && npm ci"; then
  echo "npm-Download fehlgeschlagen; zweiter Versuch in fünf Sekunden ..."
  sleep 5
  as_app bash -c "cd '${APP_DIR}' && npm ci"
fi
as_app bash -c "cd '${APP_DIR}' && npm run build"
EXPECTED_REVISION="$(node -p "require('${APP_DIR}/package.json').version")"
if grep -q '^APP_REVISION=' /etc/mein-kraftbaum.env; then
  sed -i "s/^APP_REVISION=.*/APP_REVISION=${EXPECTED_REVISION}/" /etc/mein-kraftbaum.env
else
  printf 'APP_REVISION=%s\n' "${EXPECTED_REVISION}" >> /etc/mein-kraftbaum.env
fi
systemctl enable mein-kraftbaum
systemctl restart mein-kraftbaum
HEALTHY=0
for attempt in {1..20}; do
  HEALTH_JSON="$(curl --fail --silent --show-error --max-time 3 http://127.0.0.1:3000/api/health 2>/dev/null || true)"
  if [[ "${HEALTH_JSON}" == *"\"revision\":\"${EXPECTED_REVISION}\""* ]] \
    && [[ "${HEALTH_JSON}" == *"smtp-before-2fa"* ]] \
    && curl --fail --silent --show-error --max-time 5 http://127.0.0.1:3000/ >/dev/null 2>&1; then
    HEALTHY=1
    break
  fi
  sleep 1
done
if [[ "${HEALTHY}" -ne 1 ]]; then
  systemctl status mein-kraftbaum --no-pager || true
  journalctl -u mein-kraftbaum -n 50 --no-pager || true
  echo "Gesundheitstest fehlgeschlagen: Erwartete Revision ${EXPECTED_REVISION} wird nicht ausgeliefert." >&2
  exit 1
fi
printf '{"status":"success","revision":"%s","finishedAt":"%s"}\n' "${EXPECTED_REVISION}" "$(date -Iseconds)" > "${DATA_DIR}/update-status.json"
chown "${APP_USER}:${APP_USER}" "${DATA_DIR}/update-status.json"
echo
echo "Installation und Gesundheitstest erfolgreich."
echo "Laufende Revision: ${EXPECTED_REVISION}"
echo "Die App lauscht lokal auf Port 3000. Konfiguriere deinen HTTPS-Reverse-Proxy separat."
echo "Installationsschlüssel anzeigen: grep INSTALL_TOKEN /etc/mein-kraftbaum.env"
