# EPWS2324-FuhrmannMehlemVonScheidt

## Exposé

### Problemraum

Im Projekt “ARlebnispfade Oberberg” steht die Implementierung von Augmented Reality-Erlebnissen in Wipperfürth, Wiehl und entlang der Straße der Arbeit im Mittelpunkt. Diese AR-Pfade werden auf beliebten Wanderrouten im Oberbergischen eingerichtet und mit Augmented Reality-Spots ausgestattet. Nutzer können über diese Spots Bilder, Videos, Audios und sogar interaktive 3D-Modelle aufrufen. Dies soll durch die Entwicklung einer Browseranwendung ermöglicht werden.
Außerdem soll es Nutzern ermöglicht werden, Medien gleichzeitig als Gruppe zu erleben. Durch ein synchrones Wiedergeben der Medien sollen diese nicht nur gemeinsam erlebbar werden, sondern auch Probleme, wie eine mehrfache Wiedergabe mit Versatz und dadurch entstehende Unverständlichkeiten, vermieden werden.

### Zielsetzung / Vision

Das Ziel besteht darin Prototypen für eine Anwendung zu entwickeln, die Besuchern die Kultur und Geschichte des Oberbergs vermittelt und dabei unterhaltsam bleibt. Dabei sollen verschiedene Synchronisierungsmethoden miteinander verglichen und bewertet werden. Für die Prototypen gilt es eine Matrix zu entwickeln, die einen Vergleich und das Bewerten ermöglicht.
Die Vision ist, ein gemeinsames Lernerlebnis zu schaffen, das Bildung und Spaß verbindet. Es soll eine synchronisierte Wiedergabe von Medien über verschiedene Endgeräte hinweg ermöglicht werden. Die Synchronisation erfolgt einfach, anonym und ad hoc, ohne auf eine zentrale Unit (Server) zugreifen zu müssen. Dabei wird auch das konzept für die Erstellung und Verwaltung einer Gruppe erarbeitet.

### Projektumsetzung

- Problemanalyse und Stakeholderidentifikation: Die Problemanalyse erfolgt durch Untersuchung des Problemraums und vorhandener Lösungsansätze, sowie Anforderungen der Stakeholder wie z.B. Touristen, Lehrer und lokale Behörden.
- Domänenmodell und Architektur: Auf Grundlage der Erkenntnisse werden Domänen-, Klassen- und Architekturdiagramme erstellt. Dabei wird überlegt, ob dedizierte Hardware notwendig ist oder ob bestehende Geräte wie Smartphones verwendet werden.
- Prototypentwicklung: Ein einfacher Prototyp wird entwickelt, um die Machbarkeit der Synchronisation zu testen.
- Modellierung und Design: Nach erfolgreicher Prototypentwicklung erfolgt die Gestaltung der Anwendung und des Benutzererlebnisses.
- Implementierung: Die Anwendung wird so umgesetzt, dass die Inhalte synchron auf mehreren Geräten wiedergegeben werden.

### Relevanz

Die gesellschaftliche Relevanz liegt in der Bereicherung der lokalen Geschichte und Kultur, die auf unterhaltsame Weise erlebbar gemacht wird. Der “ARlebnispfad” wird auch Auswirkungen auf den lokalen Tourismus haben, da das Gruppenerlebnis positiven Einfluss auf die Besucherzahl haben wird. Es handelt sich um eine Erforschung innovativer Technologien und deren Anwendung in Bildung und Tourismus, und könnte als Fallstudie für AR und soziale Interaktionen dienen.

## Domäne

### Deskriptives Domänenmodell

![Deskriptives Domänenmodell](/Artefakte/Domaenenmodell_deskriptiv_v2.0.jpg)

### Präskriptives Domänenmodell

![Domänenmodell](/Artefakte/Domaenenemodell_praeskriptiv_v2.0.jpg)

## Proof of Concept

Für das Projekt wurden umfangreiche Proof of Concepts ausgearbeitet:
![Proof of Concepts](/Artefakte/PoCs_v3.0.png)
Eine bessere Übersicht kann man auch [hier](https://miro.com/app/board/uXjVNaGBWvU=/?moveToWidget=3458764573606242183&cot=14) gewinnen.

## Hier findet ihr eine Dokumentation des aktuellen Entwicklungsstandes

[Development Dokumentation](https://little-cashew-cf8.notion.site/Development-Dokumentation-30b439ae92bc4f7cb817bca335e9f40c)

## Präsentation für das 4. Audit

Hier findet ihr unsere Präsentation für das 4. Audit: [PDF](/Audits/Audit_4/Audit4.pdf)

## Poster

Hier findet ihr unser Poster für den Posterslam: [PDF](/Audits/Audit_4/Poster_Entwicklungsprojekt_202324_WebDev_Fuhrmann,Mehlem&vonScheidt_Synchronisierung_mehrerer_Clients.pdf)

## Prozessassessment und Fazit

Obwohl der Tunneling-Lösungsansatz in den Bewertungsmatrizen nur leicht hinter dem Custom-Lösungsansatz mit WebRTC liegt sind wir uns im Team einstimmig sicher, dass WebRTC der bessere Ansatz für ein System zur synchronen Medienwiedergabe in einer Gruppe ohne Server ist. Zwar ermöglicht Tunneling Clients sich miteinander zu verbinden und über einen Host der als Server fungiert die synchrone Wiedergabe, allerdings wurde im Verlauf klar, dass Tunneling für diesen Zweck nicht ausgelegt ist.
Der Ansatz mit WebRTC ist deutlich aufwendiger umzusetzen, jedoch sich wir uns als Team einig, dass sich der Aufwand lohnt und mit weiterer Entwicklung ein robustes System entwickelt werden kann, dass die Anforderungen vollständig erfüllt.

An dieser Stelle sei erwähnt, dass alternative Technologien zwar recherchiert wurden, für ein Testen und Umsetzen aber leider die Zeit fehlte.
Der interessante der Ansatz der Alternativen ist WebTorrent. Im Vergleich zu unseren umgesetzten Ansätzen wird weder ein Signaling Server, noch ein Tunneling Server benötigt. Allerdings eignet sich WebTorrent wahrscheinlich, ähnlich wie Tunneling, nicht gut zur Echtzeit-Synchronisierung.
Ein ebenfalls weiterer Ansatz ist die Umsetzung eines HotSpot (mit Tunneling oder UPnP), der den Tunneling-Ansatz dahingehend erweitern könnte, da er keinen Tunneling Server benötigt und alle Geräte in einem gemeinsamen lokalen Netzwerk direkt miteinander verbinden kann.
Der Vollständigkeitshalber sei auch die Cloud-Lösung nochmal genannt, auch wenn sie aufgrund ihres hohen Aufwands, der Abhängigkeit von einem externen Server und der nicht vorhandenen Garantie für gute Echtzeit-Synchronisation als sehr unattraktiv, wenn nicht als ungeeignet eingestuft werden kann.

Zusammenfassend lässt sich sagen, dass das Projekt seine Ziele erfolgreich erreicht hat, dabei wertvolle Erfahrungen gesammelt wurden und eine solide Basis für die Weiterentwicklung gelegt wurde. Der Ausblick auf zukünftige Schritte umfasst die weitere Optimierung der entwickelten Lösungen und die Adressierung der identifizierten Herausforderungen und Verbesserungspotenziale.

Das gesamte Prozessassessment und Fazit findet ihr [hier](https://little-cashew-cf8.notion.site/Prozessassessment-und-Fazit-3ffc77b69e804096b420ca1e4c7f0969?pvs=4)
