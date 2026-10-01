# Profit Pulse · JTL Cloud App

Profit Pulse zeigt Umsatz, Einkaufskosten, Rohertrag und Rohertragsmarge nach Lieferant, Kunde und Lieferadresse. Die App wird als Menüeintrag im Cloud ERP angezeigt. Das [App-Manifest](./app.json) definiert die Installation und die benötigten Lese-Scopes.

## Lokal starten

```sh
npm install
npm start
```

Unter `http://localhost:55050` erscheint eine klar gekennzeichnete Demo. In Conductor verwendet der Server den diesem Workspace zugewiesenen `CONDUCTOR_PORT` (hier 55050); außerhalb davon gilt `PORT` aus `.env`. Nach Registrierung und Installation öffnet JTL Cloud ERP das Dashboard unter `/erp`. Der JTL Hub lädt `/setup` während der Installation. Beide Seiten verwenden die AppBridge für den App-Token; der Server verifiziert dessen Signatur, Aussteller, Ablauf und App-ID. Für API-Aufrufe verwendet er das registrierte Servicekonto und die Mandantenkennung des verifizierten Tokens.

## App registrieren

Die [JTL-Cloud-App-Anleitung](https://developer.jtl-software.com/cloud/get-started/quick-start/from-scratch/connect-and-fetch#2-register-your-app) beschreibt diesen Ablauf:

1. `npm run register` im Projektverzeichnis ausführen. Die JTL-CLI öffnet die Anmeldung mit JTL ID und lässt eine Organisation auswählen. Sie liest `app.json` und schreibt Client-ID, App-ID und Servicekonto-Schlüssel in die gitignorierte `.env`.
2. Die App im [JTL Hub](https://hub.jtl-cloud.com/) unter **Manage apps → Apps in development** installieren.
3. Während der Einrichtung `/setup` im JTL Hub laden und **Einrichtung abschließen** wählen. Danach **Profit Pulse** im Cloud ERP öffnen.

Die Manifest-URLs zeigen auf `localhost:55050` und sind für diese lokale Entwicklungsinstallation gedacht. Für eine gemeinsam genutzte Installation müssen sie auf eine erreichbare HTTPS-Domain geändert und die App dort betrieben werden.

## Datenbasis

`Umsatz = Menge × Nettoverkaufspreis`, `Einkaufskosten = Menge × Nettoeinkaufspreis`, `Rohertrag = Umsatz − Einkaufskosten`, `Marge = Rohertrag / Umsatz`. Grundlage sind nicht stornierte, nicht als Entwurf markierte Verkaufsrechnungen und deren Positionen. Lieferanten werden über den aktuellen Standardlieferanten des Artikels zugeordnet. Die historische Bezugsquelle kann davon abweichen. Retouren, Rechnungskorrekturen, Versand-, Zahlungs- und Gemeinkosten sowie mögliche zusätzliche Rabatte sind nicht berücksichtigt. Es handelt sich um Rohertrag, nicht um buchhalterischen Nettogewinn. Fremdwährungen werden nicht mit EUR vermischt.

Die App liest `GET /sales-invoices`, `GET /sales-invoices/{id}/line-items` und `GET /items/{id}/suppliers` aus der [JTL ERP API v2](https://developer.jtl-software.com/openapi/erp/2.0.json). Der Server speichert Live-Daten je Mandant fünf Minuten zwischen. Zugangsdaten und `.data/` sind gitignoriert.
