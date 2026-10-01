# React Frontend Template

React 19 + Vite + Tailwind CSS + JTL Platform UI

## App modes

| Route | Manifest field | Context |
|-------|---------------|---------|
| `/` | — | Welcome page (behind login) |
| `/setup` | `lifecycle.setupUrl` | App installation (embedded) |
| `/erp` | `capabilities.erp.menuItems[].url` | Main ERP view (embedded) |
| `/pane` | `capabilities.erp.pane[].url` | Sidebar panel (embedded) |
| `/hub` | `capabilities.hub.appLauncher.redirectUrl` | Hub launcher (behind login) |
| `/user-example` | `authentication.publicClient` | Read the signed-in user from the token (claims, access token, userinfo) |
| `/callback` | `authentication.publicClient.redirectUris` | OAuth redirect target |

## Browser login (PKCE)

There are two ways the app runs, and they authenticate differently:

- **Embedded** (inside the ERP/Hub iframe): identity comes from the AppBridge. `/setup`,
  `/erp`, `/pane`, `/graphql-demo` run here. No browser login.
- **Standalone** (opened directly in a browser tab): every page is behind the JTL login.
  A visitor without a session is sent straight to the identity provider, with no
  intermediate "sign in" screen. After signing in they land back where they started, with a
  sign-out bar on top. `/user-example` shows how to read the signed-in user from the token
  (id-token claims, access token, and the userinfo response).

It uses the authorization code flow with PKCE against your app's public client — no secret in the
browser — via [`@jtl-software/cloud-apps-auth`](https://www.npmjs.com/package/@jtl-software/cloud-apps-auth),
which wraps `react-oidc-context` with the JTL defaults. `main.tsx` wraps the app in its
`JtlAuthProvider` (passing the env vars below), and `App.tsx` gates standalone pages with
`RequireJtlAuth` (which also renders the signed-in top bar). Read the session with `useJtlAuth()`.

It reads two env vars, which `npm run register` writes into `.env` after provisioning the
public client:

- `VITE_JTL_CLIENT_ID` — the public client's id
- `VITE_JTL_ISSUER` — the identity provider, e.g. `https://id.dev.jtl-cloud.com`

Until they are set, the standalone pages explain what is missing. The redirect URI is
`http://localhost:3004/callback` and must be one the manifest registered.

## Scripts

- `npm run dev` — Vite dev server on port 3004
- `npm run build` — production build
- `npm run test` — Vitest
