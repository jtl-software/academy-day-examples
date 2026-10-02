# Prompt history

The prompts used to build this app with Claude Code, in order. Each prompt is quoted verbatim, followed by a short summary of the response.

## 1. Build and register the app

> erstelle eine jtl app und registriere sie. die app soll in der bestellübersicht anzeigen, wenn eine bestellung die erste bestellung eines kunden ist. zeige das in einem panel ein und entwerfe eine hübsche email vorlage, um diesem kunden eine willkommensmail zu schreiben in der direkt bezug genommen wird auf seine bestellung. in der email sollte ein telefonkontakt für den kunden hinterlegt sein (erfinde eine)

- Scaffolded the app with `@jtl-software/create-cloud-app` (React frontend, Node backend).
- Added an ERP pane for the context `salesorders`. It reacts to the App Bridge event `SalesOrderChanged`.
- Loaded the order with `GetSalesOrderById` and the customer's oldest order with `QuerySalesOrders`, to decide whether the order is a first order.
- Designed an HTML welcome email that names the order number, date and items and contains an invented phone contact. Added unit tests for it.
- Registered the app with `npm run register`.

> ich habe gerade den jtl docs mcp hinzugefügt

- The new docs server was not yet available in the running session. The work continued without it.

Without a new prompt: the dev server stopped because another local app used the same ports. Claude moved this app to ports 3014/3015, updated the registration and restarted the dev server.

## 2. Check that the app is running

> läuft die app noch>

- The dev server had stopped when the previous session ended. Claude restarted it and confirmed that both ports respond.

## 3. Add documentation

> commit the prompt history with the project itself. also add a readme with an explanation of the app,and if we have it, screenshots

- Added `README.md`, this file and a screenshot of the welcome email in `docs/screenshots/`.

## 4. Limit the prompt history

> online commit prompts and non-sensitive summaries from your responses. no secrets, no other repos or other references

- Reduced this file to the prompts and short summaries, without secrets and without references to other repositories.
