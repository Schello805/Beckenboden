# Verbindliche V1-Restarbeiten

Der sichtbare Produktstand, die Architektur und das Datenmodell sind angelegt. Vor einem produktiven Einsatz müssen diese Punkte vollständig umgesetzt und abgenommen werden.

## Konten und Sicherheit

- [x] Code-first-Registrierung, Login, Logout und sichere Sessions serverseitig implementieren
- [x] Rate-Limits und Schutz gegen automatisierte Anmeldeversuche ergänzen
- [x] Einmalige Erstinstallation mit Installationsschlüssel und erstem Admin
- [ ] Admin-2FA um E-Mail und Passkey erweitern (TOTP, verschlüsselte Secrets und einmalige Recovery-Codes sind umgesetzt)
- [ ] Passwort-Reset, E-Mail-Verifikation ohne Zugangssperre und persönliche Admin-Wiederherstellung
- [ ] Verschlüsselung sensibler interner Notizen und unveränderbares Audit-Log
- [ ] Kontenverwaltung um Export, Löschung/Anonymisierung und Zusammenführung ergänzen (Adminanlage, verpflichtende 2FA, Sperre und Reaktivierung sind umgesetzt)

## Kurse und Inhalte

- [ ] Bearbeiten, Archivieren und Löschen für Kursvorlagen und öffentliche Events ergänzen
- [x] Kursdurchläufe und Termine über die Admin-UI anlegen
- [x] Individuelle Codes paketweise erzeugen, zuordnen, einlösen und protokollieren
- [ ] Codepakete als CSV und PDF exportieren
- [x] Kurzlebiger, datensparsamer QR-Code der User und serverseitige Scan-Prüfung
- [ ] Kamera-Scanner in der Adminoberfläche ergänzen
- [x] Anwesenheitsliste in der Adminoberfläche mit echten Daten verbinden
- [x] Anwesenheit per Liste, Scan und Papiernachtrag; Korrektur mit Begründung
- [x] Regel-Engine für gestaffelte und manuelle Freischaltung
- [ ] Inhaltseditor um Bearbeiten und Archivieren ergänzen (Anlegen, Entwurf/Veröffentlichung und Zeitstempel sind umgesetzt)
- [x] Geschützte Uploads: Bilder 5 MB, PDF 20 MB und Videos 5 GB mit serverseitiger Zugriffsprüfung
- [x] PDF-Viewer mit Druck, Video-Consent für YouTube/Vimeo und selbst gehostetes Streaming

## Kraftbaum und Dokumente

- [x] Baum- und Kursfortschritt aus realen Teilnahmen berechnen
- [ ] Wachsende Kursäste, Farbvarianten, Sterne, Jahreszeit und Tag/Nacht modularisieren
- [ ] Hochladbare Frau-mit-Katze-Grafik und Admin-Vorschau
- [ ] Kraftbaum-Urkunde und sachliche Teilnahmebestätigung als druckfähige PDFs
- [ ] Download-/Teilkarte ohne personenbezogene Metadaten

## Kommunikation, Datenschutz und Betrieb

- [ ] SMTP-Konfiguration, verschlüsselte Secrets und Testmail im Adminbereich
- [ ] Web Push/FCM-Abstraktion, Präferenzen und Push bei Anwesenheit
- [ ] Support-/Feedbackformulare und Ereignisbenachrichtigungen
- [ ] Matomo-Konfiguration mit IP-Anonymisierung und Ausschluss sensibler Daten
- [ ] Versionierte Rechtstexte samt Consent-Historie und 90%-Entwürfen
- [ ] Cookie-/Anbieter-Consent und blockiertes Laden externer Medien bis zur Zustimmung
- [x] PWA-Manifest, Service Worker, privater Laufzeitcache für Kalender/Inhalte/Medien und Offline-Synchronisation der Anwesenheit
- [ ] Admin-Updateauslösung über minimal privilegierten Systemdienst ergänzen
- [x] CLI-Update mit SQLite-Backup, Healthcheck und Rollback härten
- [ ] Aufbewahrungs- und Löschfristen nach juristischer/steuerlicher Prüfung finalisieren
- [ ] Integrations-, Sicherheits-, Migrations-, Offline- und End-to-End-Tests ergänzen
