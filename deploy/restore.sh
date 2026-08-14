#!/usr/bin/env bash
set -euo pipefail
APP_DIR="/opt/mein-kraftbaum"; APP_USER="kraftbaum"; CACHE_ROOT="/var/cache/mein-kraftbaum"
source /etc/mein-kraftbaum.env
REQUEST="${DATA_DIR}/restore-request.json"; STATUS="${DATA_DIR}/restore-status.json"; SERVICE_STOPPED=0; PRE_BACKUP=""; STEP="Vorbereitung"
fail(){ code=$?; trap - ERR; if [[ "${SERVICE_STOPPED}" -eq 1 && -n "${PRE_BACKUP}" && -d "${PRE_BACKUP}/data" ]]; then systemctl stop mein-kraftbaum || true; rsync -a --delete "${PRE_BACKUP}/data/" "${DATA_DIR}/" || true; chown -R "${APP_USER}:${APP_USER}" "${DATA_DIR}"; systemctl start mein-kraftbaum || true; fi; printf '{"status":"failed","step":"%s","exitCode":%d,"finishedAt":"%s"}\n' "${STEP}" "${code}" "$(date -Iseconds)" > "${STATUS}"; chown "${APP_USER}:${APP_USER}" "${STATUS}"; exit "${code}"; }
trap fail ERR
[[ -f "${REQUEST}" ]] || { echo "Kein Restore-Auftrag." >&2; exit 1; }
UPLOAD_ID="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["uploadId"])' "${REQUEST}")"
[[ "${UPLOAD_ID}" =~ ^[0-9a-f-]{36}$ ]] || { echo "Ungültige Upload-ID." >&2; exit 1; }
ARCHIVE="${DATA_DIR}/restore-staging/${UPLOAD_ID}.tar.gz"; EXTRACT="${CACHE_ROOT}/restore-${UPLOAD_ID}"
[[ -f "${ARCHIVE}" ]] || { echo "Restore-Archiv fehlt." >&2; exit 1; }
rm -rf -- "${EXTRACT}"; install -d -o "${APP_USER}" -g "${APP_USER}" -m 0700 "${EXTRACT}"
printf '{"status":"running","step":"Validierung","startedAt":"%s"}\n' "$(date -Iseconds)" > "${STATUS}"; chown "${APP_USER}:${APP_USER}" "${STATUS}"
STEP="Sichere Extraktion"
ROOT_NAME="$(python3 - "${ARCHIVE}" "${EXTRACT}" <<'PY'
import pathlib,sys,tarfile
archive,target=sys.argv[1:]
with tarfile.open(archive,"r:gz") as source:
    members=source.getmembers()
    if not members or len(members)>100000: raise SystemExit("Ungültige Dateianzahl")
    roots=set()
    for member in members:
        path=pathlib.PurePosixPath(member.name)
        if path.is_absolute() or ".." in path.parts or member.issym() or member.islnk() or member.isdev(): raise SystemExit("Unsicherer Archiveintrag")
        if path.parts: roots.add(path.parts[0])
    if len(roots)!=1: raise SystemExit("Ungültiges Stammverzeichnis")
    source.extractall(target,filter="data")
    print(next(iter(roots)))
PY
)"
CONTENT="${EXTRACT}/${ROOT_NAME}"
python3 -c 'import json,sys; m=json.load(open(sys.argv[1])); assert m.get("format")=="mein-kraftbaum-backup" and m.get("version")==1' "${CONTENT}/manifest.json"
(cd "${CONTENT}" && sha256sum -c checksums.sha256)
[[ "$(sqlite3 "${CONTENT}/data/kraftbaum.sqlite" 'PRAGMA integrity_check;')" == "ok" ]]
STEP="Sicherheitsbackup"
PRE_BACKUP="$("${APP_DIR}/deploy/backup.sh" pre-restore)"
rm -f "${REQUEST}"
STEP="Datenwiederherstellung"; systemctl stop mein-kraftbaum; SERVICE_STOPPED=1
rsync -a --delete "${CONTENT}/data/" "${DATA_DIR}/"; chown -R "${APP_USER}:${APP_USER}" "${DATA_DIR}"
systemctl start mein-kraftbaum
STEP="Gesundheitsprüfung"; HEALTHY=0
for attempt in {1..30}; do curl --fail --silent --show-error --max-time 4 http://127.0.0.1:3000/api/health >/dev/null 2>&1 && HEALTHY=1 && break; sleep 1; done
[[ "${HEALTHY}" -eq 1 ]]
SERVICE_STOPPED=0
printf '{"status":"success","source":"%s","safetyBackup":"%s","finishedAt":"%s"}\n' "${UPLOAD_ID}" "$(basename "${PRE_BACKUP}")" "$(date -Iseconds)" > "${STATUS}"; chown "${APP_USER}:${APP_USER}" "${STATUS}"
rm -rf -- "${EXTRACT}" "${DATA_DIR}/restore-staging/${UPLOAD_ID}"; rm -f "${ARCHIVE}"
trap - ERR
