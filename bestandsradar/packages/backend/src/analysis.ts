export interface SaleLine {
  itemId: string;
  quantity: number;
  date: string;
}

export interface ItemInfo {
  id: string;
  sku: string;
  name: string;
  supplierName: string | null;
  stockAvailable: number;
  stockIncoming: number;
  minimumStock: number;
  minimumOrderQuantity: number;
  purchaseInterval: number;
  leadTimeDays: number | null;
}

export interface AnalysisOptions {
  now: Date;
  windowDays: number;
  defaultLeadTimeDays: number;
  /** z-score of the service level; 1.65 means stock lasts through lead time in about 95% of cases */
  serviceLevelZ: number;
  orderCycleDays: number;
  soonDays: number;
}

export type Status = 'critical' | 'reorder' | 'soon' | 'ok';

export interface ItemAnalysis {
  itemId: string;
  sku: string;
  name: string;
  supplierName: string | null;
  unitsSold: number;
  orderCount: number;
  dailyDemand: number;
  /** change of the daily rate, second half of the window vs. first half; null if the first half had no sales */
  trendPct: number | null;
  weeklySales: number[];
  stockAvailable: number;
  stockIncoming: number;
  leadTimeDays: number;
  leadTimeIsDefault: boolean;
  safetyStock: number;
  reorderPoint: number;
  daysOfCover: number | null;
  stockoutDate: string | null;
  reorderDate: string | null;
  suggestedQuantity: number;
  status: Status;
}

export interface Dashboard {
  generatedAt: string;
  windowDays: number;
  from: string;
  to: string;
  isDemo: boolean;
  totals: { itemsWithSales: number; unitsSold: number; critical: number; reorder: number; soon: number };
  items: ItemAnalysis[];
}

export const DEFAULT_OPTIONS: Omit<AnalysisOptions, 'now'> = {
  windowDays: 90,
  defaultLeadTimeDays: 14,
  serviceLevelZ: 1.65,
  orderCycleDays: 30,
  soonDays: 14,
};

const DAY_MS = 86_400_000;
const STATUS_ORDER: Record<Status, number> = { critical: 0, reorder: 1, soon: 2, ok: 3 };

const addDays = (date: Date, days: number): string => new Date(date.getTime() + days * DAY_MS).toISOString();
const round1 = (value: number): number => Math.round(value * 10) / 10;

export function windowStart(now: Date, windowDays: number): Date {
  return new Date(now.getTime() - windowDays * DAY_MS);
}

