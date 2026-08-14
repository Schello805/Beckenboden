# CRUD-Prüfung

Stand: Revision 0.36.4

| Datensatz | Anlegen | Anzeigen | Ändern | Löschen/Stilllegen | Hinweis |
| --- | --- | --- | --- | --- | --- |
| Kurse | ja | ja | ja | archivieren und endgültig löschen | Anwesenheiten werden vorher archiviert |
| Kurstermine | ja | ja | ja | ja | Anwesenheiten werden vorher archiviert |
| Veranstaltungen | ja | ja | ja | archivieren und endgültig löschen | Titelbilder eingeschlossen |
| Kursinhalte | ja | ja | ja | ja | Regeln und manuelle Freischaltungen werden mit entfernt |
| Nutzerprofile | ja | ja | Profil durch Nutzer, Status durch Admin | sperren oder zusammenführen | Keine unkontrollierte Admin-Löschung wegen Kurs- und Nachweisbezügen |
| Admin-Konten | ja | ja | Profil durch jeweiligen Admin | sperren | Letzter aktiver Admin ist geschützt |
| Zugangscodes | ja | nach Erstellung im Audit | nicht im Klartext änderbar | mit Kurslöschung; Einlösung ist endgültig | Geheimnisse werden absichtlich nicht als gewöhnliche Datensätze zurückgegeben |
| Anwesenheiten | ja | ja | durch Entfernen und Neuerfassen | ja, danach ggf. pseudonymes Archiv | Aufbewahrungspflichten bleiben erhalten |
| Baumstufen und Sprüche | ja/ersetzen | ja | ja | auf Standard zurücksetzen | globale Erscheinungsbild-Einstellung |
| Baumdekorationen | ja | ja | ja | ja | inklusive manueller Freischaltungen |
| Rechtstexte | neue Version | ja | als neue Version | nein | veröffentlichte Fassungen bleiben revisionssicher |
| Auditprotokoll | automatisch | ja | nein | nein | absichtlich unveränderbar |
| SMTP, Matomo, Push, Fristen | konfigurieren | ja | ja | leeren/deaktivieren | singletonartige Einstellungen, keine Datensatzliste |

Nicht jede Entität darf klassisches CRUD anbieten: Auditprotokoll, veröffentlichte Rechtstexte, eingelöste Codes und aufbewahrungspflichtige Nachweise sind bewusst unveränderbar oder nur kontrolliert stillzulegen.
