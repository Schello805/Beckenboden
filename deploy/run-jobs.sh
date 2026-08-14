#!/usr/bin/env bash
set -euo pipefail
source /etc/mein-kraftbaum.env
curl --fail --silent --show-error --max-time 55 -X POST -H "Authorization: Bearer ${INTERNAL_JOB_TOKEN}" http://127.0.0.1:3000/api/internal/jobs >/dev/null