function analyzeItem(item: ItemInfo, daily: number[], orderCount: number, opts: AnalysisOptions): ItemAnalysis {
  const n = daily.length;
  const unitsSold = daily.reduce((sum, q) => sum + q, 0);
  const windowRate = unitsSold / n;
  const recentDays = Math.min(30, n);
  const recentRate = daily.slice(n - recentDays).reduce((sum, q) => sum + q, 0) / recentDays;
  const dailyDemand = (windowRate + recentRate) / 2;

  const half = Math.floor(n / 2);
  const firstRate = daily.slice(0, half).reduce((sum, q) => sum + q, 0) / Math.max(half, 1);
  const secondRate = daily.slice(half).reduce((sum, q) => sum + q, 0) / Math.max(n - half, 1);
  const trendPct = firstRate > 0 ? Math.round(((secondRate - firstRate) / firstRate) * 100) : null;

  const variance = daily.reduce((sum, q) => sum + (q - windowRate) ** 2, 0) / n;
  const leadTimeDays = item.leadTimeDays && item.leadTimeDays > 0 ? item.leadTimeDays : opts.defaultLeadTimeDays;
  const safetyStock = Math.max(Math.ceil(opts.serviceLevelZ * Math.sqrt(variance) * Math.sqrt(leadTimeDays)), item.minimumStock);
  const reorderPoint = Math.ceil(dailyDemand * leadTimeDays) + safetyStock;

  const position = item.stockAvailable + item.stockIncoming;
  const daysOfCover = dailyDemand > 0 ? Math.max(item.stockAvailable, 0) / dailyDemand : null;
  const daysUntilReorder = dailyDemand > 0 ? Math.max((position - reorderPoint) / dailyDemand, 0) : null;

  const cycleDays = item.purchaseInterval > 0 ? item.purchaseInterval : opts.orderCycleDays;
  const target = Math.max(Math.ceil(dailyDemand * (leadTimeDays + cycleDays)) + safetyStock, reorderPoint + 1);
  let suggestedQuantity = Math.max(target - position, 0);
  if (suggestedQuantity > 0) suggestedQuantity = Math.max(Math.ceil(suggestedQuantity), item.minimumOrderQuantity);

  let status: Status = 'ok';
  if (position <= reorderPoint && dailyDemand > 0) {
    status = daysOfCover !== null && daysOfCover < leadTimeDays ? 'critical' : 'reorder';
  } else if (daysUntilReorder !== null && daysUntilReorder <= opts.soonDays) {
    status = 'soon';
  }

  const weeks = Math.ceil(n / 7);
  const weeklySales = Array.from({ length: weeks }, (_, w) => {
    const end = n - (weeks - 1 - w) * 7;
    return daily.slice(Math.max(end - 7, 0), end).reduce((sum, q) => sum + q, 0);
  });

  return {
    itemId: item.id,
    sku: item.sku,
    name: item.name,
    supplierName: item.supplierName,
    unitsSold,
    orderCount,
    dailyDemand: Math.round(dailyDemand * 100) / 100,
    trendPct,
    weeklySales,
    stockAvailable: item.stockAvailable,
    stockIncoming: item.stockIncoming,
    leadTimeDays,
    leadTimeIsDefault: !(item.leadTimeDays && item.leadTimeDays > 0),
    safetyStock,
    reorderPoint,
    daysOfCover: daysOfCover === null ? null : round1(daysOfCover),
    stockoutDate: daysOfCover === null ? null : addDays(opts.now, daysOfCover),
    reorderDate: daysUntilReorder === null ? null : addDays(opts.now, daysUntilReorder),
    suggestedQuantity: status === 'ok' ? 0 : suggestedQuantity,
    status,
  };
}

export function analyze(sales: SaleLine[], items: ItemInfo[], opts: AnalysisOptions, isDemo = false): Dashboard {
  const from = windowStart(opts.now, opts.windowDays);
  const daily = new Map<string, number[]>();
  const orders = new Map<string, number>();

  for (const line of sales) {
    const day = Math.floor((new Date(line.date).getTime() - from.getTime()) / DAY_MS);
    if (day < 0 || day >= opts.windowDays || line.quantity <= 0) continue;
    const series = daily.get(line.itemId) ?? new Array<number>(opts.windowDays).fill(0);
    series[day] += line.quantity;
    daily.set(line.itemId, series);
    orders.set(line.itemId, (orders.get(line.itemId) ?? 0) + 1);
  }

  const result = items
    .filter(item => daily.has(item.id))
    .map(item => analyzeItem(item, daily.get(item.id)!, orders.get(item.id) ?? 0, opts))
    .sort(
      (a, b) =>
        STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
        (a.reorderDate ?? '').localeCompare(b.reorderDate ?? '') ||
        b.unitsSold - a.unitsSold,
    );

  const count = (status: Status) => result.filter(r => r.status === status).length;
  return {
    generatedAt: opts.now.toISOString(),
    windowDays: opts.windowDays,
    from: from.toISOString(),
    to: opts.now.toISOString(),
    isDemo,
    totals: {
      itemsWithSales: result.length,
      unitsSold: result.reduce((sum, r) => sum + r.unitsSold, 0),
      critical: count('critical'),
      reorder: count('reorder'),
      soon: count('soon'),
    },
    items: result,
  };
}
