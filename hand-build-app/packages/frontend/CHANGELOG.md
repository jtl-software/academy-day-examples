# @jtl/cloud-app-template-frontend-react

## 0.3.2

### Patch Changes

- [#180](https://github.com/jtl-software/cloud-apps-cli/pull/180) [`5f1ff52`](https://github.com/jtl-software/cloud-apps-cli/commit/5f1ff52a03db8b7511260d5c3c2a6dfd6bda4856) Thanks [@tobilen](https://github.com/tobilen)! - Pin `@tiptap/extension-bubble-menu` and `@tiptap/extension-floating-menu` to `3.30.2` in the React frontend template.
  
  These two extensions are optional peers of `@tiptap/react`, which `@jtl-software/platform-ui-react` pulls in at `3.30.2`. npm floated them to the newest in range (`3.31.4`), and that version demands `@tiptap/core`/`@tiptap/pm` at `3.31.4` while the rest of the tiptap family stays at `3.30.2`, so `npm install` in a scaffolded app printed peer-conflict warnings. Pinning them keeps the whole tiptap family at `3.30.2` and the install clean.

## 0.3.1

### Patch Changes

- Updated dependencies [[`3600aab`](https://github.com/jtl-software/cloud-apps-cli/commit/3600aab96cb873ab0479212be57a1835ff0800d4)]:
  - @jtl-software/cloud-apps-auth@0.6.0

## 0.3.0

### Minor Changes

- [#167](https://github.com/jtl-software/cloud-apps-cli/pull/167) [`7ac604b`](https://github.com/jtl-software/cloud-apps-cli/commit/7ac604bf3de9cda6b32f920a0dd1d84b60857f83) Thanks [@tobilen](https://github.com/tobilen)! - Expand the scaffolded app's demos of the two request models and of panel interactivity:
  
  - **GraphQL: Client-Server vs Serverless.** The existing GraphQL page becomes the client-server variant (frontend → app backend → JTL API). A new serverless page calls the JTL ERP GraphQL API directly from the browser with the app token from `getAppToken`, no backend. Both share a `QueryDemo` component. `npm run register` now writes `VITE_JTL_API_BASE` so the serverless page targets the right environment.
  - **Panel events.** A new panel page shows how a panel reacts to the ERP: it subscribes to the `CustomerChanged` event, keeps a live event log, and pulls the current context with `getCurrentCustomerId`. Registered as a customer pane.
  
  The manifest gains a "GraphQL Demo (Serverless)" ERP menu item and an events panel. Storybook gains stories for both new pages, including a bridge mock that emits a `CustomerChanged` event so the panel story shows a received event.

### Patch Changes

- Updated dependencies [[`0061556`](https://github.com/jtl-software/cloud-apps-cli/commit/0061556648566dcaa1c0efecbd6b8d90a73b1595)]:
  - @jtl-software/cloud-apps-auth@0.5.0

## 0.2.1

### Patch Changes

- Updated dependencies [[`95372e5`](https://github.com/jtl-software/cloud-apps-cli/commit/95372e50c70aee267dba2d93f0ec2703135f4aa2)]:
  - @jtl-software/cloud-apps-auth@0.4.0

## 0.2.0

### Minor Changes

- [#160](https://github.com/jtl-software/cloud-apps-cli/pull/160) [`b1b5b8c`](https://github.com/jtl-software/cloud-apps-cli/commit/b1b5b8c7f2fcc32999d4ef66cebcd6d668d60912) Thanks [@tobilen](https://github.com/tobilen)! - Switch the scaffolded app to the DP-735 app token and retire the session token. The node backend's `/verify-token` and `/graphql` now verify the incoming token with `verifyAppToken` from `@jtl-software/cloud-apps-auth` (signature, issuer, expiry, and `aud` contains the app's Zitadel project id), and `/graphql` reads the tenant from the token's `urn:jtl:tenant_id` claim rather than a session token. Set `JTL_APP_PROJECT_ID` to the app's Zitadel project id. The React template's setup and GraphQL pages call `getAppToken` on the bridge instead of `getSessionToken`. The `/connect-tenant` route, the session-token verifier, and the now-unused `jose` dependency are removed.

## 0.1.6

### Patch Changes

- [#156](https://github.com/jtl-software/cloud-apps-cli/pull/156) [`6a69979`](https://github.com/jtl-software/cloud-apps-cli/commit/6a69979fcfaa5db76a38429848608f727b1c31f8) Thanks [@tobilen](https://github.com/tobilen)! - Bump the React template's `vitest` from `^4.1.11` to `^5.0.0` so a freshly scaffolded app installs. `vitest@4.1.11`'s pinned transitive `@vitest/*` graph makes npm's arborist crash with `Cannot read properties of null (reading 'edgesOut')` during a clean `npm install` (reproduces on npm 10 and 11); a checked-in lockfile hid it because npm then skips the ideal-tree peer walk. `vitest@5.0.0` resolves cleanly and the template's test still passes.
- Updated dependencies [[`352898d`](https://github.com/jtl-software/cloud-apps-cli/commit/352898d3da6ff391a9fbd24700f695e98858e61f)]:
  - @jtl-software/cloud-apps-auth@0.3.0

## 0.1.5

### Patch Changes

- [#145](https://github.com/jtl-software/cloud-apps-cli/pull/145) [`f9bb063`](https://github.com/jtl-software/cloud-apps-cli/commit/f9bb063b61ad5fc5fa116967a1b0cd652b990307) Thanks [@tobilen](https://github.com/tobilen)! - Make the React template's setup page complete the Hub install handshake without a backend. Installing an app requires the setup page to call `setupCompleted`; it previously only did so after a successful backend `/connect-tenant` call, so a frontend-only app could never finish installing. The backend call is now optional (only when the app has a backend), and `setupCompleted` always runs.

## 0.1.4

### Patch Changes

- [#143](https://github.com/jtl-software/cloud-apps-cli/pull/143) [`d5f14b3`](https://github.com/jtl-software/cloud-apps-cli/commit/d5f14b3445d5aff8d724c65222ed6f20305cdd78) Thanks [@tobilen](https://github.com/tobilen)! - Rename the React template's `/login` page to `/user-example` (it demonstrates reading the signed-in user from the token: id-token claims, access token, and userinfo) and stop landing there after sign-in. A signed-in user now returns to where they started, falling back to the welcome page at `/`. The route list on the welcome page is now clickable, navigating to each subpage.

## 0.1.3

### Patch Changes

- [#136](https://github.com/jtl-software/cloud-apps-cli/pull/136) [`6682bee`](https://github.com/jtl-software/cloud-apps-cli/commit/6682beee4fd9d00b0ba97b8740c00be4bb43a764) Thanks [@tobilen](https://github.com/tobilen)! - Pretty-print the JSON on the React template's `/login` page (userinfo and backend-verification results), and replace the placeholder favicon with the JTL favicon.

- [#137](https://github.com/jtl-software/cloud-apps-cli/pull/137) [`b2a96d6`](https://github.com/jtl-software/cloud-apps-cli/commit/b2a96d640d3b3245b3ffeb009c379e08e408fa2c) Thanks [@tobilen](https://github.com/tobilen)! - Fix `setupCompleted is not exposed` during app installation. The React template started the AppBridge inside an effect, so StrictMode ran a second handshake and the app kept a host bridge that never had the setup methods exposed. The handshake now starts once.
- Updated dependencies [[`6682bee`](https://github.com/jtl-software/cloud-apps-cli/commit/6682beee4fd9d00b0ba97b8740c00be4bb43a764)]:
  - @jtl-software/cloud-apps-auth@0.2.2

## 0.1.2

### Patch Changes

- [#122](https://github.com/jtl-software/cloud-apps-cli/pull/122) [`30cdec4`](https://github.com/jtl-software/cloud-apps-cli/commit/30cdec4b45fd7200ec9d83401896dcf2a00a9918) Thanks [@tobilen](https://github.com/tobilen)! - Fix the React template showing a white page when run standalone. `createAppBridge` never resolves without an ERP/Hub host to answer the handshake, so gating the first render on it left a standalone browser tab blank forever. The template now detects embedding via `window.self !== window.top` and only waits for the bridge when embedded; a standalone tab renders (and redirects to the JTL login) immediately.

- [#124](https://github.com/jtl-software/cloud-apps-cli/pull/124) [`db901d3`](https://github.com/jtl-software/cloud-apps-cli/commit/db901d350cf2d54d07b180eac0d89c09b8f17998) Thanks [@tobilen](https://github.com/tobilen)! - Show more of the login/backend flow in the React template:

  - The `/login` page now shows the OIDC `/userinfo` response for the signed-in user, via a new `fetchUserInfo` helper exported from `@jtl-software/cloud-apps-auth`.
  - Every backend template (node, php, dotnet) gains a `/verify-token` endpoint that checks the user's access token against the JTL IdP (signature via JWKS, issuer, expiry) - a reference for how backend developers verify a JTL token. `register` writes `VITE_BACKEND_URL` (frontend) plus the backend's issuer (`JTL_ISSUER` for node/php, `JtlPlatform:Issuer` for dotnet), and the `/login` page gains a "Verify token in backend" button.
  - The React template now uses `@vitejs/plugin-react` instead of `@vitejs/plugin-react-swc`, which removes the Vite "we recommend switching" warning when no SWC plugins are used.
  - The backend dev port is read from the `PORT` env var (node/php `.env`, default 3005) instead of being hardcoded; `register` derives `VITE_BACKEND_URL` from that env value and the Vite dev proxy reads it from `VITE_BACKEND_URL`.

- Updated dependencies [[`9cab343`](https://github.com/jtl-software/cloud-apps-cli/commit/9cab343b9d0a406476f4202d1454caba3f201900), [`db901d3`](https://github.com/jtl-software/cloud-apps-cli/commit/db901d350cf2d54d07b180eac0d89c09b8f17998)]:
  - @jtl-software/cloud-apps-auth@0.2.1

## 0.1.1

### Patch Changes

- [#116](https://github.com/jtl-software/cloud-apps-cli/pull/116) [`21571d7`](https://github.com/jtl-software/cloud-apps-cli/commit/21571d7a70dc66408152fb8cc84002f252cfe831) Thanks [@tobilen](https://github.com/tobilen)! - Move the React template's browser login onto `@jtl-software/cloud-apps-auth`. The hand-rolled PKCE flow (`pkce.ts`, `oidc.ts`, `AuthProvider.tsx`, `config.ts`, `RequireAuth.tsx`) is gone; a scaffolded app now uses `<JtlAuthProvider>` in `main.tsx`, `<RequireJtlAuth>` around standalone pages, and `useJtlAuth()` to read the session.

  The login env vars are renamed from `VITE_ZITADEL_*` to `VITE_JTL_*` (`VITE_JTL_ISSUER`, `VITE_JTL_CLIENT_ID`, `VITE_JTL_SCOPE`) so a scaffolded app never names the underlying identity-provider vendor; `register` writes the new names. Behavior is unchanged: standalone pages sit behind the login with an automatic redirect, embedded ERP/pane views still use the AppBridge.

## 0.1.0

### Minor Changes

- [#111](https://github.com/jtl-software/cloud-apps-cli/pull/111) [`cc09830`](https://github.com/jtl-software/cloud-apps-cli/commit/cc09830c9a48bf546325eecf266425fc9aee3c1e) Thanks [@tobilen](https://github.com/tobilen)! - Add "Login with JTL" to scaffolded apps. A new `--next` scaffold flow asks, with one select per half, whether the app has a frontend, a backend, or both (pick "None" to leave one out), and only the chosen halves are scaffolded. Each half declares what it needs to sign users and services in: a frontend gets a browser sign-in client (authorization code + PKCE), a backend gets a service account for the JTL API. The frontend dev-server port is picked automatically and reused for the sign-in redirect.

  The React template ships a working "Login with JTL" experience: standalone browser pages sit behind the login, an unauthenticated visitor is taken straight to the JTL sign-in (no intermediate "sign in" button), lands back where they started with a sign-out bar, and `/login` shows the signed-in user's details. Embedded ERP/pane views keep authenticating through the AppBridge. `register` finishes the wiring so login works out of the box.

  `register` no longer asks which organization to use when the sign-in already picked one; it prints the selected organization instead (`--tenant` still overrides). The create/update confirm now also offers "Use a different organization", which sends the user back through the sign-in with the account picker to register under another org without restarting. `--reauth` likewise sends the user back through organization selection (reusing the existing browser session, no password re-entry) rather than silently returning the previous choice. A new `--app-service-path` flag targets a specific backend deployment. The classic scaffold flow (no `--next`) is unchanged.

## 0.0.18

### Patch Changes

- [#103](https://github.com/jtl-software/cloud-apps-cli/pull/103) [`2242474`](https://github.com/jtl-software/cloud-apps-cli/commit/224247441691ddd75cf11730f4829291b20b7cd5) Thanks [@tobilen](https://github.com/tobilen)! - Pin `graphql` to `^16`, so a scaffolded app installs. The template asked for `graphql@^17` while `graphql-request@^7.4.0` peers `graphql@14 - 16`, and no `graphql-request` release accepts 17 yet, so `npm install` failed with ERESOLVE straight after scaffolding. Nothing in the template imports `graphql` directly.

## 0.0.17

### Patch Changes

- [#82](https://github.com/jtl-software/cloud-apps-cli/pull/82) [`55873f0`](https://github.com/jtl-software/cloud-apps-cli/commit/55873f0c77a67097843ba8724ff8caf047e8bf22) Thanks [@tobilen](https://github.com/tobilen)! - Update dependencies

## 0.0.16

### Patch Changes

- [`47ebb33`](https://github.com/jtl-software/cloud-apps-cli/commit/47ebb337e15a39e75c28d2daaffec8e764f3f2ec) Thanks [@tobilen](https://github.com/tobilen)! - Fix context

## 0.0.15

### Patch Changes

- [#48](https://github.com/jtl-software/cloud-apps-cli/pull/48) [`5b1b22b`](https://github.com/jtl-software/cloud-apps-cli/commit/5b1b22b6943ec7e37cf701305b0da9eb846c906a) Thanks [@tobilen](https://github.com/tobilen)! - Add link to proceed to the hub. Open the app when run with npm run dev

## 0.0.14

### Patch Changes

- [#46](https://github.com/jtl-software/cloud-apps-cli/pull/46) [`53e27ae`](https://github.com/jtl-software/cloud-apps-cli/commit/53e27ae5fa378292191a8fa30769b8275ba51ed9) Thanks [@tobilen](https://github.com/tobilen)! - Pin to newest Node LTS Version

## 0.0.13

### Patch Changes

- [#43](https://github.com/jtl-software/cloud-apps-cli/pull/43) [`90cd2f7`](https://github.com/jtl-software/cloud-apps-cli/commit/90cd2f7eb422dcb9e6870cc7ec51015941eeed7b) Thanks [@tobilen](https://github.com/tobilen)! - Warn loudly when CLIENT_ID / CLIENT_SECRET are missing. Backends print a red startup banner pointing at the env/config file, and expose `GET /health` returning `{ status, missing }`. The React frontend polls `/health` and renders a yellow banner across all routes when the backend reports a misconfiguration, so the dev sees the issue in the browser even if they missed the terminal output.

- [#43](https://github.com/jtl-software/cloud-apps-cli/pull/43) [`27055e6`](https://github.com/jtl-software/cloud-apps-cli/commit/27055e6d01e3a30e3a5de97f2e56772dbf4f0dfd) Thanks [@tobilen](https://github.com/tobilen)! - Moved the manifest.json out of the frontend package

- [#43](https://github.com/jtl-software/cloud-apps-cli/pull/43) [`36d1518`](https://github.com/jtl-software/cloud-apps-cli/commit/36d1518f8214fdee56cff202456f6b35f8912346) Thanks [@tobilen](https://github.com/tobilen)! - Add register command to generated project

## 0.0.12

### Patch Changes

- [#36](https://github.com/jtl-software/cloud-apps-cli/pull/36) [`adca670`](https://github.com/jtl-software/cloud-apps-cli/commit/adca670a52296d01b2c153b722cc3b51993125d5) Thanks [@tobilen](https://github.com/tobilen)! - Fix .env file detection & deprecated manifest fields

## 0.0.11

### Patch Changes

- [#34](https://github.com/jtl-software/cloud-apps-cli/pull/34) [`1c507dc`](https://github.com/jtl-software/cloud-apps-cli/commit/1c507dc1ff40e84a6a4869012e6849c15156de29) Thanks [@tobilen](https://github.com/tobilen)! - Update to manifest 2.0

## 0.0.10

### Patch Changes

- [#30](https://github.com/jtl-software/cloud-apps-cli/pull/30) [`9561b1c`](https://github.com/jtl-software/cloud-apps-cli/commit/9561b1c291d4df54ba02e71066470250cefea251) Thanks [@Mr-Malomz](https://github.com/Mr-Malomz)! - hotfix: Fix build error in the GraphQLDemo page

## 0.0.9

### Patch Changes

- [#27](https://github.com/jtl-software/cloud-apps-cli/pull/27) [`5ef9ce5`](https://github.com/jtl-software/cloud-apps-cli/commit/5ef9ce57a8162b4a5d4cc19899ee993937dd0eb9) Thanks [@tobilen](https://github.com/tobilen)! - Fix typescript errors and minor styling issues

## 0.0.8

### Patch Changes

- [#20](https://github.com/jtl-software/cloud-apps-cli/pull/20) [`ab20518`](https://github.com/jtl-software/cloud-apps-cli/commit/ab20518f077cb18d8aca24944ca182e3142d16a6) Thanks [@tobilen](https://github.com/tobilen)! - Add GraphQL example implementation

## 0.0.7

### Patch Changes

- [#18](https://github.com/jtl-software/cloud-apps-cli/pull/18) [`191eb59`](https://github.com/jtl-software/cloud-apps-cli/commit/191eb59e8a92d190ab77ed13b89e08b67d9b6bdb) Thanks [@Mr-Malomz](https://github.com/Mr-Malomz)! - docs: clarify placeholder app naming in README and add API proxy configuration to Vite settings

## 0.0.6

### Patch Changes

- [`437fa5f`](https://github.com/jtl-software/cloud-apps-cli/commit/437fa5f270d401dda5647acd415c0df6a3c04728) Thanks [@tobilen](https://github.com/tobilen)! - Add missing manifest fields

## 0.0.5

### Patch Changes

- [#14](https://github.com/jtl-software/cloud-apps-cli/pull/14) [`1fc1644`](https://github.com/jtl-software/cloud-apps-cli/commit/1fc1644d4bfaf38974e23db482f06449a952af1b) Thanks [@tobilen](https://github.com/tobilen)! - update dependencies

## 0.0.4

### Patch Changes

- [#12](https://github.com/jtl-software/cloud-apps-cli/pull/12) [`3eb5574`](https://github.com/jtl-software/cloud-apps-cli/commit/3eb5574d24ee8485939bc22ce1e9c8be9e343ccc) Thanks [@tobilen](https://github.com/tobilen)! - repair deployment, install all dependencies during npm install step

## 0.0.3

### Patch Changes

- [#9](https://github.com/jtl-software/cloud-apps-cli/pull/9) [`5697636`](https://github.com/jtl-software/cloud-apps-cli/commit/5697636be8f917639539f72fbffb9165a2de01b1) Thanks [@tobilen](https://github.com/tobilen)! - Add required meta information, merge \_package.json and add readme for templates

## 0.0.2

### Patch Changes

- [`d7c698c`](https://github.com/jtl-software/cloud-apps-cli/commit/d7c698c311ed8d8ecf093ddf056d9b91cc7ba008) Thanks [@tobilen](https://github.com/tobilen)! - publish templates separately

## 0.0.1

### Patch Changes

- [`845f751`](https://github.com/jtl-software/cloud-apps-cli/commit/845f751930774ebbd0af55abcba505443494befe) Thanks [@tobilen](https://github.com/tobilen)! - initial
