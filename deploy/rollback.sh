#!/usr/bin/env bash
set -euo pipefail
APP_DIR="/opt/mein-kraftbaum"
BACKUP_DIR="/var/backups/mein-kraftbaum"
APP_USER="kraftbaum"
APP_CACHE="/var/cache/mein-kraftbaum"
TARGET="${1:-$(find "${BACKUP_DIR}" -mindepth 1 -maxdepth 1 -type d | sort | tail -1)}"
install -d -o "${APP_USER}" -g "${APP_USER}" -m 0750 "${APP_CACHE}" "${APP_CACHE}/npm"
as_app(){ runuser -u "${APP_USER}" -- env HOME="${APP_CACHE}" NPM_CONFIG_CACHE="${APP_CACHE}/npm" "$@"; }
[[ -f "${TARGET}/commit" ]] || { echo "Kein gültiges Backup: ${TARGET}"; exit 1; }
cd "${APP_DIR}"
as_app git checkout "$(cat "${TARGET}/commit")"
as_app npm ci
as_app npm run build
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
