# Verbindliche V1-Restarbeiten

Der sichtbare Produktstand, die Architektur und das Datenmodell sind angelegt. Vor einem produktiven Einsatz müssen diese Punkte vollständig umgesetzt und abgenommen werden.

## Konten und Sicherheit

- [x] Code-first-Registrierung, Login, Logout und sichere Sessions serverseitig implementieren
- [x] Rate-Limits und Schutz gegen automatisierte Anmeldeversuche ergänzen
- [x] Einmalige Erstinstallation mit Installationsschlüssel und erstem Admin
- [ ] Admin-2FA um E-Mail und Passkey erweitern (TOTP, verschlüsselte Secrets und einmalige Recovery-Codes sind umgesetzt)
- [ ] Persönliche Admin-Wiederherstellung ergänzen (Passwort-Reset und freiwillige E-Mail-Verifikation ohne Zugangssperre sind umgesetzt)
- [x] Keine personenbezogenen Gesundheitsnotizen in der App; verschlüsselte Secrets und technisch unveränderbares Append-only-Audit-Log
- [x] Kontenverwaltung mit Adminanlage, 2FA, Sperre, Reaktivierung, Export, Anonymisierung und Account-Zusammenführung

## Kurse und Inhalte

- [x] Vollständige Bearbeitungsformulare, Archivierung und sichere Löschregeln für Kurse und öffentliche Events
- [x] Kursdurchläufe und Termine über die Admin-UI anlegen
- [x] Individuelle Codes paketweise erzeugen, zuordnen, einlösen und protokollieren
- [x] Codepakete als CSV und druckfertige PDF-Ansicht exportieren
- [x] Kurzlebiger, datensparsamer QR-Code der User und serverseitige Scan-Prüfung
- [x] Kamera-Scanner mit manueller Fallback-Eingabe in der Adminoberfläche
- [x] Anwesenheitsliste in der Adminoberfläche mit echten Daten verbinden
- [x] Anwesenheit per Liste, Scan und Papiernachtrag; Korrektur mit Begründung
- [x] Regel-Engine für gestaffelte und manuelle Freischaltung
- [x] Vollständiger Inhaltseditor mit Aktualisierung, Freischaltregeln, Archivierung, Entwurf/Veröffentlichung und Zeitstempel
- [x] Geschützte Uploads: Bilder 5 MB, PDF 20 MB und Videos 5 GB mit serverseitiger Zugriffsprüfung
- [x] PDF-Viewer mit Druck, Video-Consent für YouTube/Vimeo und selbst gehostetes Streaming

## Kraftbaum und Dokumente

- [x] Baum- und Kursfortschritt aus realen Teilnahmen berechnen
- [x] Beliebig wachsende Kursäste, Farbvarianten, Abschlusssterne, Jahreszeit und Tag/Nacht
- [x] Hochladbare Frau-mit-Katze-Grafik mit Standardfigur und Admin-Vorschau
- [x] Kraftbaum-Urkunde und sachliche Teilnahmebestätigung als druckfähige PDF-Ansichten
- [ ] Download-/Teilkarte ohne personenbezogene Metadaten

## Kommunikation, Datenschutz und Betrieb

- [x] SMTP-Konfiguration, verschlüsselte Secrets und Testmail im Adminbereich
- [x] Selbst gehostetes Web Push mit VAPID, Nutzerpräferenzen und Push bei Anwesenheit
- [ ] Weitere Ereignisbenachrichtigungen ergänzen (Anwesenheits-Push, Support, Feedback und Nachholanfragen sind umgesetzt)
- [x] Matomo-Konfiguration mit IP-Anonymisierung, cookielosem Betrieb und Ausschluss sensibler Daten
- [x] Versionierte Rechtstexte samt Consent-Historie und deutlich gekennzeichneten prüfbedürftigen Entwürfen
- [x] Cookie-/Anbieter-Consent und blockiertes Laden externer Medien bis zur Zustimmung
- [x] PWA-Manifest, Service Worker, privater Laufzeitcache für Kalender/Inhalte/Medien und Offline-Synchronisation der Anwesenheit
- [x] Admin-Updateprüfung und -auslösung über eng begrenzten systemd-Dienst und sudo-Regel
- [x] CLI-Update mit SQLite-Backup, Healthcheck und Rollback härten
- [ ] Aufbewahrungs- und Löschfristen nach juristischer/steuerlicher Prüfung finalisieren
- [ ] Integrations-, Sicherheits-, Migrations-, Offline- und End-to-End-Tests ergänzen
