import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyze, DEFAULT_OPTIONS, type ItemInfo, type SaleLine } from './analysis.js';

const now = new Date('2026-10-01T12:00:00Z');
const opts = { ...DEFAULT_OPTIONS, now, windowDays: 30 };

const item = (id: string, stockAvailable: number, extra: Partial<ItemInfo> = {}): ItemInfo => ({
  id,
  sku: id.toUpperCase(),
  name: id,
  supplierName: null,
  stockAvailable,
  stockIncoming: 0,
  minimumStock: 0,
  minimumOrderQuantity: 0,
  purchaseInterval: 0,
  leadTimeDays: 10,
  ...extra,
});

/** `perDay` units every day of the 30-day window. */
const steadySales = (itemId: string, perDay: number): SaleLine[] =>
  Array.from({ length: 30 }, (_, i) => ({
    itemId,
    quantity: perDay,
    date: new Date(now.getTime() - (i + 0.5) * 86_400_000).toISOString(),
  }));

test('steady demand: no safety stock, reorder point is demand over lead time', () => {
  const [a] = analyze(steadySales('a', 2), [item('a', 100)], opts).items;
  assert.equal(a.unitsSold, 60);
  assert.equal(a.dailyDemand, 2);
  assert.equal(a.safetyStock, 0);
  assert.equal(a.reorderPoint, 20);
  assert.equal(a.daysOfCover, 50);
  assert.equal(a.status, 'ok');
  assert.equal(a.suggestedQuantity, 0);
});

test('"soon" just above the reorder point, "reorder" at it', () => {
  const [a] = analyze(steadySales('a', 2), [item('a', 24)], opts).items;
  assert.equal(a.status, 'soon');
  const [b] = analyze(steadySales('b', 2), [item('b', 20)], opts).items;
  assert.equal(b.status, 'reorder');
  // target = 2 * (10 + 30) = 80, position 20
  assert.equal(b.suggestedQuantity, 60);
});

test('stock running out before the lead time is "critical"', () => {
  const [a] = analyze(steadySales('a', 2), [item('a', 6)], opts).items;
  assert.equal(a.status, 'critical');
  assert.equal(a.daysOfCover, 3);
  assert.equal(a.reorderDate, now.toISOString());
});

test('incoming stock counts toward the reorder decision', () => {
  const [a] = analyze(steadySales('a', 2), [item('a', 6, { stockIncoming: 100 })], opts).items;
  assert.equal(a.status, 'ok');
});

test('missing lead time falls back to the default', () => {
  const [a] = analyze(steadySales('a', 1), [item('a', 50, { leadTimeDays: null })], opts).items;
  assert.equal(a.leadTimeDays, DEFAULT_OPTIONS.defaultLeadTimeDays);
  assert.equal(a.leadTimeIsDefault, true);
});

test('volatile demand adds safety stock and minimum order quantity applies', () => {
  const sales = steadySales('a', 0).map((s, i) => ({ ...s, quantity: i % 2 === 0 ? 4 : 0 }));
  const [a] = analyze(sales, [item('a', 5, { minimumOrderQuantity: 500 })], opts).items;
  assert.ok(a.safetyStock > 0);
  assert.equal(a.suggestedQuantity, 500);
});

test('items without sales are ignored and urgent items sort first', () => {
  const sales = [...steadySales('ok', 1), ...steadySales('crit', 1)];
  const result = analyze(sales, [item('ok', 500), item('crit', 1), item('idle', 0)], opts);
  assert.deepEqual(result.items.map(i => i.itemId), ['crit', 'ok']);
  assert.equal(result.totals.critical, 1);
});

test('trend compares second half of the window with the first half', () => {
  const sales = steadySales('a', 1).map(s => (new Date(s.date) > new Date(now.getTime() - 15 * 86_400_000) ? { ...s, quantity: 3 } : s));
  const [a] = analyze(sales, [item('a', 1000)], opts).items;
  assert.equal(a.trendPct, 200);
});
