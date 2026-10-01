/** Mirrors the backend's `Dashboard` response (packages/backend/src/analysis.ts). */
export type Status = 'critical' | 'reorder' | 'soon' | 'ok';

export interface ItemAnalysis {
  itemId: string;
  sku: string;
  name: string;
  supplierName: string | null;
  unitsSold: number;
  orderCount: number;
  dailyDemand: number;
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

export interface DashboardParams {
  days: number;
  leadTime: number;
}

export type DashboardLoader = (params: DashboardParams) => Promise<Dashboard>;
