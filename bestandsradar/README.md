# Bestandsradar

JTL Cloud App für JTL-Wawi. Zeigt, welche Artikel gefragt sind, und berechnet aus der Verkaufshistorie, wann der Bestand zu niedrig wird und wann nachbestellt werden sollte. Das Dashboard öffnet sich in der Cloud ERP über den Menüpunkt **Bestandsradar**.

![Bestandsradar mit Demodaten](docs/screenshots/dashboard-demo.png)

## Was die App zeigt

- **Kennzahlen oben:** Artikel mit Verkäufen im Zeitraum und wie viele davon kritisch sind, jetzt oder bald nachbestellt werden sollten.
- **Gefragte Artikel:** die 8 meistverkauften Artikel mit verkaufter Menge, Trend und Verkäufen pro Woche.
- **Nachbestellungen:** alle Artikel mit Handlungsbedarf, sortiert nach Dringlichkeit. Pro Artikel: verfügbarer Bestand, Zulauf, Absatz pro Tag, Reichweite gegen Lieferzeit, Meldebestand, Datum "Bestellen bis" und eine Bestellmenge. Über "Alle Artikel" sind auch die unkritischen sichtbar.
- **Einstellungen:** Zeitraum der Verkaufshistorie (30, 90 oder 180 Tage) und die Standard-Lieferzeit für Artikel ohne hinterlegte Lieferzeit.

## Berechnung

Grundlage sind nicht stornierte Aufträge im gewählten Zeitraum, je Artikel als Tagesreihe.

| Wert | Formel |
| --- | --- |
| Ø Absatz/Tag | Mittel aus Tagesrate des Zeitraums und der letzten 30 Tage |
| Trend | Tagesrate zweite Hälfte gegen erste Hälfte des Zeitraums |
| Lieferzeit | Lieferzeit des Standardlieferanten, sonst manuelle Lieferzeit am Artikel, sonst Standardwert (14 Tage, im Dashboard einstellbar) |
| Sicherheitsbestand | 1,65 × Standardabweichung des Tagesabsatzes × √Lieferzeit (ca. 95 % Lieferfähigkeit), mindestens der Mindestbestand des Artikels |
| Meldebestand | Ø Absatz/Tag × Lieferzeit + Sicherheitsbestand |
| Reichweite | verfügbarer Bestand / Ø Absatz/Tag |
| Bestellen bis | Tag, an dem verfügbarer Bestand + Zulauf den Meldebestand erreicht |
| Vorschlag | Bedarf für Lieferzeit + Bestellintervall (30 Tage oder Wert am Artikel) + Sicherheitsbestand − Bestand − Zulauf, mindestens Mindestabnahme |

Status:

- **Kritisch:** Meldebestand erreicht, und der Bestand reicht nicht bis zur nächsten Lieferung.
- **Jetzt bestellen:** Meldebestand erreicht.
- **Bald bestellen:** Meldebestand wird in den nächsten 14 Tagen erreicht.

## Starten

```bash
npm install
npm run dev     # Frontend http://localhost:3024, Backend http://localhost:3025
npm test        # Tests der Berechnung
```

`http://localhost:3024/demo` zeigt das Dashboard mit Demodaten, ohne ERP und ohne Login. Mit echten Daten läuft die App in der Cloud ERP (https://erp.jtl-cloud.com) unter **Apps > Bestandsradar**.

## Aufbau

```
packages/
  backend/src/
    analysis.ts   Berechnung (Absatz, Meldebestand, Status, Vorschlag)
    erp.ts        lädt Aufträge, Positionen, Bestände und Lieferzeiten über die ERP GraphQL API
    demo.ts       Demodaten für /demo
    index.ts      Express-Server mit GET /dashboard und GET /dashboard/demo
  frontend/src/
    dashboard/    Dashboard-UI (React, JTL Platform UI)
    pages/        ERP-Seite, Demo-Seite, Setup
app.json          App-Manifest (Menüpunkt, Scopes, Authentifizierung)
listing.json      Store-Eintrag (noch nicht veröffentlicht)
```

Ablauf in der ERP: Das Frontend holt über die AppBridge ein App-Token und ruft `GET /dashboard` auf. Das Backend prüft das Token, liest den Mandanten daraus und fragt die ERP-Daten mit dem Service Account der App ab.

## Registrierung

`npm run register` registriert die App im gewählten Mandanten und schreibt die Zugangsdaten in die gitignorierten `packages/*/.env`. Scopes: `items.read`, `salesorders.read`. Danach die App im JTL Hub unter "Apps in development" installieren.

Nach Änderungen an `app.json` das Manifest der bestehenden App aktualisieren (App-ID gibt `npm run register` aus):

```bash
npx -y @jtl-software/create-cloud-app@latest register --tenant <mandant> --existing-app-id <app-id>
```

## Entstehung

Die App wurde mit Claude Code gebaut. Die Prompts und Antworten stehen in [docs/prompt-history.md](docs/prompt-history.md).
