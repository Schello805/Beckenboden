#!/usr/bin/env bash
set -euo pipefail
APP_DIR="/opt/mein-kraftbaum"
BACKUP_DIR="/var/backups/mein-kraftbaum"
TARGET="${1:-$(find "${BACKUP_DIR}" -mindepth 1 -maxdepth 1 -type d | sort | tail -1)}"
[[ -f "${TARGET}/commit" ]] || { echo "Kein gültiges Backup: ${TARGET}"; exit 1; }
cd "${APP_DIR}"
git checkout "$(cat "${TARGET}/commit")"
npm ci
npm run build
[[ -d "${TARGET}/data" ]] && rsync -a --delete "${TARGET}/data/" data/
systemctl restart mein-kraftbaum
echo "Rollback abgeschlossen."
