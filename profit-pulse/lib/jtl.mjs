const base = () => (process.env.JTL_API_BASE || 'https://api.jtl-cloud.com/erp/v2').replace(/\/$/, '');
export async function jtlGet(path, context) {
  if (!context?.tenantId || !context?.accessToken) throw new Error('JTL-Kontext fehlt.');
  const headers = { 'x-tenant-id': context.tenantId, authorization: `Bearer ${context.accessToken}`, accept: 'application/json' };
  const response = await fetch(`${base()}${path}`, { headers, signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`JTL API ${response.status} bei ${path}`);
  return response.json();
}

async function parallelMap(values, limit, fn) {
  const results = new Array(values.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, values.length) }, async () => {
    while (next < values.length) {
      const index = next++;
      results[index] = await fn(values[index]);
    }
  }));
  return results;
}

function customerName(invoice) {
  return invoice.billingAddressCompanyName || [invoice.billingAddressFirstName, invoice.billingAddressLastName].filter(Boolean).join(' ') || invoice.customerNumber || 'Nicht zugeordnet';
}

function deliveryAddress(invoice) {
  const place = [invoice.shipmentAddressPostalCode, invoice.shipmentAddressCity].filter(Boolean).join(' ');
  return [invoice.shipmentAddressCompanyName || [invoice.shipmentAddressFirstName, invoice.shipmentAddressLastName].filter(Boolean).join(' '), invoice.shipmentAddressStreet, place, invoice.shipmentAddressCountryIso].filter(Boolean).join(', ') || 'Nicht zugeordnet';
}

async function itemSupplier(itemId, context) {
  let page = 1;
  const suppliers = [];
  while (true) {
    const result = await jtlGet(`/items/${encodeURIComponent(itemId)}/suppliers?pageNumber=${page}&pageSize=100`, context);
    suppliers.push(...(result.items || []));
    if (!result.hasNextPage) break;
    page = result.nextPageNumber || page + 1;
    if (page > 100) throw new Error(`Zu viele Lieferantenseiten für Artikel ${itemId}.`);
  }
  const selected = suppliers.find(supplier => supplier.isDefaultSupplier) || suppliers[0];
  return selected?.supplierName || selected?.supplierId || 'Nicht zugeordnet';
}

export async function fetchProfitRows(tenantId, accessToken) {
  if (!tenantId || !accessToken) throw new Error('Mandant und Service-Token fehlen.');
  const context = { tenantId, accessToken };
  const invoices = [];
  let page = 1;
  while (true) {
    const result = await jtlGet(`/sales-invoices?pageNumber=${page}&pageSize=100`, context);
    invoices.push(...(result.items || []));
    if (!result.hasNextPage) break;
    page = result.nextPageNumber || page + 1;
    if (page > 100) throw new Error('Mehr als 100 Rechnungsseiten. Bitte Datenabruf eingrenzen.');
  }
  const valid = invoices.filter(invoice => !invoice.isCancelled && !invoice.isDraft);
  const currencies = new Set(valid.map(invoice => invoice.currencyIso || 'EUR'));
  if ([...currencies].some(currency => currency !== 'EUR')) throw new Error('Es liegen Rechnungen in Fremdwährung vor. Eine sichere Umrechnung ist noch nicht konfiguriert.');
  const invoiceItems = await parallelMap(valid, 5, invoice => jtlGet(`/sales-invoices/${encodeURIComponent(invoice.salesInvoiceId)}/line-items`, context));
  const itemIds = [...new Set(invoiceItems.flat().map(line => line.itemId).filter(Boolean))];
  const supplierNames = await parallelMap(itemIds, 5, id => itemSupplier(id, context));
  const supplierMap = new Map(itemIds.map((id, index) => [id, supplierNames[index]]));
  const rows = [];
  valid.forEach((invoice, index) => {
    for (const line of invoiceItems[index]) {
      const quantity = Number(line.quantity);
      const sales = Number(line.salesPriceNet);
      const purchase = Number(line.purchasePriceNet);
      if (![quantity, sales, purchase].every(Number.isFinite)) continue;
      rows.push({
        date: String(invoice.salesInvoiceDate || '').slice(0, 10),
        invoice: invoice.salesInvoiceNumber || invoice.salesInvoiceId,
        supplier: supplierMap.get(line.itemId) || 'Nicht zugeordnet',
        customer: customerName(invoice),
        address: deliveryAddress(invoice),
        revenue: quantity * sales,
        cost: quantity * purchase
      });
    }
  });
  return rows;
}
