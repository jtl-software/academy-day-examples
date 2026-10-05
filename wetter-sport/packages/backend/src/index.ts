import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import { verifyAppToken } from '@jtl-software/cloud-apps-auth/verify';
import { dashboardInsights, itemInsights } from './analysis.js';
import { demoData } from './demo.js';
import { loadErpData, type ErpData, type Gql } from './erp.js';
import { getWeather, LOOKBACK_DAYS, type Location } from './weather.js';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(packageRoot, '.env') });
const app = express();
const PORT = Number(process.env.PORT) || 3005;

const JTL_ISSUER = (process.env.JTL_ISSUER || 'https://id.jtl-cloud.com').replace(/\/$/, '');
const APP_ID = (process.env.JTL_APP_ID || '').trim();
const API_BASE = (process.env.JTL_API_BASE || 'https://api.jtl-cloud.com').replace(/\/$/, '');
const TOKEN_URL = `${JTL_ISSUER}/oauth/v2/token`;

const DEFAULT_LOCATION: Location = {
  lat: Number(process.env.SHOP_LAT) || 51.0554,
  lon: Number(process.env.SHOP_LON) || 6.2264,
  name: process.env.SHOP_CITY || 'Hückelhoven',
};

if (!process.env.CLIENT_ID || !process.env.CLIENT_SECRET) {
  console.warn('\x1b[33m⚠  CLIENT_ID/CLIENT_SECRET missing in packages/backend/.env. Only demo data will work. Run `npm run register`.\x1b[0m');
}

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: process.env.CLIENT_ID && process.env.CLIENT_SECRET ? 'ok' : 'misconfigured' });
});

app.post('/verify-token', async (req: Request, res: Response) => {
  const result = await verifyAppToken(bearer(req), { issuer: JTL_ISSUER, appId: APP_ID });
  res.status(result.valid ? 200 : 401).json(result);
});

let serviceToken: { value: string; expires: number } | null = null;

/** Service account token via the client_credentials grant, reused until shortly before it expires. */
async function getJwt(): Promise<string> {
  if (serviceToken && serviceToken.expires > Date.now() + 60_000) return serviceToken.value;
  const { CLIENT_ID, CLIENT_SECRET } = process.env;
  if (!CLIENT_ID || !CLIENT_SECRET) throw new Error('CLIENT_ID and CLIENT_SECRET must be defined in .env file');
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
    },
    body: new URLSearchParams({ grant_type: 'client_credentials', scope: 'openid' }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`Failed to fetch JWT (${response.status}): ${data.error}`);
  serviceToken = { value: data.access_token, expires: Date.now() + (data.expires_in ?? 300) * 1000 };
  return serviceToken.value;
}

function gqlFor(tenantId: string): Gql {
  return async <T>(query: string, variables?: Record<string, unknown>) => {
    const res = await fetch(`${API_BASE}/erp/v2/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await getJwt()}`, 'X-Tenant-ID': tenantId },
      body: JSON.stringify({ query, variables }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok || body?.errors?.length) {
      console.error(`[graphql] ${res.status} for tenant ${tenantId}:`, JSON.stringify(body?.errors ?? body));
      throw new Error(body?.errors?.[0]?.message ?? `ERP API ${res.status}`);
    }
    return body.data as T;
  };
}

function bearer(req: Request): string {
  const h = req.headers.authorization ?? '';
  return h.startsWith('Bearer ') ? h.slice(7) : '';
}

const erpCache = new Map<string, { at: number; data: Promise<ErpData> }>();

function erpData(tenantId: string): Promise<ErpData> {
  const hit = erpCache.get(tenantId);
  if (hit && Date.now() - hit.at < 10 * 60_000) return hit.data;
  const data = loadErpData(gqlFor(tenantId), LOOKBACK_DAYS);
  data.catch(() => erpCache.delete(tenantId));
  erpCache.set(tenantId, { at: Date.now(), data });
  return data;
}

function locationFrom(req: Request): Location {
  const lat = Number(req.query.lat);
  const lon = Number(req.query.lon);
  if (!req.query.lat || !Number.isFinite(lat) || !Number.isFinite(lon)) return DEFAULT_LOCATION;
  return { lat, lon, name: String(req.query.name ?? '') };
}

/** Real ERP data for a verified app token; demo data when asked for or when there is no token. */
async function context(req: Request) {
  const location = locationFrom(req);
  const weather = await getWeather(location);
  const token = bearer(req);
  if (req.query.demo === '1' || !token) {
    return { demo: true, location, weather, data: demoData(weather.history) };
  }
  const result = await verifyAppToken(token, { issuer: JTL_ISSUER, appId: APP_ID });
  const tenantId = result.claims?.['urn:jtl:tenant_id'];
  if (!result.valid || typeof tenantId !== 'string') throw Object.assign(new Error('Invalid app token'), { status: 401 });
  return { demo: false, location, weather, data: await erpData(tenantId) };
}

function fail(res: Response, error: unknown) {
  console.error(error);
  const status = (error as { status?: number }).status ?? 500;
  res.status(status).json({ error: error instanceof Error ? error.message : String(error) });
}

app.get('/insights/item/:itemId', async (req: Request, res: Response) => {
  try {
    const { demo, location, weather, data } = await context(req);
    let itemId = String(req.params.itemId);
    // A real ERP item id has no demo counterpart, so it maps onto one demo item.
    if (demo && !data.items.some(i => i.id === itemId)) {
      const hash = [...itemId].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
      itemId = data.items[hash % data.items.length].id;
    }
    res.json({ demo, location, ...itemInsights(data, weather.history, itemId) });
  } catch (error) {
    fail(res, error);
  }
});

app.get('/insights/dashboard', async (req: Request, res: Response) => {
  try {
    const { demo, location, weather, data } = await context(req);
    res.json({ demo, location, salesCount: data.sales.length, ...dashboardInsights(data, weather.history, weather.forecast) });
  } catch (error) {
    fail(res, error);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
