import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import { verifyAppToken } from '@jtl-software/cloud-apps-auth/verify';
import { analyze, DEFAULT_OPTIONS, windowStart, type AnalysisOptions } from './analysis.js';
import { demoData } from './demo.js';
import { createGql, loadItems, loadSales } from './erp.js';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(packageRoot, '.env') });
const app = express();
const PORT = Number(process.env.PORT) || 3005;

const REQUIRED_ENV_VARS = ['CLIENT_ID', 'CLIENT_SECRET'] as const;

function getMissingCredentials(): string[] {
  return REQUIRED_ENV_VARS.filter((key) => !process.env[key] || process.env[key]?.trim() === '');
}

function printMissingCredentialsBanner(missing: string[]): void {
  const red = '\x1b[31m';
  const yellow = '\x1b[33m';
  const bold = '\x1b[1m';
  const reset = '\x1b[0m';
  const line = '━'.repeat(72);
  const envPath = path.relative(process.cwd(), path.join(packageRoot, '.env'));
  console.warn(`\n${red}${bold}${line}${reset}`);
  console.warn(`${red}${bold}  ⚠  Missing credentials: ${missing.join(', ')}${reset}`);
  console.warn(`${yellow}  The backend will start, but every JTL API call will fail until you${reset}`);
  console.warn(`${yellow}  add the variables below to ${bold}${envPath}${reset}${yellow} (see ${envPath}.example):${reset}`);
  console.warn('');
  for (const key of missing) {
    console.warn(`${yellow}      ${key}=<paste from Partner Portal>${reset}`);
  }
  console.warn('');
  console.warn(`${yellow}  Get values: https://partner.jtl-cloud.com/ → your app → Client credentials${reset}`);
  console.warn(`${red}${bold}${line}${reset}\n`);
}

const missingCredentials = getMissingCredentials();
if (missingCredentials.length > 0) {
  printMissingCredentialsBanner(missingCredentials);
}

app.use(cors());

app.use(express.json());
console.log('CORS enabled');

app.get('/health', (_req, res) => {
  const missing = getMissingCredentials();
  res.json({
    status: missing.length === 0 ? 'ok' : 'misconfigured',
    missing,
  });
});

app.get('/', async (_req, res) => {
  res.send('Hello from TypeScript + Express!');
});

// The IdP that issues app tokens. `npm run register` writes JTL_ISSUER for a node backend; the
// fallback is the production issuer.
const JTL_ISSUER = (process.env.JTL_ISSUER || 'https://id.jtl-cloud.com').replace(/\/$/, '');
// This app's id: the `aud` an app token must contain. `npm run register` writes JTL_APP_ID.
const APP_ID = (process.env.JTL_APP_ID || '').trim();

// The JTL API host. `npm run register` writes JTL_API_BASE for the target environment; the
// fallback is production.
const API_BASE = (process.env.JTL_API_BASE || 'https://api.jtl-cloud.com').replace(/\/$/, '');

// The service account mints its token at the issuer's token endpoint via the client_credentials
// grant. Zitadel rejects a client_credentials request that asks for no scope.
const TOKEN_URL = `${JTL_ISSUER}/oauth/v2/token`;
const TOKEN_SCOPE = 'openid';

/**
 * Verifies an app token (the host-minted panel token, or the app's own PKCE token) and returns its
 * claims. `verifyAppToken` from `@jtl-software/cloud-apps-auth` checks the signature, issuer and
 * expiry against the IdP's keys, then that `aud` contains this app's id and any
 * `urn:jtl:app_id` is this app - so a token minted for another app can't be replayed here. The
 * frontend sends the token as `Authorization: Bearer <token>`.
 */
app.post('/verify-token', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) {
    res.status(401).json({ valid: false, error: 'Missing Bearer access token' });
    return;
  }
  const result = await verifyAppToken(token, { issuer: JTL_ISSUER, appId: APP_ID });
  res.status(result.valid ? 200 : 401).json(result);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

/**
 * Mints the app's access token via the client_credentials grant against the configured token endpoint.
 */
