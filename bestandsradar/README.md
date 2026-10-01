# Bestandsradar

JTL Cloud App. Zeigt, welche Artikel gefragt sind, und berechnet aus der Verkaufshistorie, wann der Bestand zu niedrig wird und wann nachbestellt werden sollte. Das Dashboard öffnet sich in der Cloud ERP über den Menüpunkt **Bestandsradar**.

## Starten

```bash
npm install
npm run dev     # Frontend http://localhost:3024, Backend http://localhost:3025
```

`http://localhost:3024/demo` zeigt das Dashboard mit Demodaten, ohne ERP und ohne Login.

## Berechnung

Grundlage sind nicht stornierte Aufträge im gewählten Zeitraum (30, 90 oder 180 Tage), je Artikel als Tagesreihe.

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

Status: **Kritisch** = Meldebestand erreicht und Bestand reicht nicht bis zur nächsten Lieferung. **Jetzt bestellen** = Meldebestand erreicht. **Bald bestellen** = Meldebestand in den nächsten 14 Tagen.

## Aufbau

- `packages/backend/src/analysis.ts`: Berechnung (Tests: `npm test -w packages/backend`)
- `packages/backend/src/erp.ts`: lädt Aufträge, Positionen, Artikelbestände und Lieferzeiten über die ERP GraphQL API
- `GET /dashboard`: prüft das App-Token, liest den Mandanten daraus und rechnet mit dem Service Account
- `packages/frontend/src/dashboard/`: Dashboard-UI

## Registrierung

Registriert mit `npm run register` im gewählten Mandanten. Die Zugangsdaten stehen in den gitignorierten `packages/*/.env`. Scopes: `items.read`, `salesorders.read`.

Vor der ersten Nutzung die App im Hub installieren:
JTL Hub unter "Apps in development"
