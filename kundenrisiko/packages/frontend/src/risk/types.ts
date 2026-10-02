export interface Address {
  id: string;
  street: string;
  zip: string;
  city: string;
  country: string;
}

export interface OrderItem {
  sku: string;
  name: string;
  category: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  date: string; // ISO date
  items: OrderItem[];
  shippingAddress: Address;
  billingAddress: Address;
}

export interface ReturnRecord {
  id: string;
  orderId: string;
  date: string; // ISO date
  sku: string;
  quantity: number;
  reason: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  since: string; // ISO date of first order
  orders: Order[];
  returns: ReturnRecord[];
}

export type RiskBand = 'niedrig' | 'mittel' | 'hoch';

export interface RiskFactor {
  key: 'returnRate' | 'orderReturnShare' | 'addressDiversity' | 'newness' | 'orderValue';
  label: string;
  /** Normalized factor value in [0, 1], where higher means more risk. */
  value: number;
  /** Weight the factor contributes to the total score. */
  weight: number;
  /** value * weight * 100, the points this factor adds to the score. */
  contribution: number;
  /** Short human-readable reason for the detail view. */
  detail: string;
}

export interface RiskAssessment {
  customerId: string;
  /** 0-100 risk score. */
  score: number;
  band: RiskBand;
  /** Estimated probability that the next order gets a return, 0-1. */
  returnProbability: number;
  /** "niedrig" when the customer has few orders and the score is less reliable. */
  confidence: 'niedrig' | 'mittel' | 'hoch';
  factors: RiskFactor[];
  stats: {
    orderCount: number;
    returnedItems: number;
    orderedItems: number;
    itemReturnRate: number;
    ordersWithReturn: number;
    distinctShippingAddresses: number;
    billingMismatchShare: number;
    avgOrderValue: number;
  };
}
