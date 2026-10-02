# Prompt-Verlauf

Die Prompts, mit denen Bestandsradar mit Claude Code entstanden ist, jeweils mit einer kurzen Zusammenfassung der Antwort.

## 1. Prompt

> erstelle eine jtl app und registriere sie. die app soll ein dashboard generieren über artikel die gefragt sind, und basierend auf der verkaufshistorie analysieren, wann der bestand zu niedrig ist und wann nachbestellt werden sollte.

**Zusammenfassung der Antwort**

- App mit dem offiziellen JTL-CLI `@jtl-software/create-cloud-app` angelegt (React-Frontend, Node-Backend) und mit `npm run register` bei JTL registriert. Scopes: `items.read`, `salesorders.read`.
- Backend: lädt Aufträge, Auftragspositionen, Artikelbestände und Lieferzeiten über die ERP GraphQL API und berechnet je Artikel Absatz pro Tag, Trend, Sicherheitsbestand, Meldebestand, Reichweite, Datum "Bestellen bis" und eine Bestellmenge.
- Frontend: Dashboard mit Kennzahlen, Liste der gefragten Artikel und Nachbestell-Tabelle. Zusätzlich eine Demo-Seite mit Beispieldaten, die ohne ERP und Login läuft.
- Tests für die Berechnung, Typecheck, Lint und Build laufen durch. Die Berechnung wurde gegen echte Testdaten geprüft.
- Offener Schritt: die App im JTL Hub installieren.

## 2. Prompt

> kannst du die registrierung nicht anpassen auf diese ports

**Zusammenfassung der Antwort**

- App-Manifest, Frontend und Backend auf die Ports 3024 (Frontend) und 3025 (Backend) umgestellt.
- Bestehende Registrierung aktualisiert, die Zugangsdaten bleiben gleich. Geprüft, dass JTL die neuen URLs gespeichert hat.

## 3. Prompt

> läuft die app noch?

**Zusammenfassung der Antwort**

- Frontend und Backend laufen, die Demo-Seite antwortet.

## 4. Prompt

> ist schon installiert. bitte starten

**Zusammenfassung der Antwort**

- Geprüft, dass die App nach der Installation mit ihren eigenen Zugangsdaten auf die ERP-Daten zugreifen kann, und die Berechnung damit einmal komplett durchlaufen lassen.
- Cloud ERP im Browser geöffnet. Die App ist dort unter Apps > Bestandsradar erreichbar.

## 5. Prompt

> commit the prompt history with the project itself. also add a readme with an explanation of the app,and if we have it, screenshots

**Zusammenfassung der Antwort**

- README mit Erklärung der App, Berechnung, Start, Aufbau und Registrierung geschrieben.
- Screenshot des Dashboards mit Demodaten und diesen Prompt-Verlauf hinzugefügt.

## 6. Prompt

> online commit prompts and non-sensitive summaries from your responses. no secrets, no other repos or other references

**Zusammenfassung der Antwort**

- Prompt-Verlauf auf Prompts und kurze Zusammenfassungen reduziert, ohne Zugangsdaten, IDs, andere Projekte oder lokale Pfade.
