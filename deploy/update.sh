#!/usr/bin/env bash
set -euo pipefail
APP_DIR="/opt/mein-kraftbaum"
BACKUP_DIR="/var/backups/mein-kraftbaum"
STAMP="$(date +%Y%m%d-%H%M%S)"
APP_USER="kraftbaum"
source /etc/mein-kraftbaum.env
STATUS_FILE="${DATA_DIR}/update-status.json"
finish_error(){ printf '{"status":"failed","finishedAt":"%s"}\n' "$(date -Iseconds)" > "${STATUS_FILE}"; chown "${APP_USER}:${APP_USER}" "${STATUS_FILE}"; }
trap finish_error ERR
printf '{"status":"running","startedAt":"%s"}\n' "$(date -Iseconds)" > "${STATUS_FILE}"
chown "${APP_USER}:${APP_USER}" "${STATUS_FILE}"
mkdir -p "${BACKUP_DIR}/${STAMP}"
cd "${APP_DIR}"
git rev-parse HEAD > "${BACKUP_DIR}/${STAMP}/commit"
mkdir -p "${BACKUP_DIR}/${STAMP}/data"
if [[ -f "${DATA_DIR}/kraftbaum.sqlite" ]]; then sqlite3 "${DATA_DIR}/kraftbaum.sqlite" ".backup '${BACKUP_DIR}/${STAMP}/data/kraftbaum.sqlite'"; fi
find "${DATA_DIR}" -maxdepth 1 -type f ! -name 'kraftbaum.sqlite*' -exec cp -a {} "${BACKUP_DIR}/${STAMP}/data/" \;
runuser -u "${APP_USER}" -- git fetch origin main
runuser -u "${APP_USER}" -- git checkout main
runuser -u "${APP_USER}" -- git pull --ff-only origin main
runuser -u "${APP_USER}" -- npm ci
runuser -u "${APP_USER}" -- npm run lint
runuser -u "${APP_USER}" -- npm test
NEW_REVISION="$(node -p "require('./package.json').version")"
sed -i "s/^APP_REVISION=.*/APP_REVISION=${NEW_REVISION}/" /etc/mein-kraftbaum.env
systemctl restart mein-kraftbaum
sleep 2
curl --fail --silent --show-error http://127.0.0.1:3000/api/health >/dev/null
printf '{"status":"success","revision":"%s","finishedAt":"%s"}\n' "${NEW_REVISION}" "$(date -Iseconds)" > "${STATUS_FILE}"
chown "${APP_USER}:${APP_USER}" "${STATUS_FILE}"
trap - ERR
echo "Update erfolgreich: $(git rev-parse --short HEAD)"
