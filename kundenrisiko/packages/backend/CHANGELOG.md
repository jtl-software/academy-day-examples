# @jtl/cloud-app-template-backend-dotnet

## 0.2.0

### Minor Changes

- [#170](https://github.com/jtl-software/cloud-apps-cli/pull/170) [`cf452e7`](https://github.com/jtl-software/cloud-apps-cli/commit/cf452e7a8a7ad99da9a9c5d2d0d457777885e88d) Thanks [@Mr-Malomz](https://github.com/Mr-Malomz)! - Port node's `verifyAppToken` contract into the PHP and .NET backend templates, replacing the old bespoke session-token design.
  
  - **PHP and .NET templates** gain `AppTokenVerifier`/`AppTokenChecks`/`AppTokenResult` (JWKS-based, checking signature, issuer, `aud`, and the optional `urn:jtl:app_id` claim), replacing `SessionVerifier`/`JwtVerificationService` and the Ed25519/libsodium/NSec verification path.
  - `/graphql` and `/verify-token` now read `Authorization: Bearer <app token>` instead of `X-Session-Token`, matching the frontend (which already sent Bearer tokens in all three languages). Tenant id comes from the verified token's `urn:jtl:tenant_id` claim instead of a local tenant map.
  - `/connect-tenant` and (.NET only) `/current-tenant` are removed, along with `TenantMappingService` — `/erp-info/{tenantId}/{endpoint}` now trusts the URL's tenant id directly, matching node's current behavior.
  - Drops now-unused dependencies: PHP's `ext-sodium` and `ramsey/uuid`; .NET's `NSec.Cryptography`.
  - **.NET**: fixes a latent bug where `new StringContent(json, Encoding.UTF8, "application/json")` sends `Content-Type: application/json; charset=utf-8`, which the real ERP API rejects — now sends a bare `application/json`, matching node and PHP. This was previously unreachable because every request died at the old `X-Session-Token` check first.
  - `.env.example` (PHP) and `appsettings.Local.json.example`/`appsettings.json` (.NET) document the new `JTL_APP_ID`/`JtlPlatform:AppId` key.
  
  - **`register`** now also writes `JtlPlatform:AppId` into a scaffolded .NET app's `appsettings.Local.json`, mirroring what it already did for PHP's `JTL_APP_ID` (PHP is detected as a `node`-kind backend, so it got this for free). Without it, `/verify-token`'s `audience` check always failed on a freshly registered .NET app because `JtlPlatform:AppId` was never populated.

## 0.1.0

### Minor Changes

- [#168](https://github.com/jtl-software/cloud-apps-cli/pull/168) [`3600aab`](https://github.com/jtl-software/cloud-apps-cli/commit/3600aab96cb873ab0479212be57a1835ff0800d4) Thanks [@tobilen](https://github.com/tobilen)! - Make Zitadel service accounts the default backend authentication, replacing Ory for the default flow (Ory stays available via `--legacy`).
  
  - **Scaffold** drops the `--next` flag; the selective-halves flow (each half optional, declaring a public client and/or service account) is now the default.
  - **register** persists the app's Zitadel service account (`credentials.serviceAccount`) as the backend's client id/secret and no longer writes the Ory auth host for the default flow.
  - **Backend templates (Node, .NET, PHP)** mint their access token at `JTL_ISSUER` + `/oauth/v2/token` (the Zitadel token endpoint) with the `client_credentials` grant and a hardcoded `openid` scope, replacing the Ory `/oauth2/token` endpoint.
  - **cloud-apps-auth** enables `automaticSilentRenew` when `offline_access` is requested (the default scope), so the public client renews its access token from the refresh token.
  - **`--legacy` scaffold flag** (compat, node backend only): scaffolds the backend for the Ory M2M client-credentials flow instead of the Zitadel service account. `register` then persists the app's Ory client and writes the Ory auth host; the backend still verifies the incoming app token and reads the tenant id from it.

## 0.0.13

### Patch Changes

- [#124](https://github.com/jtl-software/cloud-apps-cli/pull/124) [`db901d3`](https://github.com/jtl-software/cloud-apps-cli/commit/db901d350cf2d54d07b180eac0d89c09b8f17998) Thanks [@tobilen](https://github.com/tobilen)! - Show more of the login/backend flow in the React template:

  - The `/login` page now shows the OIDC `/userinfo` response for the signed-in user, via a new `fetchUserInfo` helper exported from `@jtl-software/cloud-apps-auth`.
  - Every backend template (node, php, dotnet) gains a `/verify-token` endpoint that checks the user's access token against the JTL IdP (signature via JWKS, issuer, expiry) - a reference for how backend developers verify a JTL token. `register` writes `VITE_BACKEND_URL` (frontend) plus the backend's issuer (`JTL_ISSUER` for node/php, `JtlPlatform:Issuer` for dotnet), and the `/login` page gains a "Verify token in backend" button.
  - The React template now uses `@vitejs/plugin-react` instead of `@vitejs/plugin-react-swc`, which removes the Vite "we recommend switching" warning when no SWC plugins are used.
  - The backend dev port is read from the `PORT` env var (node/php `.env`, default 3005) instead of being hardcoded; `register` derives `VITE_BACKEND_URL` from that env value and the Vite dev proxy reads it from `VITE_BACKEND_URL`.

## 0.0.12

### Patch Changes

- [`47ebb33`](https://github.com/jtl-software/cloud-apps-cli/commit/47ebb337e15a39e75c28d2daaffec8e764f3f2ec) Thanks [@tobilen](https://github.com/tobilen)! - Fix context

## 0.0.11

### Patch Changes

- [#50](https://github.com/jtl-software/cloud-apps-cli/pull/50) [`09cdd80`](https://github.com/jtl-software/cloud-apps-cli/commit/09cdd8006024901abac5f9f861917c2599601a14) Thanks [@Mr-Malomz](https://github.com/Mr-Malomz)! - update JWKS key selection to explicitly filter by use and alg properties in Node and .NET templates

## 0.0.10

### Patch Changes

- [#46](https://github.com/jtl-software/cloud-apps-cli/pull/46) [`53e27ae`](https://github.com/jtl-software/cloud-apps-cli/commit/53e27ae5fa378292191a8fa30769b8275ba51ed9) Thanks [@tobilen](https://github.com/tobilen)! - Pin to newest Node LTS Version

## 0.0.9

### Patch Changes

- [#43](https://github.com/jtl-software/cloud-apps-cli/pull/43) [`90cd2f7`](https://github.com/jtl-software/cloud-apps-cli/commit/90cd2f7eb422dcb9e6870cc7ec51015941eeed7b) Thanks [@tobilen](https://github.com/tobilen)! - Warn loudly when CLIENT_ID / CLIENT_SECRET are missing. Backends print a red startup banner pointing at the env/config file, and expose `GET /health` returning `{ status, missing }`. The React frontend polls `/health` and renders a yellow banner across all routes when the backend reports a misconfiguration, so the dev sees the issue in the browser even if they missed the terminal output.

- [#43](https://github.com/jtl-software/cloud-apps-cli/pull/43) [`27055e6`](https://github.com/jtl-software/cloud-apps-cli/commit/27055e6d01e3a30e3a5de97f2e56772dbf4f0dfd) Thanks [@tobilen](https://github.com/tobilen)! - Moved the manifest.json out of the frontend package

- [#43](https://github.com/jtl-software/cloud-apps-cli/pull/43) [`36d1518`](https://github.com/jtl-software/cloud-apps-cli/commit/36d1518f8214fdee56cff202456f6b35f8912346) Thanks [@tobilen](https://github.com/tobilen)! - Add register command to generated project

## 0.0.8

### Patch Changes

- [#40](https://github.com/jtl-software/cloud-apps-cli/pull/40) [`b3b64b5`](https://github.com/jtl-software/cloud-apps-cli/commit/b3b64b58d734fe8ba564f929da112c41d6178199) Thanks [@Mr-Malomz](https://github.com/Mr-Malomz)! - Hardcode production API and Auth URLs in backend templates, removing environment-specific logic.

## 0.0.7

### Patch Changes

- [#27](https://github.com/jtl-software/cloud-apps-cli/pull/27) [`5ef9ce5`](https://github.com/jtl-software/cloud-apps-cli/commit/5ef9ce57a8162b4a5d4cc19899ee993937dd0eb9) Thanks [@tobilen](https://github.com/tobilen)! - Fix typescript errors and minor styling issues

## 0.0.6

### Patch Changes

- [#24](https://github.com/jtl-software/cloud-apps-cli/pull/24) [`46df4a5`](https://github.com/jtl-software/cloud-apps-cli/commit/46df4a5b2bfabeea3db6837cc557fcda41fa8671) Thanks [@tobilen](https://github.com/tobilen)! - Fix postinstall script on windows

- [#25](https://github.com/jtl-software/cloud-apps-cli/pull/25) [`93ad0e9`](https://github.com/jtl-software/cloud-apps-cli/commit/93ad0e9665918044168b367bbcf898da1a155786) Thanks [@tobilen](https://github.com/tobilen)! - Wrap postinstall script in guard clause to prevent edge cases

## 0.0.5

### Patch Changes

- [#20](https://github.com/jtl-software/cloud-apps-cli/pull/20) [`ab20518`](https://github.com/jtl-software/cloud-apps-cli/commit/ab20518f077cb18d8aca24944ca182e3142d16a6) Thanks [@tobilen](https://github.com/tobilen)! - Add GraphQL example implementation

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
