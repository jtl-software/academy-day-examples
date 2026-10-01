# @jtl/cloud-app-template-backend-node

## 0.3.1

### Patch Changes

- [#181](https://github.com/jtl-software/cloud-apps-cli/pull/181) [`699df9e`](https://github.com/jtl-software/cloud-apps-cli/commit/699df9ed961f79aaab443f0f764d589aed0da0ae) Thanks [@tobilen](https://github.com/tobilen)! - Stop logging client credentials in the Node backend template. `getJwt()` printed the full `CLIENT_ID` and a partially-masked `CLIENT_SECRET` to the console on every token mint (once per `/graphql` and `/erp-info` request). Removed both debug lines.

## 0.3.0

### Minor Changes

- [#168](https://github.com/jtl-software/cloud-apps-cli/pull/168) [`3600aab`](https://github.com/jtl-software/cloud-apps-cli/commit/3600aab96cb873ab0479212be57a1835ff0800d4) Thanks [@tobilen](https://github.com/tobilen)! - Make Zitadel service accounts the default backend authentication, replacing Ory for the default flow (Ory stays available via `--legacy`).
  
  - **Scaffold** drops the `--next` flag; the selective-halves flow (each half optional, declaring a public client and/or service account) is now the default.
  - **register** persists the app's Zitadel service account (`credentials.serviceAccount`) as the backend's client id/secret and no longer writes the Ory auth host for the default flow.
  - **Backend templates (Node, .NET, PHP)** mint their access token at `JTL_ISSUER` + `/oauth/v2/token` (the Zitadel token endpoint) with the `client_credentials` grant and a hardcoded `openid` scope, replacing the Ory `/oauth2/token` endpoint.
  - **cloud-apps-auth** enables `automaticSilentRenew` when `offline_access` is requested (the default scope), so the public client renews its access token from the refresh token.
  - **`--legacy` scaffold flag** (compat, node backend only): scaffolds the backend for the Ory M2M client-credentials flow instead of the Zitadel service account. `register` then persists the app's Ory client and writes the Ory auth host; the backend still verifies the incoming app token and reads the tenant id from it.

### Patch Changes

- Updated dependencies [[`3600aab`](https://github.com/jtl-software/cloud-apps-cli/commit/3600aab96cb873ab0479212be57a1835ff0800d4)]:
  - @jtl-software/cloud-apps-auth@0.6.0

## 0.2.1

### Patch Changes

- Updated dependencies [[`0061556`](https://github.com/jtl-software/cloud-apps-cli/commit/0061556648566dcaa1c0efecbd6b8d90a73b1595)]:
  - @jtl-software/cloud-apps-auth@0.5.0

## 0.2.0

### Minor Changes

- [#162](https://github.com/jtl-software/cloud-apps-cli/pull/162) [`95372e5`](https://github.com/jtl-software/cloud-apps-cli/commit/95372e50c70aee267dba2d93f0ec2703135f4aa2) Thanks [@tobilen](https://github.com/tobilen)! - Rename the app's identity config from "project id" to "app id" everywhere, since an app's Zitadel project is created with the app id as its id, so the two are the same value.
  
  - `verifyAppToken`/`VerifyAppTokenOptions` now takes `appId` instead of `projectId` (breaking; the value is unchanged).
  - The node backend template reads `JTL_APP_ID` instead of `JTL_APP_PROJECT_ID`.
  - `npm run register` now writes `JTL_APP_ID` into the backend `.env`, so a scaffolded app's `/verify-token` and `/graphql` accept its own tokens without the developer setting it by hand.

### Patch Changes

- Updated dependencies [[`95372e5`](https://github.com/jtl-software/cloud-apps-cli/commit/95372e50c70aee267dba2d93f0ec2703135f4aa2)]:
  - @jtl-software/cloud-apps-auth@0.4.0

## 0.1.0

### Minor Changes

- [#160](https://github.com/jtl-software/cloud-apps-cli/pull/160) [`b1b5b8c`](https://github.com/jtl-software/cloud-apps-cli/commit/b1b5b8c7f2fcc32999d4ef66cebcd6d668d60912) Thanks [@tobilen](https://github.com/tobilen)! - Switch the scaffolded app to the DP-735 app token and retire the session token. The node backend's `/verify-token` and `/graphql` now verify the incoming token with `verifyAppToken` from `@jtl-software/cloud-apps-auth` (signature, issuer, expiry, and `aud` contains the app's Zitadel project id), and `/graphql` reads the tenant from the token's `urn:jtl:tenant_id` claim rather than a session token. Set `JTL_APP_PROJECT_ID` to the app's Zitadel project id. The React template's setup and GraphQL pages call `getAppToken` on the bridge instead of `getSessionToken`. The `/connect-tenant` route, the session-token verifier, and the now-unused `jose` dependency are removed.

## 0.0.17

### Patch Changes

- [#152](https://github.com/jtl-software/cloud-apps-cli/pull/152) [`a0e3b30`](https://github.com/jtl-software/cloud-apps-cli/commit/a0e3b3020342fc3698bdb5546c16dede55a7054d) Thanks [@tobilen](https://github.com/tobilen)! - Point a scaffolded node backend at the right environment. The backend now reads the JTL API and Ory-auth hosts from `JTL_API_BASE` / `JTL_AUTH_BASE` (defaulting to production) instead of hard-coding prod, and `register` writes both into `packages/backend/.env` from its `--api-host` (the Ory auth host is derived from it). A dev/qa app therefore authenticates against its own environment, so `getJwt` no longer fails with `401 invalid_client` and `/connect-tenant`, `/graphql`, and `/erp-info` hit the matching env. The /graphql proxy also logs upstream GraphQL errors (with their traceId) and any non-2xx server-side, so failures are traceable from the backend console.

## 0.0.16

### Patch Changes

- [#124](https://github.com/jtl-software/cloud-apps-cli/pull/124) [`db901d3`](https://github.com/jtl-software/cloud-apps-cli/commit/db901d350cf2d54d07b180eac0d89c09b8f17998) Thanks [@tobilen](https://github.com/tobilen)! - Show more of the login/backend flow in the React template:

  - The `/login` page now shows the OIDC `/userinfo` response for the signed-in user, via a new `fetchUserInfo` helper exported from `@jtl-software/cloud-apps-auth`.
  - Every backend template (node, php, dotnet) gains a `/verify-token` endpoint that checks the user's access token against the JTL IdP (signature via JWKS, issuer, expiry) - a reference for how backend developers verify a JTL token. `register` writes `VITE_BACKEND_URL` (frontend) plus the backend's issuer (`JTL_ISSUER` for node/php, `JtlPlatform:Issuer` for dotnet), and the `/login` page gains a "Verify token in backend" button.
  - The React template now uses `@vitejs/plugin-react` instead of `@vitejs/plugin-react-swc`, which removes the Vite "we recommend switching" warning when no SWC plugins are used.
  - The backend dev port is read from the `PORT` env var (node/php `.env`, default 3005) instead of being hardcoded; `register` derives `VITE_BACKEND_URL` from that env value and the Vite dev proxy reads it from `VITE_BACKEND_URL`.

## 0.0.15

### Patch Changes

- [#80](https://github.com/jtl-software/cloud-apps-cli/pull/80) [`b39dc0f`](https://github.com/jtl-software/cloud-apps-cli/commit/b39dc0f41782036a99f0a1da3cb0dc23fa2fdf6c) Thanks [@tobilen](https://github.com/tobilen)! - Update dependencies

## 0.0.14

### Patch Changes

- [`47ebb33`](https://github.com/jtl-software/cloud-apps-cli/commit/47ebb337e15a39e75c28d2daaffec8e764f3f2ec) Thanks [@tobilen](https://github.com/tobilen)! - Fix context

## 0.0.13

### Patch Changes

- [#50](https://github.com/jtl-software/cloud-apps-cli/pull/50) [`09cdd80`](https://github.com/jtl-software/cloud-apps-cli/commit/09cdd8006024901abac5f9f861917c2599601a14) Thanks [@Mr-Malomz](https://github.com/Mr-Malomz)! - update JWKS key selection to explicitly filter by use and alg properties in Node and .NET templates

## 0.0.12

### Patch Changes

- [#46](https://github.com/jtl-software/cloud-apps-cli/pull/46) [`53e27ae`](https://github.com/jtl-software/cloud-apps-cli/commit/53e27ae5fa378292191a8fa30769b8275ba51ed9) Thanks [@tobilen](https://github.com/tobilen)! - Pin to newest Node LTS Version

## 0.0.11

### Patch Changes

- [#43](https://github.com/jtl-software/cloud-apps-cli/pull/43) [`90cd2f7`](https://github.com/jtl-software/cloud-apps-cli/commit/90cd2f7eb422dcb9e6870cc7ec51015941eeed7b) Thanks [@tobilen](https://github.com/tobilen)! - Warn loudly when CLIENT_ID / CLIENT_SECRET are missing. Backends print a red startup banner pointing at the env/config file, and expose `GET /health` returning `{ status, missing }`. The React frontend polls `/health` and renders a yellow banner across all routes when the backend reports a misconfiguration, so the dev sees the issue in the browser even if they missed the terminal output.

- [#43](https://github.com/jtl-software/cloud-apps-cli/pull/43) [`27055e6`](https://github.com/jtl-software/cloud-apps-cli/commit/27055e6d01e3a30e3a5de97f2e56772dbf4f0dfd) Thanks [@tobilen](https://github.com/tobilen)! - Moved the manifest.json out of the frontend package

- [#43](https://github.com/jtl-software/cloud-apps-cli/pull/43) [`36d1518`](https://github.com/jtl-software/cloud-apps-cli/commit/36d1518f8214fdee56cff202456f6b35f8912346) Thanks [@tobilen](https://github.com/tobilen)! - Add register command to generated project

## 0.0.10

### Patch Changes

- [#40](https://github.com/jtl-software/cloud-apps-cli/pull/40) [`b3b64b5`](https://github.com/jtl-software/cloud-apps-cli/commit/b3b64b58d734fe8ba564f929da112c41d6178199) Thanks [@Mr-Malomz](https://github.com/Mr-Malomz)! - Hardcode production API and Auth URLs in backend templates, removing environment-specific logic.

## 0.0.9

### Patch Changes

- [#36](https://github.com/jtl-software/cloud-apps-cli/pull/36) [`adca670`](https://github.com/jtl-software/cloud-apps-cli/commit/adca670a52296d01b2c153b722cc3b51993125d5) Thanks [@tobilen](https://github.com/tobilen)! - Fix .env file detection & deprecated manifest fields

## 0.0.8

### Patch Changes

- [#27](https://github.com/jtl-software/cloud-apps-cli/pull/27) [`5ef9ce5`](https://github.com/jtl-software/cloud-apps-cli/commit/5ef9ce57a8162b4a5d4cc19899ee993937dd0eb9) Thanks [@tobilen](https://github.com/tobilen)! - Fix typescript errors and minor styling issues

## 0.0.7

### Patch Changes

- [#22](https://github.com/jtl-software/cloud-apps-cli/pull/22) [`b8b4d63`](https://github.com/jtl-software/cloud-apps-cli/commit/b8b4d6396095b8ae8374c124adbb0de07725dda1) Thanks [@tobilen](https://github.com/tobilen)! - Readd .env.example

## 0.0.6

### Patch Changes

- [#20](https://github.com/jtl-software/cloud-apps-cli/pull/20) [`ab20518`](https://github.com/jtl-software/cloud-apps-cli/commit/ab20518f077cb18d8aca24944ca182e3142d16a6) Thanks [@tobilen](https://github.com/tobilen)! - Add GraphQL example implementation

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
