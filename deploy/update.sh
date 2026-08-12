#!/usr/bin/env bash
set -euo pipefail
APP_DIR="/opt/mein-kraftbaum"
BACKUP_DIR="/var/backups/mein-kraftbaum"
STAMP="$(date +%Y%m%d-%H%M%S)"
mkdir -p "${BACKUP_DIR}/${STAMP}"
cd "${APP_DIR}"
git rev-parse HEAD > "${BACKUP_DIR}/${STAMP}/commit"
[[ -d data ]] && rsync -a data/ "${BACKUP_DIR}/${STAMP}/data/"
git fetch origin main
git checkout main
git pull --ff-only origin main
npm ci
npm run lint
npm test
systemctl restart mein-kraftbaum
curl --fail --silent --show-error http://127.0.0.1:3000/ >/dev/null
echo "Update erfolgreich: $(git rev-parse --short HEAD)"
