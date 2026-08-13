#!/usr/bin/env bash
set -uo pipefail

APP_DIR="/opt/mein-kraftbaum"
ENV_FILE="/etc/mein-kraftbaum.env"
APP_USER="kraftbaum"
ERRORS=0
WARNINGS=0
ok(){ printf 'OK      %s\n' "$1"; }
warn(){ printf 'WARNUNG %s\n' "$1"; WARNINGS=$((WARNINGS+1)); }
fail(){ printf 'FEHLER  %s\n' "$1"; ERRORS=$((ERRORS+1)); }

[[ "${EUID}" -eq 0 ]] || { echo "Bitte als root ausführen."; exit 1; }
command -v node >/dev/null 2>&1 && [[ "$(node -p 'Number(process.versions.node.split(`.`)[0])')" -ge 22 ]] && ok "Node.js 22 oder neuer" || fail "Node.js 22 oder neuer fehlt"
command -v sqlite3 >/dev/null 2>&1 && ok "SQLite-Werkzeug vorhanden" || fail "sqlite3 fehlt"
id "${APP_USER}" >/dev/null 2>&1 && ok "Systembenutzer ${APP_USER} vorhanden" || fail "Systembenutzer ${APP_USER} fehlt"
[[ -d "${APP_DIR}/.git" ]] && ok "Anwendungsrepository vorhanden" || fail "Repository unter ${APP_DIR} fehlt"

if [[ -f "${ENV_FILE}" ]]; then
  mode="$(stat -c '%a' "${ENV_FILE}")"
  [[ "${mode}" == "600" ]] && ok "Konfigurationsdatei ist nur für root lesbar" || fail "${ENV_FILE} hat Modus ${mode} statt 600"
  # shellcheck disable=SC1090
  source "${ENV_FILE}"
  session_secret="${SESSION_SECRET:-}"
  [[ "${#session_secret}" -ge 32 ]] && ok "Session-Secret ist ausreichend lang" || fail "SESSION_SECRET fehlt oder ist zu kurz"
  [[ -n "${INSTALL_TOKEN:-}" ]] && ok "Installationsschlüssel vorhanden" || fail "INSTALL_TOKEN fehlt"
  [[ "${APP_URL:-}" == https://* ]] && ok "Öffentliche HTTPS-URL gesetzt" || warn "APP_URL ist nicht HTTPS; Passkeys und sichere Browserfunktionen bleiben eingeschränkt"
  [[ -d "${DATA_DIR:-}" ]] && runuser -u "${APP_USER}" -- test -w "${DATA_DIR:-}" && ok "Datenverzeichnis vorhanden und für die App beschreibbar" || fail "DATA_DIR fehlt oder ist für die App nicht beschreibbar"
  [[ "$(stat -c '%U' "${DATA_DIR:-/missing}" 2>/dev/null)" == "${APP_USER}" ]] && ok "Datenverzeichnis gehört ${APP_USER}" || fail "Datenverzeichnis gehört nicht ${APP_USER}"
else
  fail "${ENV_FILE} fehlt"
fi

systemctl cat mein-kraftbaum.service >/dev/null 2>&1 && ok "systemd-Dienst installiert" || fail "systemd-Dienst fehlt"
systemctl is-enabled --quiet mein-kraftbaum-backup.timer && ok "Täglicher Backup-Timer ist aktiviert" || warn "Täglicher Backup-Timer ist nicht aktiviert"
latest_backup="$(find /var/backups/mein-kraftbaum -mindepth 1 -maxdepth 1 -type d -name '*-daily' -mtime -2 -print -quit 2>/dev/null)"
[[ -n "${latest_backup}" ]] && ok "Aktuelles Tagesbackup vorhanden" || warn "Noch kein Tagesbackup der letzten 48 Stunden vorhanden"
if systemctl is-active --quiet mein-kraftbaum.service; then
  ok "Anwendungsdienst läuft"
  health_json="$(curl --fail --silent --show-error --max-time 5 http://127.0.0.1:3000/api/health 2>/dev/null || true)"
  [[ -n "${health_json}" ]] && ok "Lokaler Gesundheitstest erfolgreich" || fail "Lokaler Gesundheitstest fehlgeschlagen"
  expected_revision="$(node -p "require('${APP_DIR}/package.json').version" 2>/dev/null || true)"
  [[ "${health_json}" == *"\"revision\":\"${expected_revision}\""* ]] && [[ "${health_json}" == *"smtp-before-2fa"* ]] && ok "Laufender Prozess verwendet Revision ${expected_revision} mit SMTP-Bootstrap" || fail "Laufender Prozess entspricht nicht dem installierten Code ${expected_revision}; Installation erneut ausführen"
else
  warn "Anwendungsdienst läuft derzeit nicht"
fi

printf '\nErgebnis: %d Fehler, %d Warnungen\n' "${ERRORS}" "${WARNINGS}"
[[ "${ERRORS}" -eq 0 ]]
