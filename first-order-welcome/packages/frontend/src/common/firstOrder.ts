import { AppBridge } from '@jtl-software/cloud-apps-core';
import { GraphQLClient, gql } from 'graphql-request';
import { jtlApiUrl } from './constants';

const ORDER_QUERY = gql`
  query FirstOrderPaneOrder($salesOrderId: ID!) {
    order: GetSalesOrderById(salesOrderId: $salesOrderId) {
      id
      salesOrderNumber
      salesOrderDate
      customerId
      billingAddress {
        salutation
        firstName
        lastName
        company
        emailAddress
      }
      lineItems {
        id
        name
        quantity
        totalSalesPriceGross
        lineItemType
      }
      paymentDetails {
        currencyIso
      }
      keyFigures {
        totalGrossAmount
      }
    }
    listItem: QuerySalesOrders(first: 1, where: { id: { eq: $salesOrderId } }) {
      nodes {
        companyName
        customerNumber
      }
    }
  }
`;

const CUSTOMER_ORDERS_QUERY = gql`
  query FirstOrderPaneCustomerOrders($customerId: ID!) {
    orders: QuerySalesOrders(
      first: 1
      where: { customerId: { eq: $customerId }, isCancelled: { eq: false } }
      order: [{ salesOrderDate: ASC }]
    ) {
      totalCount
      nodes {
        id
        salesOrderNumber
        salesOrderDate
      }
    }
  }
`;

interface OrderResponse {
  order: {
    id: string;
    salesOrderNumber: string;
    salesOrderDate: string | null;
    customerId: string | null;
    billingAddress: {
      salutation: string | null;
      firstName: string | null;
      lastName: string | null;
      company: string | null;
      emailAddress: string | null;
    } | null;
    lineItems: { id: string; name: string | null; quantity: number; totalSalesPriceGross: number; lineItemType: string }[];
    paymentDetails: { currencyIso: string | null };
    keyFigures: { totalGrossAmount: number } | null;
  };
  listItem: { nodes: { companyName: string | null; customerNumber: string | null }[] } | null;
}

interface CustomerOrdersResponse {
  orders: { totalCount: number; nodes: { id: string; salesOrderNumber: string; salesOrderDate: string }[] } | null;
}

export interface OrderLine {
  name: string;
  quantity: number;
  totalGross: number;
}

export interface FirstOrderInfo {
  orderId: string;
  orderNumber: string;
  orderDate: string | null;
  customerNumber: string | null;
  shopName: string | null;
  salutation: string | null;
  firstName: string | null;
  lastName: string | null;
  company: string | null;
  email: string | null;
  items: OrderLine[];
  totalGross: number;
  currencyIso: string;
  /** null for guest orders without a customer account. */
  orderCount: number | null;
  isFirstOrder: boolean;
  firstOrderNumber: string | null;
  firstOrderDate: string | null;
}

export async function loadFirstOrderInfo(appBridge: AppBridge, salesOrderId: string): Promise<FirstOrderInfo> {
  // The app token is bound to the tenant, so no X-Tenant-ID header is needed.
  const { accessToken } = await appBridge.method.call<{ accessToken: string }>('getAppToken');
  const client = new GraphQLClient(`${jtlApiUrl}/erp/v2/graphql`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const { order, listItem } = await client.request<OrderResponse>(ORDER_QUERY, { salesOrderId });
  const listInfo = listItem?.nodes[0];

  let orderCount: number | null = null;
  let oldest: { id: string; salesOrderNumber: string; salesOrderDate: string } | undefined;
  if (order.customerId) {
    const { orders } = await client.request<CustomerOrdersResponse>(CUSTOMER_ORDERS_QUERY, { customerId: order.customerId });
    orderCount = orders?.totalCount ?? 0;
    oldest = orders?.nodes[0];
  }

  return {
    orderId: order.id,
    orderNumber: order.salesOrderNumber,
    orderDate: order.salesOrderDate,
    customerNumber: listInfo?.customerNumber ?? null,
    shopName: listInfo?.companyName ?? null,
    salutation: order.billingAddress?.salutation ?? null,
    firstName: order.billingAddress?.firstName ?? null,
    lastName: order.billingAddress?.lastName ?? null,
    company: order.billingAddress?.company ?? null,
    email: order.billingAddress?.emailAddress ?? null,
    items: order.lineItems
      .filter(line => line.lineItemType === 'ITEM')
      .map(line => ({ name: line.name ?? 'Artikel', quantity: Number(line.quantity), totalGross: Number(line.totalSalesPriceGross) })),
    totalGross: Number(order.keyFigures?.totalGrossAmount ?? 0),
    currencyIso: order.paymentDetails.currencyIso ?? 'EUR',
    orderCount,
    // A cancelled order is not in the list, so it counts as first only when no other order exists.
    isFirstOrder: orderCount !== null && (oldest ? oldest.id === order.id : true),
    firstOrderNumber: oldest?.salesOrderNumber ?? null,
    firstOrderDate: oldest?.salesOrderDate ?? null,
  };
}
