import { verifyAppToken } from '@jtl-software/cloud-apps-auth/verify';

let cachedToken = null;
let expiresAt = 0;

export async function verifyMerchantToken(header = '') {
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token || !process.env.JTL_APP_ID) throw new Error('App-Token oder JTL_APP_ID fehlt.');
  const result = await verifyAppToken(token, {
    issuer: (process.env.JTL_ISSUER || 'https://id.jtl-cloud.com').replace(/\/$/, ''),
    appId: process.env.JTL_APP_ID
  });
  if (!result.valid) throw new Error('App-Token ungültig.');
  const tenantId = result.claims?.['urn:jtl:tenant_id'];
  if (typeof tenantId !== 'string' || !/^[0-9a-fA-F-]{36}$/.test(tenantId)) throw new Error('App-Token enthält keinen gültigen Mandanten.');
  return { tenantId, userId: result.claims.sub };
}

export async function getServiceToken() {
  if (cachedToken && Date.now() < expiresAt - 60000) return cachedToken;
  const { CLIENT_ID, CLIENT_SECRET } = process.env;
  if (!CLIENT_ID || !CLIENT_SECRET) throw new Error('JTL-Servicekonto ist noch nicht registriert.');
  const issuer = (process.env.JTL_ISSUER || 'https://id.jtl-cloud.com').replace(/\/$/, '');
  const response = await fetch(`${issuer}/oauth/v2/token`, {
    method: 'POST',
    headers: { authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`, 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'client_credentials', scope: 'openid' }),
    signal: AbortSignal.timeout(30000)
  });
  const data = await response.json();
  if (!response.ok || !data.access_token) throw new Error(`JTL-Token konnte nicht geladen werden (${response.status}).`);
  cachedToken = data.access_token;
  expiresAt = Date.now() + Number(data.expires_in || 3600) * 1000;
  return cachedToken;
}
