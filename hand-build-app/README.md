# hand-build-app

A JTL Cloud App that shows the **absolute (summed) actual purchase value of sold goods**. It runs
embedded in the JTL ERP (JTL-Wawi Cloud) and reads sales data through the JTL Platform API.

The repo is a Turborepo monorepo with two packages:

- `packages/frontend` - React 19 + Vite + Tailwind, using `@jtl-software/platform-ui-react`.
- `packages/backend` - Node + Express, verifies the app token and proxies the JTL ERP API.

## What it does

Two surfaces, both built around the same metric.

### 1. Dashboard (ERP menu entry, route `/erp`)

Shows the total purchase value of the goods that were sold, plus a per-article table.

### 2. Customer side panel (route `/pane`, customer context)

The same metric, restricted to the customer currently open in the ERP. It follows the ERP's
`CustomerChanged` event and lists that customer's top articles by purchase value.

## The metric

```
purchase value (net) = sum over all sold item positions of ( quantity × purchasePriceNet )
```

`purchasePriceNet` is the purchase price recorded on each sales-order line item at the time of
sale, so this is the **actual** purchase value, not the averaged `averagePurchasePriceNet` from the
item master. The value is net. The dashboard scopes to the most recent 100 orders; the panel scans
the most recent 300 and keeps the selected customer's orders.

## How the data flows

1. The frontend runs embedded in the ERP iframe and gets an app token from the AppBridge
   (`getAppToken`).
2. It calls the backend route `POST /sold-goods` with that token (the panel also sends a
   `customerId`).
3. The backend verifies the token, reads the tenant id from it, and mints its own service-account
   token (client credentials).
4. It lists sales orders via GraphQL (`QuerySalesOrders`) and reads each order's line items via the
   REST endpoint `/erp/v2/sales-orders/{id}/line-items`, which carries `quantity` and
   `purchasePriceNet`.
5. It sums per article and returns the total plus a per-article breakdown.

## Ports

Fixed, dedicated ports so the dev servers bind predictably:

- Frontend: `http://localhost:4004` (`strictPort`)
- Backend: `http://localhost:4005` (`PORT` in `packages/backend/.env`)

The frontend reads the backend URL from `VITE_BACKEND_URL` / `VITE_API_URL` in
`packages/frontend/.env`.

## API scopes

Declared in `app.json` under `capabilities.erp.api.scopes`:

- `items.read`
- `salesorders.read`
- `customers.read`
- `taxes.read`

## Running locally

```bash
npm install
npm run dev        # starts frontend (4004) and backend (4005)
npm run register   # pushes app.json (manifest + scopes) to the JTL Cloud
```

`register` is required before the app works embedded: the manifest tells the ERP where to load each
surface from (the `localhost:4004` URLs) and which scopes to grant on installation. Scope changes
take effect for a token once the installation is updated.

## Screenshots

None are included. The dashboard and panel only render inside the ERP iframe, where the AppBridge
provides the token. Opened standalone in a browser the app falls back to the welcome page, so there
is nothing representative to capture outside the ERP.

## Key files

- `app.json` - app manifest (surfaces, URLs, scopes).
- `packages/backend/src/index.ts` - `/sold-goods` route and the JTL API proxy.
- `packages/frontend/src/pages/erp-page/ErpPage.tsx` - the dashboard.
- `packages/frontend/src/pages/pane-page/PanePage.tsx` - the customer panel.
- `PROMPT_HISTORY.md` - the prompts that produced this app.
