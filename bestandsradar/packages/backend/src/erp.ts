import type { ItemInfo, SaleLine } from './analysis.js';

export type Gql = <T>(query: string, variables?: Record<string, unknown>) => Promise<T>;

/** Batch size for aliased per-id queries; keeps each request under the API's cost limit. */
const BATCH = 20;

const chunk = <T>(list: T[], size: number): T[][] =>
  Array.from({ length: Math.ceil(list.length / size) }, (_, i) => list.slice(i * size, (i + 1) * size));

export function createGql(apiBase: string, accessToken: string, tenantId: string): Gql {
  return async <T>(query: string, variables?: Record<string, unknown>): Promise<T> => {
    const res = await fetch(`${apiBase}/erp/v2/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}`, 'X-Tenant-ID': tenantId },
      body: JSON.stringify({ query, variables }),
    });
    const body = (await res.json().catch(() => ({}))) as { data?: T; errors?: unknown; message?: string };
    if (!res.ok || body.errors || !body.data) {
      throw new Error(`ERP GraphQL ${res.status}: ${JSON.stringify(body.errors ?? body.message ?? body)}`);
    }
    return body.data;
  };
}

interface OrderPage {
  QuerySalesOrders: { pageInfo: { hasNextPage: boolean; endCursor: string | null }; nodes: { id: string }[] };
}

interface OrderDetail {
  salesOrderDate: string;
  lineItems: { itemId: string | null; quantity: number; lineItemType: string }[];
}

export async function loadSales(gql: Gql, from: Date): Promise<SaleLine[]> {
  const orderIds: string[] = [];
  let after: string | null = null;
  do {
    const page: OrderPage = await gql<OrderPage>(
      `query Orders($from: DateTime!, $after: String) {
        QuerySalesOrders(first: 100, after: $after, where: { salesOrderDate: { gte: $from }, isCancelled: { eq: false } }) {
          pageInfo { hasNextPage endCursor }
          nodes { id }
        }
      }`,
      { from: from.toISOString(), after },
    );
    orderIds.push(...page.QuerySalesOrders.nodes.map(n => n.id));
    after = page.QuerySalesOrders.pageInfo.hasNextPage ? page.QuerySalesOrders.pageInfo.endCursor : null;
  } while (after);

  const lines: SaleLine[] = [];
  for (const ids of chunk(orderIds, BATCH)) {
    const fields = ids
      .map((id, i) => `o${i}: GetSalesOrderById(salesOrderId: ${JSON.stringify(id)}) { salesOrderDate lineItems { itemId quantity lineItemType } }`)
      .join('\n');
    const data = await gql<Record<string, OrderDetail>>(`{ ${fields} }`);
    for (const order of Object.values(data)) {
      for (const line of order.lineItems) {
        if (line.lineItemType === 'ITEM' && line.itemId) {
          lines.push({ itemId: line.itemId, quantity: Number(line.quantity), date: order.salesOrderDate });
        }
      }
    }
  }
  return lines;
}

interface ItemNode {
  id: string;
  sku: string;
  name: string | null;
  defaultSupplier: string | null;
  stockAvailable: number;
  stockIncoming: number;
  minimumStock: number;
  minimumOrderQuantity: number;
  purchaseInterval: number;
  manualDeliveryTimeDays: number | null;
}

interface SupplierNode {
  isDefaultSupplier: boolean;
  deliveryTimeInDays: number | null;
  averageDeliveryTime: number;
}

export async function loadItems(gql: Gql, itemIds: string[]): Promise<ItemInfo[]> {
  const items: ItemInfo[] = [];
  for (const ids of chunk(itemIds, 100)) {
    const data = await gql<{ QueryItems: { nodes: ItemNode[] } }>(
      `query Items($ids: [ID]) {
        QueryItems(first: 100, where: { id: { in: $ids } }) {
          nodes { id sku name defaultSupplier stockAvailable stockIncoming minimumStock minimumOrderQuantity purchaseInterval manualDeliveryTimeDays }
        }
      }`,
      { ids },
    );
    for (const n of data.QueryItems.nodes) {
      items.push({
        id: n.id,
        sku: n.sku,
        name: n.name ?? n.sku,
        supplierName: n.defaultSupplier,
        stockAvailable: Number(n.stockAvailable),
        stockIncoming: Number(n.stockIncoming),
        minimumStock: Number(n.minimumStock),
        minimumOrderQuantity: Number(n.minimumOrderQuantity),
        purchaseInterval: Number(n.purchaseInterval),
        leadTimeDays: n.manualDeliveryTimeDays || null,
      });
    }
  }

  for (const batch of chunk(items, BATCH)) {
    const fields = batch
      .map((item, i) => `s${i}: QueryItemSuppliersById(itemId: ${JSON.stringify(item.id)}, first: 10) { nodes { isDefaultSupplier deliveryTimeInDays averageDeliveryTime } }`)
      .join('\n');
    const data = await gql<Record<string, { nodes: SupplierNode[] }>>(`{ ${fields} }`);
    batch.forEach((item, i) => {
      const supplier = data[`s${i}`]?.nodes.find(s => s.isDefaultSupplier);
      const days = supplier?.deliveryTimeInDays || Math.round(Number(supplier?.averageDeliveryTime ?? 0));
      if (days > 0) item.leadTimeDays = days;
    });
  }
  return items;
}
