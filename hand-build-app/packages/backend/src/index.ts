import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import { verifyAppToken } from '@jtl-software/cloud-apps-auth/verify';

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

// How many of the most recent sales orders the dashboard aggregates, and how many line-item
// requests run at once. The line items come from a per-order REST call, so this caps the fan-out.
const SOLD_GOODS_ORDER_LIMIT = 100;
// When filtering by one customer, scan more recent orders (one GraphQL call); line items are then
// only fetched for the orders that belong to that customer, so the fan-out stays small.
const SOLD_GOODS_CUSTOMER_SCAN = 300;
const LINE_ITEM_CONCURRENCY = 8;

// Line item type 1 is an item position; every other type (shipping, coupon, voucher, ...) has no
// article purchase price and is skipped.
const ITEM_LINE_TYPE = 1;

interface SalesOrderNode {
  id: string;
  salesOrderNumber?: string;
  salesOrderDate?: string;
  currencyIso?: string;
  customerId?: string;
}

interface SalesOrderLineItem {
  itemId?: string;
  name?: string;
  sKU?: string;
  type?: number;
  quantity?: number;
  purchasePriceNet?: number;
}

interface ArticleAggregate {
  sku: string;
  name: string;
  quantitySold: number;
  purchasePriceNet: number;
  purchaseValueNet: number;
}

/**
 * Absolute (summed, not averaged) actual purchase value of sold goods: for every item position on
 * the most recent sales orders it sums quantity × purchasePriceNet, where purchasePriceNet is the
 * purchase price recorded on the line item at the time of sale. Lists orders via GraphQL, then
 * reads each order's line items via the REST endpoint that carries the purchase price.
 *
 * A `customerId` in the body restricts the result to the sales orders of that customer (used by the
 * customer sidebar panel).
 */
app.post('/sold-goods', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization ?? '';
    const appToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    const verified = await verifyAppToken(appToken, { issuer: JTL_ISSUER, appId: APP_ID });
    if (!verified.valid) {
      res.status(401).json({ error: 'Invalid app token', checks: verified.checks });
      return;
    }
    const tenantId = verified.claims?.['urn:jtl:tenant_id'];
    if (typeof tenantId !== 'string') {
      res.status(400).json({ error: 'App token has no urn:jtl:tenant_id claim' });
      return;
    }

    const customerId = typeof req.body?.customerId === 'string' ? req.body.customerId : undefined;

    const jwt = await getJwt();
    const headers = { Authorization: `Bearer ${jwt}`, 'X-Tenant-ID': tenantId };

    const scanLimit = customerId ? SOLD_GOODS_CUSTOMER_SCAN : SOLD_GOODS_ORDER_LIMIT;
    const ordersQuery = `query SoldGoodsOrders($first: Int) {
      QuerySalesOrders(first: $first, order: [{ salesOrderDate: DESC }]) {
        totalCount
        nodes { id salesOrderNumber salesOrderDate currencyIso customerId }
      }
    }`;
    const ordersResponse = await fetch(`${API_BASE}/erp/v2/graphql`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: ordersQuery, variables: { first: scanLimit } }),
    });
    const ordersJson = (await ordersResponse.json()) as {
      data?: { QuerySalesOrders?: { totalCount: number; nodes: SalesOrderNode[] } };
      errors?: unknown;
    };
    if (!ordersResponse.ok || ordersJson.errors) {
      console.error(`[/sold-goods] orders query failed for tenant ${tenantId}:`, JSON.stringify(ordersJson.errors ?? ordersResponse.status));
      res.status(502).json({ error: 'Failed to query sales orders', details: ordersJson.errors });
      return;
    }

    const orders = ordersJson.data?.QuerySalesOrders?.nodes ?? [];
    const totalOrderCount = ordersJson.data?.QuerySalesOrders?.totalCount ?? orders.length;
    const relevantOrders = customerId ? orders.filter((o) => o.customerId === customerId) : orders;

    const articles = new Map<string, ArticleAggregate>();
    let totalPurchaseValueNet = 0;
    let ordersWithItems = 0;

    // Fetch each order's line items in small concurrent batches to keep the fan-out bounded.
    for (let i = 0; i < relevantOrders.length; i += LINE_ITEM_CONCURRENCY) {
      const batch = relevantOrders.slice(i, i + LINE_ITEM_CONCURRENCY);
      const lineItemLists = await Promise.all(
        batch.map(async (order) => {
          const r = await fetch(`${API_BASE}/erp/v2/sales-orders/${order.id}/line-items`, { headers });
          if (!r.ok) {
            console.error(`[/sold-goods] line items ${r.status} for order ${order.id}`);
            return [] as SalesOrderLineItem[];
          }
          return (await r.json()) as SalesOrderLineItem[];
        }),
      );

      for (const lineItems of lineItemLists) {
        if (lineItems.length > 0) ordersWithItems += 1;
        for (const li of lineItems) {
          if (li.type !== ITEM_LINE_TYPE) continue;
          const quantity = li.quantity ?? 0;
          const purchasePriceNet = li.purchasePriceNet ?? 0;
          const value = quantity * purchasePriceNet;
          totalPurchaseValueNet += value;

          const key = li.sKU || li.itemId || li.name || 'unknown';
          const existing = articles.get(key);
          if (existing) {
            existing.quantitySold += quantity;
            existing.purchaseValueNet += value;
            existing.purchasePriceNet = purchasePriceNet;
          } else {
            articles.set(key, {
              sku: li.sKU ?? '',
              name: li.name ?? '',
              quantitySold: quantity,
              purchasePriceNet,
              purchaseValueNet: value,
            });
          }
        }
      }
    }

    // One currency label for the KPI; the first order's currency is representative for a single tenant.
    const currencyIso = relevantOrders.find((o) => o.currencyIso)?.currencyIso ?? orders.find((o) => o.currencyIso)?.currencyIso ?? 'EUR';

    res.json({
      totalPurchaseValueNet,
      currencyIso,
      customerId: customerId ?? null,
      ordersConsidered: relevantOrders.length,
      ordersScanned: orders.length,
      ordersWithItems,
      totalOrderCount,
      articles: [...articles.values()].sort((a, b) => b.purchaseValueNet - a.purchaseValueNet),
    });
  } catch (error) {
    console.error('Error in /sold-goods route:', error);
    res.status(500).json({ error: 'Failed to compute sold goods purchase value', message: error instanceof Error ? error.message : String(error) });
  }
});

