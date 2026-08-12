#!/usr/bin/env bash
set -euo pipefail
APP_DIR="/opt/mein-kraftbaum"
BACKUP_DIR="/var/backups/mein-kraftbaum"
STAMP="$(date +%Y%m%d-%H%M%S)"
mkdir -p "${BACKUP_DIR}/${STAMP}"
cd "${APP_DIR}"
git rev-parse HEAD > "${BACKUP_DIR}/${STAMP}/commit"
source /etc/mein-kraftbaum.env
mkdir -p "${BACKUP_DIR}/${STAMP}/data"
if [[ -f "${DATA_DIR}/kraftbaum.sqlite" ]]; then sqlite3 "${DATA_DIR}/kraftbaum.sqlite" ".backup '${BACKUP_DIR}/${STAMP}/data/kraftbaum.sqlite'"; fi
find "${DATA_DIR}" -maxdepth 1 -type f ! -name 'kraftbaum.sqlite*' -exec cp -a {} "${BACKUP_DIR}/${STAMP}/data/" \;
git fetch origin main
git checkout main
git pull --ff-only origin main
npm ci
npm run lint
npm test
NEW_REVISION="$(node -p "require('./package.json').version")"
sed -i "s/^APP_REVISION=.*/APP_REVISION=${NEW_REVISION}/" /etc/mein-kraftbaum.env
systemctl restart mein-kraftbaum
sleep 2
curl --fail --silent --show-error http://127.0.0.1:3000/api/health >/dev/null
echo "Update erfolgreich: $(git rev-parse --short HEAD)"
