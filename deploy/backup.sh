#!/usr/bin/env bash
set -euo pipefail
APP_DIR="/opt/mein-kraftbaum"
BACKUP_ROOT="/var/backups/mein-kraftbaum"
APP_USER="kraftbaum"
KIND="${1:-daily}"
[[ "${EUID}" -eq 0 ]] || { echo "Bitte als root ausführen." >&2; exit 1; }
[[ "${KIND}" =~ ^(daily|update|manual|pre-restore)$ ]] || { echo "Ungültiger Backup-Typ." >&2; exit 1; }
# shellcheck disable=SC1091
source /etc/mein-kraftbaum.env
STAMP="$(date +%Y%m%d-%H%M%S)"
TARGET="${BACKUP_ROOT}/${STAMP}-${KIND}"
chown root:"${APP_USER}" "${BACKUP_ROOT}"
chmod 0750 "${BACKUP_ROOT}"
install -d -m 0750 "${TARGET}/data"
runuser -u "${APP_USER}" -- git -C "${APP_DIR}" rev-parse HEAD > "${TARGET}/commit"
printf '%s\n' "${KIND}" > "${TARGET}/type"
if [[ -f "${DATA_DIR}/kraftbaum.sqlite" ]]; then
  sqlite3 "${DATA_DIR}/kraftbaum.sqlite" ".backup '${TARGET}/data/kraftbaum.sqlite'"
  [[ "$(sqlite3 "${TARGET}/data/kraftbaum.sqlite" 'PRAGMA integrity_check;')" == "ok" ]] || { echo "SQLite-Backup ist nicht konsistent." >&2; exit 1; }
fi
rsync -a --exclude 'kraftbaum.sqlite' --exclude 'kraftbaum.sqlite-wal' --exclude 'kraftbaum.sqlite-shm' --exclude 'restore-staging/' --exclude 'restore-request.json' --exclude 'restore-status.json' --exclude 'backup-request' "${DATA_DIR}/" "${TARGET}/data/"
REVISION="$(cat "${TARGET}/commit")"
printf '{"format":"mein-kraftbaum-backup","version":1,"createdAt":"%s","kind":"%s","revision":"%s"}\n' "$(date -Iseconds)" "${KIND}" "${REVISION}" > "${TARGET}/manifest.json"
(cd "${TARGET}" && find data -type f -print0 | sort -z | xargs -0 -r sha256sum) > "${TARGET}/checksums.sha256"
chown -R root:"${APP_USER}" "${TARGET}"
chmod -R g+rX,o-rwx "${TARGET}"
BACKUP_ROOT="${BACKUP_ROOT}" DATA_DIR="${DATA_DIR}" node "${APP_DIR}/scripts/prune-backups.mjs" >/dev/null
printf '%s\n' "${TARGET}"
