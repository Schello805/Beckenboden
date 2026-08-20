#!/usr/bin/env bash
set -euo pipefail
source /etc/mein-kraftbaum.env
BACKUP_ROOT="/var/backups/mein-kraftbaum"
REQUEST="${DATA_DIR}/backup-delete-request"
STATUS="${DATA_DIR}/backup-delete-status.json"
NAME=""
finish_error(){
  code=$?
  printf '{"status":"failed","backup":"%s","message":"Backup konnte nicht sicher gelöscht werden.","exitCode":%d,"finishedAt":"%s"}\n' "${NAME}" "${code}" "$(date -Iseconds)" > "${STATUS}"
  chown kraftbaum:kraftbaum "${STATUS}"
  rm -f "${REQUEST}"
  exit "${code}"
}
trap finish_error ERR
NAME="$(tr -d '\r\n' < "${REQUEST}")"
[[ "${NAME}" =~ ^[0-9]{8}-[0-9]{6}-(daily|update|manual|pre-restore)$ ]]
TARGET="${BACKUP_ROOT}/${NAME}"
[[ -d "${TARGET}" && "$(dirname -- "$(realpath -- "${TARGET}")")" == "${BACKUP_ROOT}" ]]
for service in mein-kraftbaum-backup.service mein-kraftbaum-update.service mein-kraftbaum-restore.service; do
  ! systemctl is-active --quiet "${service}"
done
rm -rf -- "${TARGET}"
rm -f "${REQUEST}"
printf '{"status":"success","backup":"%s","message":"Backup wurde endgültig gelöscht.","finishedAt":"%s"}\n' "${NAME}" "$(date -Iseconds)" > "${STATUS}"
chown kraftbaum:kraftbaum "${STATUS}"
