# Verbindliche V1-Restarbeiten

Der sichtbare Produktstand, die Architektur und das Datenmodell sind angelegt. Vor einem produktiven Einsatz müssen diese Punkte vollständig umgesetzt und abgenommen werden.

## Konten und Sicherheit

- [x] Code-first-Registrierung, Login, Logout und sichere Sessions serverseitig implementieren
- [ ] Rate-Limits und Schutz gegen automatisierte Anmeldeversuche ergänzen
- [x] Einmalige Erstinstallation mit Installationsschlüssel und erstem Admin
- [ ] Admin-2FA: TOTP, E-Mail und Passkey wählbar; Recovery-Codes und sicherer Wiederherstellungsweg
- [ ] Passwort-Reset, E-Mail-Verifikation ohne Zugangssperre und persönliche Admin-Wiederherstellung
- [ ] Verschlüsselung sensibler interner Notizen und unveränderbares Audit-Log
- [ ] Adminverwaltung, Kontosperre, Export, Löschung/Anonymisierung und Account-Zusammenführung

## Kurse und Inhalte

- [ ] Vollständiges CRUD für Kursvorlagen, Termine, Orte und öffentliche Events (Kursanlage-API ist vorhanden)
- [x] Individuelle Codes paketweise erzeugen, zuordnen, einlösen und protokollieren
- [ ] Codepakete als CSV und PDF exportieren
- [ ] QR-Code der User und Scanner im Adminbereich
- [ ] Anwesenheit per Liste, Scan und Papiernachtrag; Korrektur mit Begründung
- [ ] Regel-Engine für gestaffelte und manuelle Freischaltung
- [ ] Modularen Inhaltseditor mit Entwurf, Veröffentlichung, Archiv und Zeitstempel implementieren
- [ ] Geschützte Uploads: Bilder 5 MB, PDF 20 MB, Videos 5 GB; signierte Zugriffe
- [ ] PDF-Viewer mit Druck, Video-Consent für YouTube/Vimeo, selbst gehostetes Streaming

## Kraftbaum und Dokumente

- [ ] Baumzustand dauerhaft aus realen Teilnahmen berechnen
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
- [ ] PWA-Manifest, Service Worker und Offline-Synchronisation für Kalender, Texte, Bilder und Stempelkarte
- [ ] Admin-Updateauslösung über minimal privilegierten Systemdienst; Backup, Healthcheck und Rollback härten
- [ ] Aufbewahrungs- und Löschfristen nach juristischer/steuerlicher Prüfung finalisieren
- [ ] Integrations-, Sicherheits-, Migrations-, Offline- und End-to-End-Tests ergänzen
