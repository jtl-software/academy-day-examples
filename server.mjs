import http from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname } from 'node:path';
import { demoRows } from './lib/demo.mjs';
import { fetchProfitRows } from './lib/jtl.mjs';
import { verifyMerchantToken, getServiceToken } from './lib/cloud-auth.mjs';

const root = dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.CONDUCTOR_PORT || process.env.PORT || 55050);
const cache = new Map();
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml' };

http.createServer(async (request, response) => {
  const path = new URL(request.url, 'http://localhost').pathname;
  if (path === '/api/demo') {
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.end(JSON.stringify({ source: 'demo', rows: demoRows(), updatedAt: null }));
    return;
  }
  if (path === '/api/connect-tenant') {
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    try {
      const { tenantId } = await verifyMerchantToken(request.headers.authorization);
      await mkdir(join(root, '.data'), { recursive: true });
      await writeFile(join(root, '.data', `${tenantId}.json`), JSON.stringify({ tenantId, connectedAt: new Date().toISOString() }), { mode: 0o600 });
      response.end(JSON.stringify({ success: true, tenantId }));
    } catch (error) {
      response.statusCode = 401;
      response.end(JSON.stringify({ error: error.message }));
    }
    return;
  }
  if (path === '/api/data') {
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.setHeader('Cache-Control', 'no-store');
    try {
      const { tenantId } = await verifyMerchantToken(request.headers.authorization);
      const current = cache.get(tenantId);
      const refresh = new URL(request.url, 'http://localhost').searchParams.has('refresh');
      if (!current || Date.now() - current.at > 300000 || refresh) {
        const rows = await fetchProfitRows(tenantId, await getServiceToken());
        cache.set(tenantId, { rows, at: Date.now() });
      }
      const value = cache.get(tenantId);
      response.end(JSON.stringify({ source: 'jtl', rows: value.rows, updatedAt: new Date(value.at).toISOString() }));
    } catch (error) {
      response.statusCode = error.message.includes('App-Token') || error.message.includes('Mandant') ? 401 : 502;
      response.end(JSON.stringify({ error: error.message }));
    }
    return;
  }
  if (path === '/lib/analytics.mjs') {
    response.setHeader('Content-Type', 'text/javascript; charset=utf-8');
    response.end(await readFile(join(root, 'lib/analytics.mjs')));
    return;
  }
  const staticFiles = { '/': 'index.html', '/erp': 'index.html', '/setup': 'setup.html', '/index.html': 'index.html', '/app.js': 'app.js', '/setup.js': 'setup.js', '/bridge.js': 'bridge.js', '/style.css': 'style.css' };
  if (!staticFiles[path]) { response.writeHead(404).end('Nicht gefunden'); return; }
  const file = join(root, 'public', staticFiles[path]);
  try {
    const body = await readFile(file);
    response.setHeader('Content-Type', mime[extname(file)] || 'application/octet-stream');
    response.end(body);
  } catch { response.writeHead(404).end('Nicht gefunden'); }
}).listen(port, () => console.log(`Profit Dashboard: http://localhost:${port}`));