app.all('/erp-info/:tenantId/:endpoint', async (req: Request, res: Response) => {
  try {
    // Get parameters from the URL and the body if available
    const urlTenantId = req.params.tenantId;
    const urlEndpoint = req.params.endpoint;
    const method = req.method;

    // For POST, PUT, PATCH, check for tenantId and endpoint in the request body
    let tenantId = urlTenantId;
    let endpoint = urlEndpoint;
    let bodyToSend = req.body;

    if (['POST', 'PUT', 'PATCH'].includes(method) && req.body) {
      // Extract _tenantId and _endpoint from body if present
      if (req.body._tenantId) {
        tenantId = req.body._tenantId;
      }

      if (req.body._endpoint) {
        endpoint = req.body._endpoint;
      }

      // Create a new copy of the body without _tenantId and _endpoint
      const { _tenantId, _endpoint, ...cleanedBody } = req.body;
      bodyToSend = cleanedBody;
    }

    // Get JWT for authentication
    const jwt = await getJwt();

    // Set up request options
    const options: RequestInit = {
      method: method,
      headers: {
        'X-Tenant-ID': tenantId as string,
        Authorization: `Bearer ${jwt}`,
        'Content-Type': 'application/json',
      },
    };

    // Add body for methods that support it
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      options.body = JSON.stringify(bodyToSend);
    }

    // Call the JTL Platform API

    const erpInfoResponse = await fetch(`${API_BASE}/erp/${endpoint}`, options);

    // Check if the response is OK and return the appropriate response
    if (erpInfoResponse.ok) {
      const data = await erpInfoResponse.json();
      res.json(data);
    } else {
      const errorText = await erpInfoResponse.text();
      res.status(erpInfoResponse.status).send(errorText);
    }
  } catch (error) {
    console.error('Error in /erp-info route:', error);
    res.status(500).json({
      error: 'Failed to fetch ERP info',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});
