#!/usr/bin/env bash
set -euo pipefail
APP_DIR="/opt/mein-kraftbaum"
APP_USER="kraftbaum"
APP_CACHE="/var/cache/mein-kraftbaum"
CANDIDATE_DIR="${APP_CACHE}/release-candidate"
source /etc/mein-kraftbaum.env
STATUS_FILE="${DATA_DIR}/update-status.json"
REQUEST_FILE="${DATA_DIR}/update-request"
BACKUP_TARGET=""
RUNTIME_SWAP_STARTED=0
STEP="Vorbereitung"
install -d -o "${APP_USER}" -g "${APP_USER}" -m 0750 "${APP_CACHE}" "${APP_CACHE}/npm"
as_app(){ runuser -u "${APP_USER}" -- env HOME="${APP_CACHE}" NPM_CONFIG_CACHE="${APP_CACHE}/npm" "$@"; }
finish_error(){
  exit_code=$?
  trap - ERR
  if [[ -n "${BACKUP_TARGET}" ]] && [[ -d "${BACKUP_TARGET}" ]]; then
    if [[ "${RUNTIME_SWAP_STARTED}" -eq 1 ]]; then
      "${APP_DIR}/deploy/rollback.sh" "${BACKUP_TARGET}" || true
    elif [[ -f "${BACKUP_TARGET}/commit" ]]; then
      as_app git -C "${APP_DIR}" checkout "$(cat "${BACKUP_TARGET}/commit")" || true
    fi
  fi
  printf '{"status":"failed","failureStep":"%s","exitCode":%d,"rollbackAttempted":%s,"finishedAt":"%s"}\n' "${STEP}" "${exit_code}" "$([[ -n "${BACKUP_TARGET}" ]] && echo true || echo false)" "$(date -Iseconds)" > "${STATUS_FILE}"
  chown "${APP_USER}:${APP_USER}" "${STATUS_FILE}"
}
trap finish_error ERR
rm -f "${REQUEST_FILE}"
printf '{"status":"running","startedAt":"%s"}\n' "$(date -Iseconds)" > "${STATUS_FILE}"
chown "${APP_USER}:${APP_USER}" "${STATUS_FILE}"
cd "${APP_DIR}"
STEP="Backup"
BACKUP_TARGET="$("${APP_DIR}/deploy/backup.sh" update)"
chown -R root:"${APP_USER}" /var/backups/mein-kraftbaum
chmod -R g+rX,o-rwx /var/backups/mein-kraftbaum
STEP="Git-Aktualisierung"
as_app git fetch origin main
as_app git checkout main
as_app git pull --ff-only origin main
install -m 0644 "${APP_DIR}/deploy/mein-kraftbaum.service" /etc/systemd/system/mein-kraftbaum.service
install -m 0644 "${APP_DIR}/deploy/mein-kraftbaum-update.service" /etc/systemd/system/mein-kraftbaum-update.service
install -m 0644 "${APP_DIR}/deploy/mein-kraftbaum-update.path" /etc/systemd/system/mein-kraftbaum-update.path
install -m 0644 "${APP_DIR}/deploy/mein-kraftbaum-backup.service" /etc/systemd/system/mein-kraftbaum-backup.service
install -m 0644 "${APP_DIR}/deploy/mein-kraftbaum-backup.timer" /etc/systemd/system/mein-kraftbaum-backup.timer
install -m 0644 "${APP_DIR}/deploy/mein-kraftbaum-jobs.service" /etc/systemd/system/mein-kraftbaum-jobs.service
install -m 0644 "${APP_DIR}/deploy/mein-kraftbaum-jobs.timer" /etc/systemd/system/mein-kraftbaum-jobs.timer
install -m 0644 "${APP_DIR}/deploy/mein-kraftbaum-restore.service" /etc/systemd/system/mein-kraftbaum-restore.service
install -m 0644 "${APP_DIR}/deploy/mein-kraftbaum-restore.path" /etc/systemd/system/mein-kraftbaum-restore.path
install -m 0644 "${APP_DIR}/deploy/mein-kraftbaum-backup-request.service" /etc/systemd/system/mein-kraftbaum-backup-request.service
install -m 0644 "${APP_DIR}/deploy/mein-kraftbaum-backup-request.path" /etc/systemd/system/mein-kraftbaum-backup-request.path
chmod 0755 "${APP_DIR}/deploy/backup.sh" "${APP_DIR}/deploy/preflight.sh" "${APP_DIR}/deploy/update.sh" "${APP_DIR}/deploy/rollback.sh" "${APP_DIR}/deploy/run-jobs.sh" "${APP_DIR}/deploy/restore.sh" "${APP_DIR}/deploy/run-backup-request.sh"
systemctl daemon-reload
systemctl enable --now mein-kraftbaum-backup.timer
systemctl enable --now mein-kraftbaum-update.path
systemctl enable --now mein-kraftbaum-jobs.timer
systemctl enable --now mein-kraftbaum-restore.path
systemctl enable --now mein-kraftbaum-backup-request.path
STEP="Paketinstallation"
rm -rf -- "${CANDIDATE_DIR}"
install -d -o "${APP_USER}" -g "${APP_USER}" -m 0750 "${CANDIDATE_DIR}"
rsync -a --delete --exclude '.git' --exclude '.next' --exclude 'node_modules' --exclude 'data' "${APP_DIR}/" "${CANDIDATE_DIR}/"
if ! as_app npm ci --prefix "${CANDIDATE_DIR}"; then
  echo "npm-Download fehlgeschlagen; zweiter Versuch in fünf Sekunden ..."
  sleep 5
  as_app npm ci --prefix "${CANDIDATE_DIR}"
