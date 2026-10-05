# Prompt-Verlauf

Die Prompts, mit denen Wetter-Sport mit Claude Code entstanden ist, jeweils mit einer kurzen Zusammenfassung der Antwort.

## 1. Prompt

> Bau eine JTL App für mich. Ich habe einen sportbedarfsgeschäft und meine verkäufe sind wetterabhängig. Die app soll mir folgendes anzeigen: immer wenn ich einen Artikel im Web ERP anklicke, sollen im Sidebar Panel die letzten verkäufe für diesen Artikel angezeigt werden, zusammen mit dem Wetter, was zum Zeitpunkt des Verkaufs herrschte.
>
> Außerdem, müssen wir einen Menü-Eintrag bauen, der mir das Wetter für die nächsten 7 Tage anzeigt, zusammen mit einer übersicht über niedrige warenbestände basierend auf der wettervorhersage. Also da anzeigen, welche Artikel wir nachbestellen sollten, basierend auf niedrigen beständen und dem Wetter. Also wenn gutes Wetter vorhergesagt ist und bestände von ware niedrig ist, die sonst bei gutem wetter gekauft werden, soll das angezeigt werden. das ganze soll modern aussehen und graphen im dashboard haben.
>
> ich bin kein entwickler, entscheide alle technischen fragen für mich

**Zusammenfassung der Antwort**

- App mit dem offiziellen JTL-CLI `@jtl-software/create-cloud-app` angelegt (React-Frontend, Node-Backend) und mit `npm run register` bei JTL registriert. Scopes: `items.read`, `salesorders.read`.
- Technische Entscheidungen getroffen: Wetter von Open-Meteo (kostenlos, ohne Schlüssel), Standort standardmäßig Hückelhoven, 180 Tage Verkaufshistorie, Wetterprofil ab 1,3× Mehrverkauf.
- Backend: lädt Aufträge mit Positionen und Artikelbestände über die ERP GraphQL API, verknüpft sie mit dem Wetter am Verkaufstag und berechnet Wetterprofile, erwarteten Bedarf und Nachbestellmengen.
- Frontend: Seitenleiste in der Artikelansicht und Dashboard mit 7-Tage-Prognose, vier Diagrammen und Nachbestellliste. Farben der Wetterlagen auf Farbenblindheit geprüft.
- Beispieldaten mit erfundenen Sportartikeln und echtem Wetter, als Vorschau ohne Login und als Umschalter im ERP.
- Im Browser geprüft. Dabei zwei Fehler gefunden und behoben: fehlende Wetterdaten für ältere Tage (jetzt aus dem Wetter-Archiv) und ein irreführendes "Bedeckt" an sonnigen Tagen.
- Offener Schritt: die App im JTL Hub installieren.

## 2. Prompt

> füge einen übersetzungsknopf hinzu

**Zusammenfassung der Antwort**

- Umschalter DE/EN in Dashboard und Seitenleiste. Übersetzt werden alle Texte, Diagrammbeschriftungen, Wochentage und Zahlenformate.
- Beim ersten Öffnen gilt die Sprache des Browsers, danach wird die Wahl gespeichert.

## 3. Prompt

> können wir die app mit in [Repo-Link] comitten? das repo ist checked out in ~/projects glaube ich

**Zusammenfassung der Antwort**

- App ohne Zugangsdaten und Build-Ordner in dieses Repo kopiert, Screenshots mit Beispieldaten erstellt, README und dieser Prompt-Verlauf ergänzt.

## 4. Prompt

> erstelle eine readme für das repo. die bestehenden apps sind in der 90min "Kein Entwickler? Kein Problem! Baut live eure eigene App mit KI" session in den Academy days entstanden als ergebnis von publikumsprompts. Gib eine übersicht.
> die wetter app kommt aus der "Die JTL Cloud kann das nicht? Dann bau es dir einfach selbst." 20min session am Haupttag.
>
> (dazu ein Link auf die JTL-Connect-Website als Quelle für Banner und Kontext)

**Zusammenfassung der Antwort**

- README für das gesamte Repo mit Überblick über die Sessions und einer Tabelle aller Apps.
- Banner im Stil der JTL Connect (Logo und Farben von der Website, Veranstaltungsdaten im Text).
