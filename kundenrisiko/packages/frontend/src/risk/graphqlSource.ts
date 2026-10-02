import { GraphQLClient, gql } from 'graphql-request';
import type { AppBridge } from '@jtl-software/cloud-apps-core';
import { apiUrl } from '../common/constants';
import type { Address, Customer, Order } from './types';

// Live data from JTL-Wawi via the backend /graphql proxy (same transport as the template demos:
// getAppToken -> Bearer -> backend verifies + forwards to the ERP GraphQL API). There is no mock
// data: the app scores real orders only.
//
// NOT YET VALIDATED against a live Wawi schema. The transport and QuerySalesOrders/nodes base
// fields are template-proven; the pieces marked ASSUMPTION must be checked against your schema:
//   - `customerId` on a sales order node, and the `where` filter used to scope by customer,
//   - the billing/shipping address sub-fields.
// Returns (Retouren) are intentionally absent: the Cloud GraphQL API has no general returns query,
// so the risk is scored on the available factors only (see AVAILABLE_WITHOUT_RETURNS).

interface ErpAddress {
  street?: string | null;
  zipCode?: string | null;
  city?: string | null;
  countryIso?: string | null;
}
interface ErpOrderNode {
  salesOrderNumber: string;
  salesOrderDate: string;
  totalGrossAmount: number;
  customerId: string;
  companyName?: string | null;
  billingAddress?: ErpAddress | null;
  shippingAddress?: ErpAddress | null;
}

// ASSUMPTION: `customerId` and the address sub-fields are validated against your schema.
const ORDER_FIELDS = gql`
  fragment OrderFields on SalesOrder {
    salesOrderNumber
    salesOrderDate
    totalGrossAmount
    customerId
    companyName
    billingAddress { street zipCode city countryIso }
    shippingAddress { street zipCode city countryIso }
  }
`;

const CUSTOMER_ORDERS = gql`
  ${ORDER_FIELDS}
  query CustomerOrders($customerId: ID!) {
    QuerySalesOrders(
      first: 100
      order: [{ salesOrderDate: DESC }]
      where: { customerId: { eq: $customerId } } # ASSUMPTION: validate filter field name
    ) {
      nodes { ...OrderFields }
    }
  }
`;

const RECENT_ORDERS = gql`
  ${ORDER_FIELDS}
  query RecentOrders {
    QuerySalesOrders(first: 200, order: [{ salesOrderDate: DESC }]) {
      nodes { ...OrderFields }
    }
  }
`;

function toAddress(id: string, a: ErpAddress | null | undefined): Address {
  return {
    id,
    street: a?.street ?? '',
    zip: a?.zipCode ?? '',
    city: a?.city ?? '',
    country: a?.countryIso ?? '',
  };
}

function toOrder(node: ErpOrderNode): Order {
  const billing = toAddress(`${node.salesOrderNumber}-bill`, node.billingAddress);
  const shipping = toAddress(`${node.salesOrderNumber}-ship`, node.shippingAddress ?? node.billingAddress);
  // Line items aren't fetched; the order value is carried as one synthetic item so the
  // order-value factor stays correct (qty * unitPrice == totalGrossAmount).
  return {
    id: node.salesOrderNumber,
    date: node.salesOrderDate,
    items: [
      { sku: 'ORDER', name: 'Bestellung', category: 'n/a', quantity: 1, unitPrice: node.totalGrossAmount ?? 0 },
    ],
    shippingAddress: shipping,
    billingAddress: billing,
  };
}

function buildCustomer(customerId: string, nodes: ErpOrderNode[]): Customer {
  const orders = nodes.map(toOrder);
  const dates = nodes.map((n) => n.salesOrderDate).sort();
  return {
    id: customerId,
    name: nodes.find((n) => n.companyName)?.companyName ?? `Kunde ${customerId}`,
    email: '',
    since: dates[0] ?? orders[0]?.date ?? '',
    orders,
    returns: [], // no general returns query in the Cloud GraphQL API
  };
}

const client = (accessToken: string) =>
  new GraphQLClient(`${apiUrl}/graphql`, { headers: { Authorization: `Bearer ${accessToken}` } });

async function appToken(appBridge: AppBridge): Promise<string> {
  const { accessToken } = await appBridge.method.call<{ accessToken: string }>('getAppToken');
  return accessToken;
}

/** One customer's orders from the ERP, mapped to the risk model's Customer (returns omitted). */
export async function fetchErpCustomer(appBridge: AppBridge, customerId: string): Promise<Customer | null> {
  const data = await client(await appToken(appBridge)).request<{ QuerySalesOrders: { nodes: ErpOrderNode[] } }>(
    CUSTOMER_ORDERS,
    { customerId },
  );
  const nodes = data.QuerySalesOrders?.nodes ?? [];
  return nodes.length ? buildCustomer(customerId, nodes) : null;
}

/** Recent orders across the tenant, grouped per customer. One query, no N+1. */
export async function fetchErpCustomers(appBridge: AppBridge): Promise<Customer[]> {
  const data = await client(await appToken(appBridge)).request<{ QuerySalesOrders: { nodes: ErpOrderNode[] } }>(
    RECENT_ORDERS,
  );
  const byCustomer = new Map<string, ErpOrderNode[]>();
  for (const node of data.QuerySalesOrders?.nodes ?? []) {
    const list = byCustomer.get(node.customerId) ?? [];
    list.push(node);
    byCustomer.set(node.customerId, list);
  }
  return [...byCustomer.entries()].map(([id, nodes]) => buildCustomer(id, nodes));
}
