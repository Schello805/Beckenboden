#!/usr/bin/env bash
set -euo pipefail
APP_DIR="/opt/mein-kraftbaum"
APP_USER="kraftbaum"
source /etc/mein-kraftbaum.env
STATUS_FILE="${DATA_DIR}/update-status.json"
BACKUP_TARGET=""
finish_error(){
  trap - ERR
  if [[ -n "${BACKUP_TARGET}" ]] && [[ -d "${BACKUP_TARGET}" ]]; then
    "${APP_DIR}/deploy/rollback.sh" "${BACKUP_TARGET}" || true
  fi
  printf '{"status":"failed","rollbackAttempted":%s,"finishedAt":"%s"}\n' "$([[ -n "${BACKUP_TARGET}" ]] && echo true || echo false)" "$(date -Iseconds)" > "${STATUS_FILE}"
  chown "${APP_USER}:${APP_USER}" "${STATUS_FILE}"
}
trap finish_error ERR
printf '{"status":"running","startedAt":"%s"}\n' "$(date -Iseconds)" > "${STATUS_FILE}"
chown "${APP_USER}:${APP_USER}" "${STATUS_FILE}"
cd "${APP_DIR}"
BACKUP_TARGET="$("${APP_DIR}/deploy/backup.sh" update)"
runuser -u "${APP_USER}" -- git fetch origin main
runuser -u "${APP_USER}" -- git checkout main
runuser -u "${APP_USER}" -- git pull --ff-only origin main
install -m 0644 "${APP_DIR}/deploy/mein-kraftbaum.service" /etc/systemd/system/mein-kraftbaum.service
install -m 0644 "${APP_DIR}/deploy/mein-kraftbaum-update.service" /etc/systemd/system/mein-kraftbaum-update.service
install -m 0644 "${APP_DIR}/deploy/mein-kraftbaum-backup.service" /etc/systemd/system/mein-kraftbaum-backup.service
install -m 0644 "${APP_DIR}/deploy/mein-kraftbaum-backup.timer" /etc/systemd/system/mein-kraftbaum-backup.timer
chmod 0755 "${APP_DIR}/deploy/backup.sh" "${APP_DIR}/deploy/preflight.sh" "${APP_DIR}/deploy/update.sh" "${APP_DIR}/deploy/rollback.sh"
systemctl daemon-reload
systemctl enable --now mein-kraftbaum-backup.timer
if ! runuser -u "${APP_USER}" -- npm ci; then
  echo "npm-Download fehlgeschlagen; zweiter Versuch in fünf Sekunden ..."
  sleep 5
  runuser -u "${APP_USER}" -- npm ci
fi
runuser -u "${APP_USER}" -- npm run lint
runuser -u "${APP_USER}" -- npm test
NEW_REVISION="$(node -p "require('./package.json').version")"
sed -i "s/^APP_REVISION=.*/APP_REVISION=${NEW_REVISION}/" /etc/mein-kraftbaum.env
systemctl restart mein-kraftbaum
HEALTHY=0
for attempt in {1..20}; do
  if curl --fail --silent --show-error --max-time 3 http://127.0.0.1:3000/api/health >/dev/null 2>&1; then HEALTHY=1; break; fi
  sleep 1
done
[[ "${HEALTHY}" -eq 1 ]] || { journalctl -u mein-kraftbaum -n 50 --no-pager >&2; false; }
printf '{"status":"success","revision":"%s","finishedAt":"%s"}\n' "${NEW_REVISION}" "$(date -Iseconds)" > "${STATUS_FILE}"
chown "${APP_USER}:${APP_USER}" "${STATUS_FILE}"
trap - ERR
echo "Update erfolgreich: $(git rev-parse --short HEAD)"