export async function getJwt(): Promise<string> {
  const clientId = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('CLIENT_ID and CLIENT_SECRET must be defined in .env file');
  }
  const authString = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const body = new URLSearchParams({ grant_type: 'client_credentials' });
  if (TOKEN_SCOPE) body.set('scope', TOKEN_SCOPE);

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${authString}`,
    },
    body,
  });
  const data = await response.json();

  if (response.ok) {
    return data.access_token;
  } else {
    throw new Error(`Failed to fetch JWT (${response.status}): ${data.error}`);
  }
}

app.post('/graphql', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization ?? '';
    const appToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    const result = await verifyAppToken(appToken, { issuer: JTL_ISSUER, appId: APP_ID });
    if (!result.valid) {
      res.status(401).json({ error: 'Invalid app token', checks: result.checks });
      return;
    }

    // The tenant is bound into the app token, so it is trusted here rather than taken from the client.
    const tenantId = result.claims?.['urn:jtl:tenant_id'];
    if (typeof tenantId !== 'string') {
      res.status(400).json({ error: 'App token has no urn:jtl:tenant_id claim' });
      return;
    }

    const jwt = await getJwt();

    const graphqlResponse = await fetch(`${API_BASE}/erp/v2/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwt}`,
        'X-Tenant-ID': tenantId,
      },
      body: JSON.stringify(req.body),
    });

    const responseBody = await graphqlResponse.text();

    // A GraphQL error comes back as HTTP 200 with an `errors` array (each carrying a code and a
    // traceId). Log upstream errors and any non-2xx here so failures are traceable from the backend
    // console, not just the browser. The traceId points to the ERP/Wawi trace for that request.
    let upstreamErrors: unknown;
    try {
      upstreamErrors = JSON.parse(responseBody)?.errors;
    } catch {
      // non-JSON body; the status check below still logs it
    }
    if (!graphqlResponse.ok || upstreamErrors) {
      console.error(
        `[/graphql] upstream ${graphqlResponse.status} for tenant ${tenantId}:`,
        JSON.stringify(upstreamErrors ?? responseBody),
      );
    }

    res.status(graphqlResponse.status).type('application/json').send(responseBody);
  } catch (error) {
    console.error('Error in /graphql route:', error);
    res.status(500).json({
      error: 'Failed to proxy GraphQL request',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

function parseOptions(req: Request): AnalysisOptions {
  const num = (key: string, fallback: number, min: number, max: number): number => {
    const value = Number(req.query[key]);
    return Number.isFinite(value) && value >= min && value <= max ? value : fallback;
  };
  return {
    ...DEFAULT_OPTIONS,
    now: new Date(),
    windowDays: num('days', DEFAULT_OPTIONS.windowDays, 14, 365),
    defaultLeadTimeDays: num('leadTime', DEFAULT_OPTIONS.defaultLeadTimeDays, 1, 180),
  };
}

app.get('/dashboard/demo', (req: Request, res: Response) => {
  const opts = parseOptions(req);
  const { sales, items } = demoData(opts.now, opts.windowDays);
  res.json(analyze(sales, items, opts, true));
});

app.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization ?? '';
    const appToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    const result = await verifyAppToken(appToken, { issuer: JTL_ISSUER, appId: APP_ID });
    if (!result.valid) {
      res.status(401).json({ error: 'Invalid app token', checks: result.checks });
      return;
    }
    const tenantId = result.claims?.['urn:jtl:tenant_id'];
    if (typeof tenantId !== 'string') {
      res.status(400).json({ error: 'App token has no urn:jtl:tenant_id claim' });
      return;
    }

    const opts = parseOptions(req);
    const gql = createGql(API_BASE, await getJwt(), tenantId);
    const sales = await loadSales(gql, windowStart(opts.now, opts.windowDays));
    const items = await loadItems(gql, [...new Set(sales.map(s => s.itemId))]);
    res.json(analyze(sales, items, opts));
  } catch (error) {
    console.error('Error in /dashboard route:', error);
    res.status(502).json({
      error: 'Failed to build dashboard',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});
