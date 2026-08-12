# Mein Kraftbaum

Web-App für Anjas ganzheitliche Beckenboden-Präsenzkurse. Die App verbindet digitale Anwesenheit, gestaffelte Übungsinhalte, Termine und den persönlich wachsenden Kraftbaum.

## Systemanforderungen

Empfohlen ist ein eigener Proxmox-LXC mit:

- Ubuntu 24.04 LTS
- mindestens 2 CPU-Kerne
- mindestens 2 GB RAM
- zunächst mindestens 20 GB Speicher, bei selbst gehosteten Videos entsprechend mehr
- funktionierender Internet- und DNS-Zugang
- feste IP oder DHCP-Reservierung im lokalen Netz
- Root-Zugang

Node.js, npm, Git, SQLite und alle weiteren benötigten Pakete installiert das Installationsskript selbst. Docker wird nicht verwendet.

## Installation mit einem einzigen Skript

Im frisch vorbereiteten Ubuntu-LXC als `root` anmelden und genau diesen Befehl ausführen:

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/Schello805/Beckenboden/main/deploy/install.sh)
```

Das Skript erledigt automatisch:

1. Installation der Systempakete und Node.js 22
2. Anlage des eingeschränkten Systembenutzers `kraftbaum`
3. Klonen des aktuellen `main`-Branches nach `/opt/mein-kraftbaum`
4. Anlage des geschützten Datenverzeichnisses
5. Generierung von Session-Secret und einmaligem Installationsschlüssel
6. Installation der JavaScript-Abhängigkeiten
7. Produktions-Build der App
8. Installation und Start des systemd-Dienstes
9. automatischen Gesundheitstest

Am Ende wird angezeigt, wie der einmalige Installationsschlüssel abgerufen wird:

```bash
grep INSTALL_TOKEN /etc/mein-kraftbaum.env
```

Diesen Schlüssel im Ersteinrichtungsformular der App eingeben. Die erste dort angelegte Person wird Admin. Sobald ein Admin existiert, ist die Ersteinrichtung dauerhaft geschlossen.

## NPM Plus einrichten

In NPM Plus einen neuen Proxy Host anlegen:

- Domain: `app.anja-tanzt.de`
- Scheme: `http`
- Forward Hostname/IP: IP-Adresse des LXC
- Forward Port: `3000`
- WebSocket Support: aktivieren
- Block Common Exploits: aktivieren

Anschließend im SSL-Bereich:

- neues Let's-Encrypt-Zertifikat anfordern
- Force SSL aktivieren
- HTTP/2 aktivieren
- HSTS erst aktivieren, nachdem HTTPS zuverlässig funktioniert

Die App lauscht innerhalb des Netzes auf Port 3000, damit ein NPM-Plus-System in einem anderen LXC sie erreichen kann. Der Zugriff auf Port 3000 sollte per Proxmox-/Host-Firewall auf die interne IP von NPM Plus begrenzt werden. Port 3000 darf nicht direkt aus dem Internet weitergeleitet werden.

## DNS

Für `app.anja-tanzt.de` einen A-/AAAA-Record auf die öffentliche Adresse des Reverse Proxys setzen. Bei privatem Heimanschluss müssen Port 80 und 443 ausschließlich zum NPM-Plus-System weitergeleitet werden.

## Verwaltung des Dienstes

```bash
systemctl status mein-kraftbaum
journalctl -u mein-kraftbaum -f
systemctl restart mein-kraftbaum
systemctl stop mein-kraftbaum
```

Der Dienst läuft unter dem Benutzer `kraftbaum`. Die Anwendung liegt in `/opt/mein-kraftbaum`, Laufzeitdaten in `/opt/mein-kraftbaum/data` und Secrets in `/etc/mein-kraftbaum.env`.

## Updates

Ein Update lädt ausschließlich den neuesten Stand von `main`, erstellt vorher ein konsistentes SQLite-Backup, installiert Abhängigkeiten, führt Linting, Build und Tests aus und startet den Dienst erst danach neu:

```bash
sudo /opt/mein-kraftbaum/deploy/update.sh
```

Der Updateprozess bricht bei einem Fehler ab. Die laufende Version bleibt bis zum Neustart aktiv. Nach einem erfolgreichen Update wird `/api/health` geprüft.

## Rollback

Das letzte automatische Backup wiederherstellen:

```bash
sudo /opt/mein-kraftbaum/deploy/rollback.sh
```

Ein bestimmtes Backup verwenden:

```bash
sudo /opt/mein-kraftbaum/deploy/rollback.sh /var/backups/mein-kraftbaum/JAHRMONATTAG-STUNDEMINUTESEKUNDE
```

Backups unter `/var/backups/mein-kraftbaum` ersetzen kein externes Backup. Das gesamte Verzeichnis sowie `/etc/mein-kraftbaum.env` müssen zusätzlich verschlüsselt außerhalb des LXC gesichert werden.

## Konfiguration

Die Grundkonfiguration liegt in `/etc/mein-kraftbaum.env`:

```dotenv
SESSION_SECRET=automatisch-generiert
INSTALL_TOKEN=automatisch-generiert
DATA_DIR=/opt/mein-kraftbaum/data
APP_REVISION=aktuelle-version
```

Die Datei darf nur von `root` gelesen werden. Nach manuellen Änderungen den Dienst neu starten.

## Lokale Entwicklung

```bash
cp .env.example .env.local
npm install
npm run dev
```

Vor jedem Push ausführen:

```bash
npm run lint
npm test
```

GitHub Actions führt dieselben Prüfungen automatisch bei jedem Push auf `main` und bei Pull Requests aus.

## Sicherheit und Datenschutz

- Die SQLite-Datenbank und hochgeladene Medien werden niemals in Git eingecheckt.
- Zugangscodes werden nur gehasht gespeichert; Klartextcodes werden ausschließlich bei der Erzeugung ausgegeben.
- Sitzungen verwenden signierte, `HttpOnly`- und `SameSite`-Cookies.
- Adminaktionen und Anwesenheitsänderungen werden protokolliert.
- Externe Fragebögen bleiben anonym und sind nicht mit Benutzerkonten verbunden.
- YouTube- und Vimeo-Inhalte dürfen erst nach Zustimmung geladen werden.
- Vor dem Produktivbetrieb müssen die Rechtstextvorlagen fachlich geprüft werden.

## Projektstatus

Die vereinbarten Produktanforderungen stehen in [docs/PRODUCT.md](docs/PRODUCT.md). Noch offene Produktionsarbeiten werden in [TODO.md](TODO.md) geführt.
