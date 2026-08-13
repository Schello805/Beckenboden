#!/usr/bin/env bash
set -euo pipefail
APP_DIR="/opt/mein-kraftbaum"
APP_USER="kraftbaum"
APP_CACHE="/var/cache/mein-kraftbaum"
source /etc/mein-kraftbaum.env
STATUS_FILE="${DATA_DIR}/update-status.json"
REQUEST_FILE="${DATA_DIR}/update-request"
BACKUP_TARGET=""
STEP="Vorbereitung"
install -d -o "${APP_USER}" -g "${APP_USER}" -m 0750 "${APP_CACHE}" "${APP_CACHE}/npm"
as_app(){ runuser -u "${APP_USER}" -- env HOME="${APP_CACHE}" NPM_CONFIG_CACHE="${APP_CACHE}/npm" "$@"; }
finish_error(){
  exit_code=$?
  trap - ERR
  if [[ -n "${BACKUP_TARGET}" ]] && [[ -d "${BACKUP_TARGET}" ]]; then
    "${APP_DIR}/deploy/rollback.sh" "${BACKUP_TARGET}" || true
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
STEP="Git-Aktualisierung"
as_app git fetch origin main
as_app git checkout main
as_app git pull --ff-only origin main
install -m 0644 "${APP_DIR}/deploy/mein-kraftbaum.service" /etc/systemd/system/mein-kraftbaum.service
install -m 0644 "${APP_DIR}/deploy/mein-kraftbaum-update.service" /etc/systemd/system/mein-kraftbaum-update.service
install -m 0644 "${APP_DIR}/deploy/mein-kraftbaum-update.path" /etc/systemd/system/mein-kraftbaum-update.path
install -m 0644 "${APP_DIR}/deploy/mein-kraftbaum-backup.service" /etc/systemd/system/mein-kraftbaum-backup.service
install -m 0644 "${APP_DIR}/deploy/mein-kraftbaum-backup.timer" /etc/systemd/system/mein-kraftbaum-backup.timer
chmod 0755 "${APP_DIR}/deploy/backup.sh" "${APP_DIR}/deploy/preflight.sh" "${APP_DIR}/deploy/update.sh" "${APP_DIR}/deploy/rollback.sh"
systemctl daemon-reload
systemctl enable --now mein-kraftbaum-backup.timer
systemctl enable --now mein-kraftbaum-update.path
STEP="Paketinstallation"
if ! as_app npm ci; then
  echo "npm-Download fehlgeschlagen; zweiter Versuch in fünf Sekunden ..."
  sleep 5
  as_app npm ci
fi
STEP="Codeprüfung"
as_app npm run lint
as_app npm test
STEP="Produktions-Build"
as_app npm run build
NEW_REVISION="$(node -p "require('./package.json').version")"
sed -i "s/^APP_REVISION=.*/APP_REVISION=${NEW_REVISION}/" /etc/mein-kraftbaum.env
STEP="Neustart"
systemctl restart mein-kraftbaum
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
trap - ERR
echo "Update erfolgreich: $(git rev-parse --short HEAD)"
