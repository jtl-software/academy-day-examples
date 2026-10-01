# Kundenrisiko (JTL Cloud App)

JTL Cloud App aus dem offiziellen Template (`npm create @jtl-software/cloud-app`),
React-Frontend + .NET-Backend, erweitert um ein Retouren-Risiko je Kunde.

## Was drin ist

- **Risiko-Modell** `packages/frontend/src/risk/model.ts` - erklärbar, gewichtete Summe
  (kein ML). Volle Faktoren: Retourenquote 42 %, betroffene Bestellungen 18 %, Lieferadressen
  22 %, Bestellhistorie 10 %, Bestellwert 8 %. Ergebnis: Score 0-100, Band, Empfehlung.
- **Live-Daten, keine Mocks** `src/risk/graphqlSource.ts` - Bestellungen kommen aus JTL-Wawi
  per GraphQL über den Backend-Proxy (`getAppToken` -> `/graphql`). Übersicht: `QuerySalesOrders`
  nach Kunde gruppiert (eine Query). Panel: Orders des ausgewählten Kunden.
- **Retouren nicht verfügbar**: Die Cloud-GraphQL-API hat keine allgemeine Retouren-Abfrage, daher
  wird im Live-Betrieb ohne die Retouren-Faktoren bewertet (`AVAILABLE_WITHOUT_RETURNS`: Adressen,
  Bestellhistorie, Bestellwert; Gewichte renormalisiert).
- **ERP-Übersicht** `pages/erp-page` und **Kunden-Panel** `pages/pane-page` (AppBridge
  `CustomerChanged` / `getCurrentCustomerId`). Beides lädt nur im Cloud ERP; standalone zeigt die
  App einen Hinweis.
- **Manifest** `app.json` - Hub-Card, ERP-Menüeintrag, Panel im `customers`-Kontext,
  Scopes `customers.read` / `salesorders.read` / `items.read`, Service-Account + Public-Client.

Noch gegen eine laufende Wawi zu validieren (in `graphqlSource.ts` als ASSUMPTION markiert): der
`where`-Filter auf `customerId` und die Adress-Unterfelder der Sales-Order.

## Starten

```bash
npm install
npm run dev     # Frontend :4310, Backend :3005 (.NET 8)
```

Die Risiko-Ansichten laden nur im Cloud ERP (Live-Daten). Standalone (http://localhost:4310)
zeigt nur einen Hinweis.

## Registrieren (Partner Portal, interaktiv)

Braucht deine JTL ID + einen Tenant. Im eigenen Terminal:

```bash
npm run register   # öffnet Browser-Login, dann Tenant wählen; schreibt Credentials in .env
```

Danach: JTL Hub > Manage apps > "Apps in development" > Install. Alternativ `app.json` im
Partner Portal unter Manage apps > Create > JSON Code Editor einfügen.
