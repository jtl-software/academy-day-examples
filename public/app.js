import { summarize, money, percent } from '/lib/analytics.mjs';
import { createAppBridge } from '/bridge.js';

const $ = selector => document.querySelector(selector);
const colors = ['#6678ec', '#55c6a0', '#f2b66b', '#a48de6', '#8ab5dd', '#d0a9b3'];
const names = { supplier: ['Lieferanten', 'LIEFERANT'], customer: ['Kunden', 'KUNDE'], address: ['Lieferadressen', 'LIEFERADRESSE'] };
let rows = [];
let groupBy = 'supplier';
let source = 'demo';
const embedded = location.pathname === '/erp';
const bridge = embedded ? createAppBridge() : null;

function escapeHtml(value) { return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]); }
function dateRange() {
  if (!rows.length) return ['0000-01-01', '9999-12-31'];
  const end = rows.reduce((max, row) => row.date > max ? row.date : max, rows[0].date);
  const period = $('#period').value;
  if (period === 'all') return ['0000-01-01', '9999-12-31'];
  if (period === 'year') return [`${end.slice(0, 4)}-01-01`, `${end.slice(0, 4)}-12-31`];
  const months = period === 'quarter' ? 2 : 0;
  const date = new Date(`${end.slice(0, 7)}-01T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() - months);
  return [date.toISOString().slice(0, 10), end];
}
function currentData() {
  const [from, to] = dateRange();
  return summarize(rows, groupBy, from, to, $('#search').value);
}
function renderChart(months) {
  const node = $('#chart');
  if (!months.length) { node.innerHTML = '<div class="empty">Keine Daten im gewählten Zeitraum</div>'; return; }
  const width = 640, height = 235, left = 42, right = 12, top = 12, bottom = 30;
  const plotW = width - left - right, plotH = height - top - bottom;
  const max = Math.max(1, ...months.map(m => m.revenue)) * 1.15;
  const x = i => left + (months.length === 1 ? plotW / 2 : i * plotW / (months.length - 1));
  const y = value => top + plotH - value / max * plotH;
  const makePath = key => months.map((m, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(m[key]).toFixed(1)}`).join(' ');
  const area = key => `${makePath(key)} L${x(months.length - 1)} ${top + plotH} L${x(0)} ${top + plotH} Z`;
  const tick = n => n >= 1000 ? `${Math.round(n / 1000)}k` : String(Math.round(n));
  const labels = months.map((m, i) => `<text x="${x(i)}" y="${height - 5}" text-anchor="middle">${new Intl.DateTimeFormat('de-DE', { month: 'short' }).format(new Date(`${m.month}-01T00:00:00Z`))}</text>`).join('');
  const grid = [0, 1, 2, 3, 4].map(i => { const yy = top + plotH * i / 4; return `<line x1="${left}" x2="${width - right}" y1="${yy}" y2="${yy}" stroke="#eef1f6"/><text x="${left - 10}" y="${yy + 3}" text-anchor="end">${tick(max * (4 - i) / 4)}</text>`; }).join('');
  node.innerHTML = `<svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="fill-blue" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#dce2ff" stop-opacity=".8"/><stop offset="1" stop-color="#fff" stop-opacity=".1"/></linearGradient></defs>${grid}<path d="${area('revenue')}" fill="url(#fill-blue)"/><path d="${makePath('revenue')}" fill="none" stroke="#6477ed" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round"/><path d="${makePath('profit')}" fill="none" stroke="#55c6a0" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round"/>${months.map((m,i)=>`<circle cx="${x(i)}" cy="${y(m.revenue)}" r="3.3" fill="#fff" stroke="#6477ed" stroke-width="2"/><circle cx="${x(i)}" cy="${y(m.profit)}" r="3.3" fill="#fff" stroke="#55c6a0" stroke-width="2"/>`).join('')}${labels}</svg>`;
}
function renderDonut(breakdown, total) {
  const top = breakdown.slice(0, 4);
  const rest = breakdown.slice(4).reduce((sum, item) => sum + item.revenue, 0);
  if (rest) top.push({ label: 'Weitere', revenue: rest, share: total.revenue ? rest / total.revenue : 0 });
  let cursor = 0;
  const parts = top.map((group, i) => { const start = cursor; cursor += group.share * 100; return `${colors[i]} ${start}% ${cursor}%`; });
  if (cursor < 100) parts.push(`#edf1f7 ${cursor}% 100%`);
  $('#donut').innerHTML = `<div class="donut" style="background:conic-gradient(${parts.join(',') || '#edf1f7 0% 100%'})"><div class="donut-inner"><strong>${money(total.revenue)}</strong><small>Gesamtumsatz</small></div></div>`;
  $('#donut-legend').innerHTML = top.map((group, i) => `<div class="donut-legend-row"><i style="background:${colors[i]}"></i><span title="${escapeHtml(group.label)}">${escapeHtml(group.label)}</span><strong>${percent(group.share)}</strong></div>`).join('') || '<div class="empty">Keine Einträge</div>';
}
function renderTable(breakdown) {
  const tbody = $('#breakdown-body');
  tbody.innerHTML = breakdown.map(group => `<tr><td title="${escapeHtml(group.label)}"><div class="name-cell"><span class="initial">${escapeHtml(group.label.slice(0, 1).toUpperCase())}</span><span>${escapeHtml(group.label)}</span></div></td><td>${money(group.revenue)}</td><td><div class="share-cell"><span>${percent(group.share)}</span><span class="share-track"><span class="share-fill" style="display:block;width:${Math.max(0, Math.min(100, group.share * 100))}%"></span></span></div></td><td class="${group.profit >= 0 ? 'profit-positive' : 'profit-negative'}">${money(group.profit)}</td><td>${percent(group.margin)}</td></tr>`).join('') || '<tr><td colspan="5" class="empty">Keine passenden Einträge</td></tr>';
  $('#table-count').textContent = `${breakdown.length} Einträge`;
}
function render() {
  const { total, breakdown, months, rowCount } = currentData();
  $('#revenue').textContent = money(total.revenue);
  $('#cost').textContent = money(total.cost);
  $('#profit').textContent = money(total.profit);
  $('#margin').textContent = percent(total.margin);
  $('#cost-ratio').textContent = percent(total.revenue ? total.cost / total.revenue : 0);
  $('#profit-ratio').textContent = percent(total.margin);
  $('#row-count').textContent = new Intl.NumberFormat('de-DE').format(rowCount);
  $('#breakdown-title').textContent = `Profit nach ${names[groupBy][0]}`;
  $('#name-heading').textContent = names[groupBy][1];
  renderChart(months);
  renderDonut(breakdown, total);
  renderTable(breakdown);
}
async function load(force = false) {
  $('#source-label').textContent = 'Daten werden geladen';
  $('#error').hidden = true;
  try {
    const headers = {};
    if (embedded) {
      const { accessToken } = await (await bridge).method.call('getAppToken');
      headers.authorization = `Bearer ${accessToken}`;
    }
    const endpoint = embedded ? force ? '/api/data?refresh=1' : '/api/data' : '/api/demo';
    const response = await fetch(endpoint, { cache: 'no-store', headers });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Daten konnten nicht geladen werden.');
    rows = data.rows;
    source = data.source;
    $('#current-year').textContent = rows.length ? rows.reduce((max, row) => row.date > max ? row.date : max, rows[0].date).slice(0, 4) : '–';
    $('#source-label').textContent = source === 'demo' ? 'Demo-Daten' : 'JTL verbunden';
    render();
  } catch (error) {
    $('#source-label').textContent = 'Verbindung fehlgeschlagen';
    $('#error').textContent = error.message;
    $('#error').hidden = false;
  }
}
document.querySelectorAll('[data-group]').forEach(button => button.addEventListener('click', () => { groupBy = button.dataset.group; document.querySelectorAll('[data-group]').forEach(b => b.classList.toggle('selected', b === button)); render(); }));
$('#period').addEventListener('change', render);
$('#search').addEventListener('input', render);
$('#refresh').addEventListener('click', () => load(true));
$('#export').addEventListener('click', () => {
  const [from, to] = dateRange();
  const query = $('#search').value.toLocaleLowerCase('de-DE');
  const selected = rows.filter(row => row.date >= from && row.date <= to && (!query || [row.supplier, row.customer, row.address, row.invoice].some(value => value.toLocaleLowerCase('de-DE').includes(query))));
  const fields = ['date','invoice','supplier','customer','address','revenue','cost'];
  const csv = '\uFEFF' + [fields.join(';'), ...selected.map(row => fields.map(field => `"${String(row[field]).replaceAll('"', '""')}"`).join(';'))].join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = `profit-pulse-${new Date().toISOString().slice(0,10)}.csv`; link.click(); URL.revokeObjectURL(url);
});
load();
