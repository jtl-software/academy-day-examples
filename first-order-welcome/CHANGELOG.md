# @jtl/cloud-app-template-shared

## 0.2.0

### Minor Changes

- [#167](https://github.com/jtl-software/cloud-apps-cli/pull/167) [`7ac604b`](https://github.com/jtl-software/cloud-apps-cli/commit/7ac604bf3de9cda6b32f920a0dd1d84b60857f83) Thanks [@tobilen](https://github.com/tobilen)! - Expand the scaffolded app's demos of the two request models and of panel interactivity:
  
  - **GraphQL: Client-Server vs Serverless.** The existing GraphQL page becomes the client-server variant (frontend → app backend → JTL API). A new serverless page calls the JTL ERP GraphQL API directly from the browser with the app token from `getAppToken`, no backend. Both share a `QueryDemo` component. `npm run register` now writes `VITE_JTL_API_BASE` so the serverless page targets the right environment.
  - **Panel events.** A new panel page shows how a panel reacts to the ERP: it subscribes to the `CustomerChanged` event, keeps a live event log, and pulls the current context with `getCurrentCustomerId`. Registered as a customer pane.
  
  The manifest gains a "GraphQL Demo (Serverless)" ERP menu item and an events panel. Storybook gains stories for both new pages, including a bridge mock that emits a `CustomerChanged` event so the panel story shows a received event.

## 0.1.3

### Patch Changes

- [#154](https://github.com/jtl-software/cloud-apps-cli/pull/154) [`36085c3`](https://github.com/jtl-software/cloud-apps-cli/commit/36085c37e16198ce87b80a133ca63bf7148bbfa3) Thanks [@tobilen](https://github.com/tobilen)! - Scaffold `app.json` with the ERP API scopes the template's default GraphQL demo needs. The demo issues `QueryItems` and `QuerySalesOrders`, which require the `items.read` and `salesorders.read` scopes; the generated manifest now declares `capabilities.erp.api.scopes: ["items.read", "salesorders.read"]` instead of an empty array. Without them the ERP API denies the queries, and its GraphQL error filter reports the denial as a generic `INTERNAL_ERROR`, so a freshly scaffolded app's demo failed with no obvious cause.

## 0.1.2

### Patch Changes

- [#111](https://github.com/jtl-software/cloud-apps-cli/pull/111) [`cc09830`](https://github.com/jtl-software/cloud-apps-cli/commit/cc09830c9a48bf546325eecf266425fc9aee3c1e) Thanks [@tobilen](https://github.com/tobilen)! - Add "Login with JTL" to scaffolded apps. A new `--next` scaffold flow asks, with one select per half, whether the app has a frontend, a backend, or both (pick "None" to leave one out), and only the chosen halves are scaffolded. Each half declares what it needs to sign users and services in: a frontend gets a browser sign-in client (authorization code + PKCE), a backend gets a service account for the JTL API. The frontend dev-server port is picked automatically and reused for the sign-in redirect.

  The React template ships a working "Login with JTL" experience: standalone browser pages sit behind the login, an unauthenticated visitor is taken straight to the JTL sign-in (no intermediate "sign in" button), lands back where they started with a sign-out bar, and `/login` shows the signed-in user's details. Embedded ERP/pane views keep authenticating through the AppBridge. `register` finishes the wiring so login works out of the box.

  `register` no longer asks which organization to use when the sign-in already picked one; it prints the selected organization instead (`--tenant` still overrides). The create/update confirm now also offers "Use a different organization", which sends the user back through the sign-in with the account picker to register under another org without restarting. `--reauth` likewise sends the user back through organization selection (reusing the existing browser session, no password re-entry) rather than silently returning the previous choice. A new `--app-service-path` flag targets a specific backend deployment. The classic scaffold flow (no `--next`) is unchanged.

## 0.1.1

### Patch Changes

- [#100](https://github.com/jtl-software/cloud-apps-cli/pull/100) [`da908b0`](https://github.com/jtl-software/cloud-apps-cli/commit/da908b0fe9bcac2ff98273bb3fd1bd13a2d31b1f) Thanks [@Mr-Malomz](https://github.com/Mr-Malomz)! - refactor: rename panel property to pane and update customer context scope in app template

## 0.1.0

### Minor Changes

- [#87](https://github.com/jtl-software/cloud-apps-cli/pull/87) [`82685d8`](https://github.com/jtl-software/cloud-apps-cli/commit/82685d8906b5e5a3f24ef1a4064d4f518e778196) Thanks [@Mr-Malomz](https://github.com/Mr-Malomz)! - Split the combined `manifest.json` into two independent files: a flat `app.json` for registration (`technicalName`, `version`, `lifecycle`, `capabilities`) and a new `listing.json` for the store listing (`name`, `description`, `media`, `pricing`, etc.). This matches the app lifecycle — register when you start building, push the listing once you're ready to publish.

  **Breaking change**: `manifest.json` is gone. It's replaced by `app.json`, which is no longer `{ manifest, listing }` but the flat registration shape directly. `npm run register` will bail with migration guidance if it detects the old combined format. Split your existing `manifest.json` into a flat `app.json` (registration fields) and a new `listing.json` (store fields).

  Adds a new `npm run listing` command that pushes `listing.json`. It resolves the target app by `technicalName` against the app `register` already created (no `--existing-app-id`/`--new` needed), creates the listing, then pushes the full listing content. It also interactively asks for the listing's distribution type (`PUBLIC`/`PRIVATE`) and default locale — pre-filled from `listing.json` and written back once answered — before pushing.

## 0.0.6

### Patch Changes

- [`47ebb33`](https://github.com/jtl-software/cloud-apps-cli/commit/47ebb337e15a39e75c28d2daaffec8e764f3f2ec) Thanks [@tobilen](https://github.com/tobilen)! - Fix context

## 0.0.5

### Patch Changes

- [#46](https://github.com/jtl-software/cloud-apps-cli/pull/46) [`53e27ae`](https://github.com/jtl-software/cloud-apps-cli/commit/53e27ae5fa378292191a8fa30769b8275ba51ed9) Thanks [@tobilen](https://github.com/tobilen)! - Pin to newest Node LTS Version

## 0.0.4

### Patch Changes

- [#43](https://github.com/jtl-software/cloud-apps-cli/pull/43) [`27055e6`](https://github.com/jtl-software/cloud-apps-cli/commit/27055e6d01e3a30e3a5de97f2e56772dbf4f0dfd) Thanks [@tobilen](https://github.com/tobilen)! - Moved the manifest.json out of the frontend package

- [#43](https://github.com/jtl-software/cloud-apps-cli/pull/43) [`36d1518`](https://github.com/jtl-software/cloud-apps-cli/commit/36d1518f8214fdee56cff202456f6b35f8912346) Thanks [@tobilen](https://github.com/tobilen)! - Add register command to generated project

## 0.0.3

### Patch Changes

- [#9](https://github.com/jtl-software/cloud-apps-cli/pull/9) [`5697636`](https://github.com/jtl-software/cloud-apps-cli/commit/5697636be8f917639539f72fbffb9165a2de01b1) Thanks [@tobilen](https://github.com/tobilen)! - Add required meta information, merge \_package.json and add readme for templates

## 0.0.2

### Patch Changes

- [`d7c698c`](https://github.com/jtl-software/cloud-apps-cli/commit/d7c698c311ed8d8ecf093ddf056d9b91cc7ba008) Thanks [@tobilen](https://github.com/tobilen)! - publish templates separately

## 0.0.1

### Patch Changes

- [`845f751`](https://github.com/jtl-software/cloud-apps-cli/commit/845f751930774ebbd0af55abcba505443494befe) Thanks [@tobilen](https://github.com/tobilen)! - initial
