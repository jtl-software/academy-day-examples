import test from 'node:test';
import assert from 'node:assert/strict';
import { summarize } from '../lib/analytics.mjs';
import { fetchProfitRows } from '../lib/jtl.mjs';

test('summarizes revenue, profit and revenue share per grouping', () => {
  const rows = [
    { date: '2026-01-01', supplier: 'A', customer: 'C', address: 'Berlin', invoice: '1', revenue: 100, cost: 60 },
    { date: '2026-01-02', supplier: 'B', customer: 'C', address: 'Hamburg', invoice: '2', revenue: 300, cost: 240 },
    { date: '2025-12-31', supplier: 'A', customer: 'D', address: 'Berlin', invoice: '3', revenue: 900, cost: 100 }
  ];
  const suppliers = summarize(rows, 'supplier', '2026-01-01', '2026-12-31');
  assert.equal(suppliers.total.revenue, 400);
  assert.equal(suppliers.total.profit, 100);
  assert.equal(suppliers.total.margin, .25);
  assert.equal(suppliers.breakdown[0].share, .75);
  assert.equal(summarize(rows, 'customer', '2026-01-01', '2026-12-31').breakdown.length, 1);
  assert.equal(summarize(rows, 'address', '2026-01-01', '2026-12-31', 'Berlin').total.revenue, 100);
});

test('maps JTL invoices, positions and standard supplier', async () => {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async url => {
    const path = new URL(url).pathname;
    const data = path.endsWith('/sales-invoices') ? { items: [{ salesInvoiceId: 'inv1', salesInvoiceNumber: 'RE-1', salesInvoiceDate: '2026-01-02T00:00:00Z', isCancelled: false, billingAddressCompanyName: 'Kunde GmbH', shipmentAddressStreet: 'Testweg 1', shipmentAddressPostalCode: '10115', shipmentAddressCity: 'Berlin', shipmentAddressCountryIso: 'DE', currencyIso: 'EUR' }, { salesInvoiceId: 'inv2', isCancelled: true }], hasNextPage: false }
      : path.endsWith('/sales-invoices/inv1/line-items') ? [{ itemId: 'item1', quantity: 2, salesPriceNet: 100, purchasePriceNet: 40 }]
      : path.endsWith('/items/item1/suppliers') ? { items: [{ supplierId: 'supplier1', supplierName: 'Lieferant GmbH', isDefaultSupplier: true }], hasNextPage: false }
      : null;
    assert.notEqual(data, null, path);
    return { ok: true, json: async () => data };
  };
  try {
    const result = await fetchProfitRows('tenant', 'test-token');
    assert.equal(result.length, 1);
    assert.deepEqual(result[0], { date: '2026-01-02', invoice: 'RE-1', supplier: 'Lieferant GmbH', customer: 'Kunde GmbH', address: 'Testweg 1, 10115 Berlin, DE', revenue: 200, cost: 80 });
  } finally {
    globalThis.fetch = previousFetch;
  }
});
