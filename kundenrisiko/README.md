# Kundenrisiko

JTL Cloud App, die je Kunde das **Retouren-Risiko** anzeigt und erklärt, woraus es sich
ergibt. Gebaut aus dem offiziellen Template (`@jtl-software/create-cloud-app`): React-Frontend
+ .NET-8-Backend, läuft im JTL Hub / Cloud ERP.

![Kundenrisiko-Übersicht](docs/screenshots/overview.png)

*Übersicht: Kundenliste nach Risiko sortiert, rechts Score, Faktoren und Empfehlung. Das Bild
zeigt das UI mit Beispieldaten; im Betrieb kommen die Zahlen live aus JTL-Wawi.*

## Was die App macht

Pro Kunde wird ein Score von 0-100 (niedrig / mittel / hoch) plus eine Handlungsempfehlung
berechnet. Das Modell ist **heuristisch und erklärbar**: eine gewichtete Summe sichtbarer
Faktoren, kein trainiertes ML-Modell. Jeder Faktor zeigt seinen Punkte-Beitrag zum Score.

Zwei Ansichten:
- **ERP-Übersicht** (Menüpunkt "Kundenrisiko"): alle Kunden nach Risiko, mit Detailansicht.
- **Kunden-Panel** (Kundenansicht im ERP): Risiko zum gerade ausgewählten Kunden, über die
  AppBridge-Events (`CustomerChanged` / `getCurrentCustomerId`).

## Risiko-Modell (`packages/frontend/src/risk/model.ts`)

| Faktor | Gewicht | Signal |
| --- | --- | --- |
| Retourenquote | 42 % | retournierte/bestellte Artikel, jüngere Retouren stärker gewichtet |
| Betroffene Bestellungen | 18 % | Anteil Bestellungen mit Retoure |
| Lieferadressen | 22 % | Zahl verschiedener Lieferadressen + Abweichung Liefer-/Rechnungsadresse |
| Bestellhistorie | 10 % | wenige Bestellungen = geringe Datenbasis |
| Bestellwert | 8 % | hoher Ø-Bestellwert verstärkt |

Viele verschiedene Lieferadressen (Packstationen, wechselnde Empfänger, Lieferadresse ≠
Rechnungsadresse) sind ein eigenständiger Risikofaktor.

## Live-Daten, keine Mocks

Bestellungen kommen aus JTL-Wawi per GraphQL über den Backend-Proxy des Templates
(`getAppToken` → `/graphql`), siehe `packages/frontend/src/risk/graphqlSource.ts`:
- **Übersicht**: `QuerySalesOrders` einmalig, nach `customerId` gruppiert (kein N+1).
- **Panel**: Bestellungen des ausgewählten Kunden.

**Retouren sind nicht abfragbar**: Die Cloud-GraphQL-API hat keine allgemeine Retouren-Query
(nur Marketplace-Return-Uploads). Im Live-Betrieb wird daher ohne die Retouren-Faktoren bewertet
(`AVAILABLE_WITHOUT_RETURNS`: Adressen, Bestellhistorie, Bestellwert; Gewichte renormalisiert).
Die Retouren-Faktoren bleiben im Modell, sobald eine Retouren-Quelle verfügbar ist.

Noch gegen eine laufende Wawi zu validieren (im Code als `ASSUMPTION` markiert): der
`where`-Filter auf `customerId` und die Adress-Unterfelder der Sales-Order.

## Manifest (`app.json`)

Hub-App-Card, ERP-Menüeintrag, Panel im `customers`-Kontext, Service-Account (Backend) +
Public-Client (Login). Scopes: `customers.read`, `salesorders.read`, `items.read`.

## Starten

```bash
npm install
npm run dev     # Frontend http://localhost:4310, Backend :3005 (.NET 8)
```

Node >= 24.16 und .NET 8 SDK nötig. Standalone (ohne ERP) zeigt die App nur einen Hinweis,
da die Daten erst im Cloud ERP verfügbar sind.

## Registrieren und im Hub installieren

Registrierung läuft über die CLI (interaktiv, braucht JTL ID + Tenant):

```bash
npm run register    # JTL-ID-Login, Tenant wählen; schreibt Credentials in .env / appsettings.Local.json
```

Danach im **JTL Hub** > **Manage apps** > Tab **"Apps in development"** > die App **Install**en,
dann **Configure app** und **Complete setup**. Im **Cloud ERP** erscheint sie unter
**Apps > Kundenrisiko** sowie als Panel in der Kundenansicht.

Credentials (`.env`, `appsettings.Local.json`) sind gitignored und gehören nicht ins Repo.

## Weiteres

- `PROMPT_HISTORY.md` - die Prompts, die diese App erzeugt haben.
- `packages/frontend/src/risk/model.test.ts` - Tests zum Risiko-Modell.
