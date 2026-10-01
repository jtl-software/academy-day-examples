import type { Customer, RiskAssessment, RiskBand, RiskFactor } from './types';

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/**
 * Weights per factor. They sum to 1, so the weighted sum is a 0-1 score.
 * The return history dominates; address and newness are secondary signals.
 */
const WEIGHTS = {
  returnRate: 0.42,
  orderReturnShare: 0.18,
  addressDiversity: 0.22,
  newness: 0.1,
  orderValue: 0.08,
} as const;

/** Recent returns weigh more than old ones. */
function recencyWeight(returnDate: string, now: Date): number {
  const days = (now.getTime() - new Date(returnDate).getTime()) / MS_PER_DAY;
  if (days <= 90) return 1.5;
  if (days <= 365) return 1;
  return 0.6;
}

function addressKey(a: { street: string; zip: string; city: string }): string {
  return `${a.street}|${a.zip}|${a.city}`.toLowerCase();
}

function bandFor(score: number): RiskBand {
  if (score >= 60) return 'hoch';
  if (score >= 30) return 'mittel';
  return 'niedrig';
}

/**
 * Heuristic, explainable return-risk score for a customer. Not a trained model:
 * every factor and weight is visible so the result can be justified to a user.
 */
/** Factors to score. Returns-based factors are omitted when that data is unavailable. */
export const AVAILABLE_WITHOUT_RETURNS: RiskFactor['key'][] = [
  'addressDiversity',
  'newness',
  'orderValue',
];

export function assessCustomer(
  customer: Customer,
  now: Date = new Date(),
  opts: { only?: RiskFactor['key'][] } = {},
): RiskAssessment {
  const { orders, returns } = customer;
  const orderCount = orders.length;

  const orderedItems = orders.reduce(
    (sum, o) => sum + o.items.reduce((s, it) => s + it.quantity, 0),
    0,
  );
  const returnedItems = returns.reduce((sum, r) => sum + r.quantity, 0);
  const itemReturnRate = orderedItems > 0 ? returnedItems / orderedItems : 0;

  const weightedReturnedItems = returns.reduce(
    (sum, r) => sum + r.quantity * recencyWeight(r.date, now),
    0,
  );
  const recencyWeightedRate = orderedItems > 0 ? weightedReturnedItems / orderedItems : 0;

  const orderIdsWithReturn = new Set(returns.map((r) => r.orderId));
  const ordersWithReturn = orderIdsWithReturn.size;
  const orderReturnShare = orderCount > 0 ? ordersWithReturn / orderCount : 0;

  const distinctShippingAddresses = new Set(orders.map((o) => addressKey(o.shippingAddress))).size;
  const addressSpread = clamp01(
    (distinctShippingAddresses - 1) / Math.max(1, orderCount - 1),
  );
  const billingMismatches = orders.filter(
    (o) => addressKey(o.shippingAddress) !== addressKey(o.billingAddress),
  ).length;
  const billingMismatchShare = orderCount > 0 ? billingMismatches / orderCount : 0;

  const orderValues = orders.map((o) =>
    o.items.reduce((s, it) => s + it.quantity * it.unitPrice, 0),
  );
  const avgOrderValue =
    orderValues.length > 0 ? orderValues.reduce((a, b) => a + b, 0) / orderValues.length : 0;

  // Factor values, each normalized to [0, 1] with higher = more risk.
  const returnRateValue = clamp01(recencyWeightedRate / 0.4); // 40%+ return rate saturates
  const orderReturnShareValue = clamp01(orderReturnShare);
  const addressDiversityValue = clamp01(0.6 * addressSpread + 0.4 * billingMismatchShare);
  const newnessValue = orderCount >= 6 ? 0 : (6 - orderCount) / 6;
  const orderValueValue = clamp01(avgOrderValue / 400);

  const factorInputs: Array<Omit<RiskFactor, 'contribution'>> = [
    {
      key: 'returnRate',
      label: 'Retourenquote',
      value: returnRateValue,
      weight: WEIGHTS.returnRate,
      detail: `${Math.round(itemReturnRate * 100)}% der Artikel retourniert (jüngere Retouren stärker gewichtet)`,
    },
    {
      key: 'orderReturnShare',
      label: 'Betroffene Bestellungen',
      value: orderReturnShareValue,
      weight: WEIGHTS.orderReturnShare,
      detail: `${ordersWithReturn} von ${orderCount} Bestellungen mit Retoure`,
    },
    {
      key: 'addressDiversity',
      label: 'Lieferadressen',
      value: addressDiversityValue,
      weight: WEIGHTS.addressDiversity,
      detail: `${distinctShippingAddresses} verschiedene Lieferadressen, ${Math.round(billingMismatchShare * 100)}% abweichend von Rechnungsadresse`,
    },
    {
      key: 'newness',
      label: 'Bestellhistorie',
      value: newnessValue,
      weight: WEIGHTS.newness,
      detail:
        orderCount >= 6
          ? `${orderCount} Bestellungen, belastbare Datenbasis`
          : `nur ${orderCount} Bestellungen, geringe Datenbasis`,
    },
    {
      key: 'orderValue',
      label: 'Bestellwert',
      value: orderValueValue,
      weight: WEIGHTS.orderValue,
      detail: `Ø ${avgOrderValue.toFixed(0)} € pro Bestellung`,
    },
  ];

  // When only a subset of factors has data (e.g. no returns from the Cloud API),
  // keep those factors and renormalize their weights to sum to 1.
  const selected = opts.only ? factorInputs.filter((f) => opts.only!.includes(f.key)) : factorInputs;
  const weightSum = selected.reduce((sum, f) => sum + f.weight, 0) || 1;
  const factors: RiskFactor[] = selected.map((f) => {
    const weight = f.weight / weightSum;
    return { ...f, weight, contribution: f.value * weight * 100 };
  });

  const score = Math.round(factors.reduce((sum, f) => sum + f.contribution, 0));
  const returnProbability = clamp01(1 / (1 + Math.exp(-0.06 * (score - 45))));
  const confidence = orderCount >= 6 ? 'hoch' : orderCount >= 3 ? 'mittel' : 'niedrig';

  return {
    customerId: customer.id,
    score,
    band: bandFor(score),
    returnProbability,
    confidence,
    factors,
    stats: {
      orderCount,
      returnedItems,
      orderedItems,
      itemReturnRate,
      ordersWithReturn,
      distinctShippingAddresses,
      billingMismatchShare,
      avgOrderValue,
    },
  };
}

export const BAND_LABEL: Record<RiskBand, string> = {
  niedrig: 'Niedriges Risiko',
  mittel: 'Mittleres Risiko',
  hoch: 'Hohes Risiko',
};

/** Suggested handling per band, shown as the recommended action. */
export function recommendedAction(band: RiskBand): string {
  switch (band) {
    case 'hoch':
      return 'Vorkasse oder manuelle Prüfung vor Versand empfehlen.';
    case 'mittel':
      return 'Kauf auf Rechnung einschränken, Zahlarten prüfen.';
    case 'niedrig':
      return 'Alle Zahlarten freigeben, keine Einschränkung nötig.';
  }
}
