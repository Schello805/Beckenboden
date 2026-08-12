# Mein Kraftbaum – Produktspezifikation v1

## Zugang und Rollen

- Code-first: Ohne gültigen individuellen Einmalcode keine Registrierung.
- Ein eingeloggter Account kann weitere Kurscodes einlösen.
- Zwei Rollen: User und Admin. Alle Admins haben dieselben Rechte und verpflichtendes 2FA.
- Der erste Admin wird ausschließlich in einem einmaligen, geschützten Installationsfenster angelegt.
- Mindestpasswortlänge: 8 Zeichen; E-Mail-Änderung ausschließlich durch den User.

## Kurse, Anwesenheit und Freischaltung

- Kursvorlage, Kursdurchlauf und einzelne Termine sind getrennte Entitäten.
- Codes können anonym oder vorab einer E-Mail-Adresse zugeordnet erzeugt werden.
- Typen: Teilnahmecode, Vollzugangscode, Eventcode.
- Anwesenheit nur durch Admin: QR-Scan, Teilnehmerliste oder nachträgliche Erfassung einer Papierliste.
- Der Baum wächst nur durch tatsächliche bzw. vom Admin anerkannte Teilnahme.
- Inhalte können unabhängig von Anwesenheit manuell freigegeben werden.
- Regelarten: sofort, bestimmte Einheit, Anzahl Teilnahmen, manuell, Kursabschluss.
- Ein Kurs ist erst nach allen vorgesehenen Teilnahmen abgeschlossen; dann entstehen Urkunde und Teilnahmebestätigung.

## Mein Kraftbaum

- Dauerhaft wachsender Gesamtbaum, jeder Kurs verstärkt oder variiert einen Ast.
- Frau und Katze bilden die konstante Größenreferenz; die Kamera zieht mit wachsendem Baum zurück.
- Kurse verändern den Baum, Sonderevents ergänzen Sterne im persönlichen Kraftort.
- Monat, Jahreszeit und Tag/Nacht verändern nur Atmosphäre, nie erreichten Fortschritt.
- Märchenhaft-natürlich, hochwertig, ruhig, sinnlich und leicht – nicht kitschig.

## Inhalte und Kommunikation

- Modularer Editor für Texte, Bilder, PDFs, externe Links, YouTube, Vimeo und selbst gehostete Videos.
- Kein Download-Button für Medien; PDF darf gedruckt werden. Browserseitige Speicherung kann nicht vollständig verhindert werden.
- Uploadlimits: Bilder 5 MB, PDF 20 MB, Video 5 GB. Keine Virenprüfung.
- YouTube und Vimeo laden erst nach aktiver Zustimmung.
- Jeder Inhalt zeigt seinen Stand aus Datum und Uhrzeit.
- Support und Feedback als normales E-Mail-Formular, kein Chat.
- Push bei Stempel; keine Stempel-E-Mail. Benachrichtigungen sind getrennt wählbar, Sicherheitsnachrichten nicht.

## Datenschutz und Recht

- Externe Fragebögen sind vollständig anonym, nur verlinkt und nicht mit Accounts verbunden.
- Keine Öffnungs- oder Abschlussmessung der Fragebögen.
- Interne Notizen nur sachlich, verschlüsselt, protokolliert und löschbar; grundsätzlich auskunftspflichtig.
- Matomo selbst gehostet mit anonymisierter IP und ohne Gesundheitsdaten, Codes oder E-Mail-Adressen.
- Rechtstexte versioniert mit Gültigkeitsdatum, Änderungsnotiz und dokumentierter Zustimmung.
- Nur Erwachsene. Medizinischer Notfallhinweis; keine Diagnose und kein Heilversprechen.
- Dauerhafter Zugriff ist vorgesehen, mindestens 24 Monate, soweit das Angebot fortgeführt wird.

## Betrieb

- Ubuntu 24.04 LXC auf Proxmox, ohne Docker, hinter NPM Plus unter app.anja-tanzt.de.
- Installation, Update, Healthcheck und Rollback über fertige Skripte und aus Admin-UI auslösbar.
- Revision steigt mit jedem Push auf main. CI prüft Lint, Tests und Build bei jedem Push.
