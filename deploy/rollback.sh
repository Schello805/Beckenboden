#!/usr/bin/env bash
set -euo pipefail
APP_DIR="/opt/mein-kraftbaum"
BACKUP_DIR="/var/backups/mein-kraftbaum"
APP_USER="kraftbaum"
TARGET="${1:-$(find "${BACKUP_DIR}" -mindepth 1 -maxdepth 1 -type d | sort | tail -1)}"
[[ -f "${TARGET}/commit" ]] || { echo "Kein gültiges Backup: ${TARGET}"; exit 1; }
cd "${APP_DIR}"
runuser -u "${APP_USER}" -- git checkout "$(cat "${TARGET}/commit")"
runuser -u "${APP_USER}" -- npm ci
runuser -u "${APP_USER}" -- npm run build
systemctl stop mein-kraftbaum
[[ -d "${TARGET}/data" ]] && rsync -a --delete "${TARGET}/data/" data/
chown -R "${APP_USER}:${APP_USER}" data
systemctl restart mein-kraftbaum
for attempt in {1..20}; do
  if curl --fail --silent --show-error --max-time 3 http://127.0.0.1:3000/api/health >/dev/null 2>&1; then echo "Rollback abgeschlossen."; exit 0; fi
  sleep 1
done
echo "Rollback gestartet, aber Gesundheitstest fehlgeschlagen." >&2
exit 1