fi
STEP="Codeprüfung"
as_app npm run lint --prefix "${CANDIDATE_DIR}"
as_app npm test --prefix "${CANDIDATE_DIR}"
NEW_REVISION="$(node -p "require('./package.json').version")"
sed -i "s/^APP_REVISION=.*/APP_REVISION=${NEW_REVISION}/" /etc/mein-kraftbaum.env
STEP="Atomarer Laufzeitwechsel"
if [[ -d "${APP_DIR}/.next/static" ]]; then
  rsync -a --ignore-existing "${APP_DIR}/.next/static/" "${CANDIDATE_DIR}/.next/static/"
fi
RUNTIME_SWAP_STARTED=1
systemctl stop mein-kraftbaum
rm -rf -- "${APP_DIR}/.next-previous" "${APP_DIR}/node_modules-previous"
[[ ! -d "${APP_DIR}/.next" ]] || mv "${APP_DIR}/.next" "${APP_DIR}/.next-previous"
[[ ! -d "${APP_DIR}/node_modules" ]] || mv "${APP_DIR}/node_modules" "${APP_DIR}/node_modules-previous"
mv "${CANDIDATE_DIR}/.next" "${APP_DIR}/.next"
mv "${CANDIDATE_DIR}/node_modules" "${APP_DIR}/node_modules"
chown -R "${APP_USER}:${APP_USER}" "${APP_DIR}/.next" "${APP_DIR}/node_modules"
systemctl start mein-kraftbaum
STEP="Gesundheitsprüfung"
HEALTHY=0
for attempt in {1..20}; do
  ROOT_HTML="$(curl --fail --silent --show-error --max-time 5 http://127.0.0.1:3000/ 2>/dev/null || true)"
  ASSETS_OK=1
  ASSET_COUNT=0
  while IFS= read -r asset; do
    [[ -n "${asset}" ]] || continue
    ASSET_COUNT=$((ASSET_COUNT + 1))
    curl --fail --silent --show-error --max-time 5 "http://127.0.0.1:3000${asset}" >/dev/null 2>&1 || ASSETS_OK=0
  done < <(printf '%s' "${ROOT_HTML}" | grep -oE '/_next/static/[^" ]+\.(css|js)' | sort -u)
  if curl --fail --silent --show-error --max-time 3 http://127.0.0.1:3000/api/health >/dev/null 2>&1 \
    && [[ -n "${ROOT_HTML}" ]] && [[ "${ASSET_COUNT}" -gt 0 ]] && [[ "${ASSETS_OK}" -eq 1 ]]; then
    HEALTHY=1
    break
  fi
  sleep 1
done
[[ "${HEALTHY}" -eq 1 ]] || { journalctl -u mein-kraftbaum -n 50 --no-pager >&2; false; }
printf '{"status":"success","revision":"%s","finishedAt":"%s"}\n' "${NEW_REVISION}" "$(date -Iseconds)" > "${STATUS_FILE}"
chown "${APP_USER}:${APP_USER}" "${STATUS_FILE}"
rm -rf -- "${APP_DIR}/.next-previous" "${APP_DIR}/node_modules-previous" "${CANDIDATE_DIR}"
trap - ERR
echo "Update erfolgreich: $(git rev-parse --short HEAD)"
