#!/usr/bin/env bash
set -euo pipefail
APP_DIR="/opt/mein-kraftbaum"
BACKUP_ROOT="/var/backups/mein-kraftbaum"
APP_USER="kraftbaum"
KIND="${1:-daily}"
[[ "${EUID}" -eq 0 ]] || { echo "Bitte als root ausführen." >&2; exit 1; }
[[ "${KIND}" =~ ^(daily|update|manual)$ ]] || { echo "Ungültiger Backup-Typ." >&2; exit 1; }
# shellcheck disable=SC1091
source /etc/mein-kraftbaum.env
STAMP="$(date +%Y%m%d-%H%M%S)"
TARGET="${BACKUP_ROOT}/${STAMP}-${KIND}"
install -d -m 0750 "${TARGET}/data"
runuser -u "${APP_USER}" -- git -C "${APP_DIR}" rev-parse HEAD > "${TARGET}/commit"
printf '%s\n' "${KIND}" > "${TARGET}/type"
if [[ -f "${DATA_DIR}/kraftbaum.sqlite" ]]; then
  sqlite3 "${DATA_DIR}/kraftbaum.sqlite" ".backup '${TARGET}/data/kraftbaum.sqlite'"
  [[ "$(sqlite3 "${TARGET}/data/kraftbaum.sqlite" 'PRAGMA integrity_check;')" == "ok" ]] || { echo "SQLite-Backup ist nicht konsistent." >&2; exit 1; }
fi
rsync -a --exclude 'kraftbaum.sqlite' --exclude 'kraftbaum.sqlite-wal' --exclude 'kraftbaum.sqlite-shm' "${DATA_DIR}/" "${TARGET}/data/"
KEEP_DAYS="${BACKUP_KEEP_DAYS:-30}"
[[ "${KEEP_DAYS}" =~ ^[0-9]+$ ]] && [[ "${KEEP_DAYS}" -ge 1 ]] || { echo "BACKUP_KEEP_DAYS muss eine positive ganze Zahl sein." >&2; exit 1; }
find "${BACKUP_ROOT}" -mindepth 1 -maxdepth 1 -type d -name '*-daily' -mtime "+${KEEP_DAYS}" -exec rm -rf -- {} +
printf '%s\n' "${TARGET}"
