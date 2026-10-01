import type { ItemInfo, SaleLine } from './analysis.js';

interface DemoItem {
  sku: string;
  name: string;
  supplier: string;
  perDay: number;
  /** demand at the end of the window relative to the start */
  growth: number;
  stock: number;
  incoming: number;
  leadTime: number | null;
}

const DEMO_ITEMS: DemoItem[] = [
  { sku: 'LS-2041', name: 'Laufschuh Trail Pro, Gr. 43', supplier: 'Müller Sports', perDay: 3.2, growth: 1.8, stock: 18, incoming: 0, leadTime: 21 },
  { sku: 'TS-1100', name: 'Funktionsshirt Herren, Blau M', supplier: 'Müller Sports', perDay: 4.5, growth: 1.1, stock: 96, incoming: 0, leadTime: 10 },
  { sku: 'TR-0305', name: 'Trinkflasche Edelstahl 750 ml', supplier: 'Sportequipment Jansen', perDay: 6.1, growth: 1.4, stock: 40, incoming: 60, leadTime: 7 },
  { sku: 'YM-0090', name: 'Yogamatte rutschfest, Grau', supplier: 'Fitline GmbH', perDay: 2.4, growth: 0.7, stock: 140, incoming: 0, leadTime: 14 },
  { sku: 'RS-7710', name: 'Radsporthose gepolstert, L', supplier: 'Velo Textil', perDay: 1.6, growth: 2.2, stock: 9, incoming: 0, leadTime: null },
  { sku: 'BL-0450', name: 'Ballpumpe mit Manometer', supplier: 'Sportequipment Jansen', perDay: 0.8, growth: 1, stock: 35, incoming: 0, leadTime: 5 },
  { sku: 'SO-3300', name: 'Sportsocken 3er-Pack, 39-42', supplier: 'Müller Sports', perDay: 7.3, growth: 1.2, stock: 210, incoming: 0, leadTime: 10 },
  { sku: 'HT-1205', name: 'Hantelset 2 x 5 kg', supplier: 'Fitline GmbH', perDay: 1.1, growth: 0.6, stock: 4, incoming: 20, leadTime: 28 },
  { sku: 'SB-0811', name: 'Springseil Speed', supplier: 'Fitline GmbH', perDay: 2.0, growth: 1.3, stock: 40, incoming: 0, leadTime: 14 },
  { sku: 'RU-5520', name: 'Laufrucksack 12 l', supplier: 'Outdoor Partner', perDay: 0.9, growth: 1.6, stock: 22, incoming: 0, leadTime: 30 },
  { sku: 'SH-0042', name: 'Schweißband 2er-Set', supplier: 'Müller Sports', perDay: 1.4, growth: 0.9, stock: 75, incoming: 0, leadTime: 10 },
  { sku: 'TT-9001', name: 'Tischtennisschläger Allround', supplier: 'Sportequipment Jansen', perDay: 0.5, growth: 1, stock: 7, incoming: 0, leadTime: 7 },
];

/** Small deterministic PRNG so the demo looks the same on every load. */
function mulberry32(seed: number): () => number {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Poisson draw via Knuth; fine for the small daily rates used here. */
function poisson(rate: number, rand: () => number): number {
  const limit = Math.exp(-rate);
  let k = 0;
  let p = rand();
  while (p > limit) {
    k++;
    p *= rand();
  }
  return k;
}

export function demoData(now: Date, days: number): { sales: SaleLine[]; items: ItemInfo[] } {
  const rand = mulberry32(42);
  const sales: SaleLine[] = [];
  const items: ItemInfo[] = DEMO_ITEMS.map((d, index) => ({
    id: `demo-${index}`,
    sku: d.sku,
    name: d.name,
    supplierName: d.supplier,
    stockAvailable: d.stock,
    stockIncoming: d.incoming,
    minimumStock: 0,
    minimumOrderQuantity: 0,
    purchaseInterval: 0,
    leadTimeDays: d.leadTime,
  }));

  DEMO_ITEMS.forEach((d, index) => {
    for (let day = 0; day < days; day++) {
      const progress = day / Math.max(days - 1, 1);
      const weekend = new Date(now.getTime() - (days - day) * 86_400_000).getDay() % 6 === 0 ? 1.3 : 1;
      const rate = d.perDay * (1 + (d.growth - 1) * progress) * weekend;
      const quantity = poisson(rate, rand);
      if (quantity > 0) {
        const date = new Date(now.getTime() - (days - day - 0.5) * 86_400_000).toISOString();
        sales.push({ itemId: `demo-${index}`, quantity, date });
      }
    }
  });
  return { sales, items };
}
