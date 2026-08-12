#!/usr/bin/env bash
set -euo pipefail
APP_DIR="/opt/mein-kraftbaum"
APP_USER="kraftbaum"
REPO_URL="https://github.com/Schello805/Beckenboden.git"
if [[ "${EUID}" -ne 0 ]]; then echo "Bitte als root ausführen."; exit 1; fi
apt-get update
apt-get install -y git curl ca-certificates rsync
id "${APP_USER}" >/dev/null 2>&1 || useradd --system --create-home --shell /usr/sbin/nologin "${APP_USER}"
if [[ ! -d "${APP_DIR}/.git" ]]; then git clone "${REPO_URL}" "${APP_DIR}"; fi
chown -R "${APP_USER}:${APP_USER}" "${APP_DIR}"
install -m 0644 "${APP_DIR}/deploy/mein-kraftbaum.service" /etc/systemd/system/mein-kraftbaum.service
systemctl daemon-reload
sudo -u "${APP_USER}" bash -lc "cd '${APP_DIR}' && npm ci && npm run build"
systemctl enable --now mein-kraftbaum
echo "Installation abgeschlossen. NPM Plus auf 127.0.0.1:3000 weiterleiten."
