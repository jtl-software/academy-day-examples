# Prompt history

The prompts that produced this app, in order, verbatim (German originals kept as typed). Each entry
has a short, non-sensitive summary of the response.

1. **"die app hat auf 3005 gestartet. starte sie bitte auf 3004"**
   Freed port 3004, started the app on 3004 (frontend) / 3005 (backend), and added
   `strictPort: true` to the Vite config.

2. **"zeige mir in dieser app in einem dashboard von meinen verkauften artikeln den absoluten (NICHT durchscnittlichen) einkaufswert meiner verkauften waren. zeige den tatsächlichen einkaufswert des artikels"**
   Built the dashboard: backend route `/sold-goods` that sums quantity × purchasePriceNet over sold
   line items (the actual per-position purchase price, not the item-master average), and reshaped the
   ERP menu page into the dashboard UI.

3. **"erweitere bitte die scopes meiner anwendung arbiträr"**
   Expanded `capabilities.erp.api.scopes` in `app.json` to the full documented set (67 scopes).

4. **"läuft die anwendung noch>"**
   It had stopped; restarted it.

5. **"eigene feste ports"**
   Moved the app to fixed ports 4004 (frontend) / 4005 (backend) across the Vite config, backend
   `.env`, frontend `.env`, and all `app.json` URLs.

6. **"mach es bitte"**
   Registered the app manifest (updated URLs and scopes).

7. **"das panel hat noch den standard screen"**
   Replaced the template panel with a customer-scoped version of the metric; extended `/sold-goods`
   to filter by `customerId`.

8. **"requests are failing with 431"** (with a pasted failing `curl`)
   Diagnosed HTTP 431 (Request Header Fields Too Large): the all-scopes app token grew past Node's
   16 KB header limit. Raised the backend header limit as the first fix.

9. **"ja, reduzieren"**
   Reduced the scopes to `items.read`, `salesorders.read`, `customers.read`, reverted the header
   limit workaround, and re-registered.

10. **"neu registrieren bitte mit den kleineren scopes, plus einem zufälligen bitte"**
    Added one random scope (`taxes.read`) to the reduced set and re-registered.

11. **"commit the prompt history with the project itself. also add a readme with an explanation of the app, and if we have it, screenshots"**
    Added this file and `README.md` and committed them with the project. No screenshots exist (the
    app only renders embedded in the ERP).
