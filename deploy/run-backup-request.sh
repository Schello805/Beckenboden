#!/usr/bin/env bash
set -euo pipefail
source /etc/mein-kraftbaum.env
REQUEST="${DATA_DIR}/backup-request"; STATUS="${DATA_DIR}/backup-status.json"
trap 'code=$?; printf "{\"status\":\"failed\",\"exitCode\":%d,\"finishedAt\":\"%s\"}\n" "${code}" "$(date -Iseconds)" > "${STATUS}"; chown kraftbaum:kraftbaum "${STATUS}"; rm -f "${REQUEST}"; exit "${code}"' ERR
printf '{"status":"running","startedAt":"%s"}\n' "$(date -Iseconds)" > "${STATUS}"; chown kraftbaum:kraftbaum "${STATUS}"
TARGET="$(/opt/mein-kraftbaum/deploy/backup.sh manual)"
rm -f "${REQUEST}"
printf '{"status":"success","backup":"%s","finishedAt":"%s"}\n' "$(basename "${TARGET}")" "$(date -Iseconds)" > "${STATUS}"; chown kraftbaum:kraftbaum "${STATUS}"
