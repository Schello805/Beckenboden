# CRUD-Matrix

Stand: automatisiert geprüft mit Playwright gegen eine isolierte SQLite-Datenbank.

| Datentyp | Erstellen | Lesen | Ändern | Löschen / fachliche Alternative |
| --- | --- | --- | --- | --- |
| Benutzer | Registrierung oder Adminanlage | Adminliste und Profil | Profiländerung, Sperren und Reaktivieren | Datenschutz-Löschung sowie Kontenzusammenführung; Nachweise bleiben pseudonymisiert |
| Admins | Adminanlage | Adminliste | Sperren und Reaktivieren | Letzter aktiver Admin ist geschützt |
| Kurse | Ja | Ja | Ja, einschließlich Archivierung | Endgültig mit Bestätigung; Nachweise werden vorher archiviert |
| Kurstermine | Einzeln oder als Serie | Ja | Ja | Ja |
| Events | Ja | Ja | Ja, einschließlich Archivierung | Ja |
| Zugangscodes | Ja | Nur Metadaten und Audit-Hinweis | Keine Änderung geheimer Einmalcodes | Verbrauchte Codes bleiben als Nachweis; unbenutzte Codes verschwinden mit dem Kurs |
| Kursinhalte | Ja | Ja | Ja, einschließlich Freischaltregel | Ja |
| Medien | Upload | Berechtigte Auslieferung | Ersetzen am verwendenden Datensatz | Referenzgebunden; verwaiste Dateien werden nicht als fachlicher Datensatz angeboten |
| Baumstufen | Standard oder Upload | Ja | Bild und Spruch ersetzen | Rückkehr zum Standardbild |
| Baumdekorationen | Ja | Ja | Position, Größe, Drehung, Text und Status | Ja |
| Anwesenheit | Erfassen | Teilnehmer- und Adminansicht | Korrigieren/entfernen mit Auditspur | Gesetzlicher Nachweis wird nicht spurlos gelöscht |
| Rechtsdokumente | Neue Version | Aktuelle und veröffentlichte Version | Als neue Version veröffentlichen | Veröffentlichte Fassungen bleiben nachvollziehbar |
| Einstellungen | Initialwert | Ja | Ja | Auf Standardwert zurücksetzen, sofern fachlich vorgesehen |
| Auditprotokoll | Automatisch | Ja | Nein | Nein; technisch append-only geschützt |
| Backups | Manuell, täglich und vor Update | Liste und Download | Nicht sinnvoll | Löschung nach Aufbewahrungsregel auf dem Server |

Die absichtlichen Ausnahmen verhindern, dass sicherheitsrelevante oder gesetzlich benötigte Nachweise unbemerkt verändert werden. Sie gelten daher als vollständiger fachlicher Lebenszyklus, obwohl sie kein klassisches technisches CRUD anbieten.

