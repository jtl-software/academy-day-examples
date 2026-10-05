export interface Item {
  id: string;
  sku: string;
  name: string;
  group: string | null;
  stockAvailable: number;
  stockIncoming: number;
  minimumStock: number;
}

export interface Sale {
  itemId: string;
  quantity: number;
  date: string; // YYYY-MM-DD
  orderNumber: string;
}

export interface ErpData {
  items: Item[];
  sales: Sale[];
}

export type Gql = <T>(query: string, variables?: Record<string, unknown>) => Promise<T>;

interface Page<T> {
  nodes: T[];
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
}

const ORDERS_QUERY = `query Orders($since: DateTime!, $after: String) {
  QuerySalesOrders(first: 200, after: $after, order: [{ salesOrderDate: DESC }],
    where: { salesOrderDate: { gte: $since }, isCancelled: { eq: false } }) {
    nodes { id salesOrderNumber salesOrderDate }
    pageInfo { hasNextPage endCursor }
  }
}`;

const ITEMS_QUERY = `query Items($after: String) {
  QueryItems(first: 200, after: $after, where: { isActive: { eq: true }, isVariationParent: { eq: false } }) {
    nodes { id sku name productGroupName stockAvailable stockIncoming minimumStock }
    pageInfo { hasNextPage endCursor }
  }
}`;

async function paginate<T>(gql: Gql, query: string, field: string, vars: Record<string, unknown>, max: number): Promise<T[]> {
  const out: T[] = [];
  let after: string | null = null;
  do {
    const data: Record<string, Page<T>> = await gql(query, { ...vars, after });
    out.push(...data[field].nodes);
    after = data[field].pageInfo.hasNextPage ? data[field].pageInfo.endCursor : null;
  } while (after && out.length < max);
  return out.slice(0, max);
}

export async function loadErpData(gql: Gql, days: number): Promise<ErpData> {
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  type RawOrder = { id: string; salesOrderNumber: string; salesOrderDate: string };
  type RawItem = { id: string; sku: string; name: string | null; productGroupName: string | null; stockAvailable: number; stockIncoming: number; minimumStock: number };
  const [orders, rawItems] = await Promise.all([
    paginate<RawOrder>(gql, ORDERS_QUERY, 'QuerySalesOrders', { since }, 1000),
    paginate<RawItem>(gql, ITEMS_QUERY, 'QueryItems', {}, 2000),
  ]);

  // The order list has no line items, so they are loaded per order in aliased batches.
  const sales: Sale[] = [];
  for (let i = 0; i < orders.length; i += 20) {
    const batch = orders.slice(i, i + 20);
    const query = `query { ${batch
      .map((o, j) => `o${j}: GetSalesOrderById(salesOrderId: ${JSON.stringify(o.id)}) { lineItems { itemId quantity type } }`)
      .join('\n')} }`;
    const data = await gql<Record<string, { lineItems: { itemId: string | null; quantity: number; type: string }[] } | null>>(query);
    batch.forEach((o, j) => {
      for (const li of data[`o${j}`]?.lineItems ?? []) {
        if (li.type !== 'ITEM' || !li.itemId) continue;
        sales.push({ itemId: li.itemId, quantity: Number(li.quantity), date: o.salesOrderDate.slice(0, 10), orderNumber: o.salesOrderNumber });
      }
    });
  }

  const items = rawItems.map(i => ({
    id: i.id,
    sku: i.sku,
    name: i.name ?? i.sku,
    group: i.productGroupName,
    stockAvailable: Number(i.stockAvailable) || 0,
    stockIncoming: Number(i.stockIncoming) || 0,
    minimumStock: Number(i.minimumStock) || 0,
  }));
  return { items, sales };
}
