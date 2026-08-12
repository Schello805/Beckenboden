#!/usr/bin/env bash
set -euo pipefail
APP_DIR="/opt/mein-kraftbaum"
APP_USER="kraftbaum"
REPO_URL="https://github.com/Schello805/Beckenboden.git"
if [[ "${EUID}" -ne 0 ]]; then echo "Bitte als root ausführen."; exit 1; fi
apt-get update
apt-get install -y git curl ca-certificates rsync openssl
id "${APP_USER}" >/dev/null 2>&1 || useradd --system --create-home --shell /usr/sbin/nologin "${APP_USER}"
if [[ ! -d "${APP_DIR}/.git" ]]; then git clone "${REPO_URL}" "${APP_DIR}"; fi
chown -R "${APP_USER}:${APP_USER}" "${APP_DIR}"
install -d -o "${APP_USER}" -g "${APP_USER}" -m 0700 "${APP_DIR}/data"
if [[ ! -f /etc/mein-kraftbaum.env ]]; then
  SESSION_SECRET="$(openssl rand -hex 32)"
  INSTALL_TOKEN="$(openssl rand -hex 24)"
  install -m 0600 /dev/null /etc/mein-kraftbaum.env
  printf 'SESSION_SECRET=%s\nINSTALL_TOKEN=%s\nDATA_DIR=%s\nAPP_REVISION=%s\n' "${SESSION_SECRET}" "${INSTALL_TOKEN}" "${APP_DIR}/data" "0.2.3" > /etc/mein-kraftbaum.env
  echo "Einmaliger Installationsschlüssel: ${INSTALL_TOKEN}"
fi
install -m 0644 "${APP_DIR}/deploy/mein-kraftbaum.service" /etc/systemd/system/mein-kraftbaum.service
systemctl daemon-reload
sudo -u "${APP_USER}" bash -lc "cd '${APP_DIR}' && npm ci && npm run build"
systemctl enable --now mein-kraftbaum
echo "Installation abgeschlossen. NPM Plus auf 127.0.0.1:3000 weiterleiten."
