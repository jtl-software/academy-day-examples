import type { ErpData, Item } from './erp.js';
import type { WeatherClass, WeatherDay } from './weather.js';

const CLASSES: WeatherClass[] = ['sunny', 'mixed', 'rain', 'cold'];
const MIN_DAYS = 3; // fewer days of a weather class are too few to trust its average
const LIFT = 1.3;

export type Profile = WeatherClass | 'neutral';

interface DemandModel {
  overall: number; // units per day
  byClass: Record<WeatherClass, { avg: number; days: number }>;
  profile: Profile;
  lift: number; // demand on the profile's weather relative to the overall average
}

function unitsPerDay(data: ErpData, itemId: string): Map<string, number> {
  const map = new Map<string, number>();
  for (const s of data.sales) if (s.itemId === itemId) map.set(s.date, (map.get(s.date) ?? 0) + s.quantity);
  return map;
}

function model(perDay: Map<string, number>, history: WeatherDay[]): DemandModel {
  const sums = Object.fromEntries(CLASSES.map(c => [c, { units: 0, days: 0 }])) as Record<WeatherClass, { units: number; days: number }>;
  let total = 0;
  for (const day of history) {
    const units = perDay.get(day.date) ?? 0;
    sums[day.weatherClass].units += units;
    sums[day.weatherClass].days += 1;
    total += units;
  }
  const overall = history.length ? total / history.length : 0;
  const byClass = Object.fromEntries(
    CLASSES.map(c => [c, { avg: sums[c].days ? sums[c].units / sums[c].days : 0, days: sums[c].days }]),
  ) as DemandModel['byClass'];

  let profile: Profile = 'neutral';
  let lift = 1;
  for (const c of ['sunny', 'rain', 'cold'] as const) {
    const l = overall > 0 && byClass[c].days >= MIN_DAYS ? byClass[c].avg / overall : 0;
    if (l >= LIFT && l > lift) {
      profile = c;
      lift = l;
    }
  }
  return { overall, byClass, profile, lift };
}

function expectedOn(m: DemandModel, c: WeatherClass): number {
  return m.byClass[c].days >= MIN_DAYS ? m.byClass[c].avg : m.overall;
}

export function itemInsights(data: ErpData, history: WeatherDay[], itemId: string) {
  const item = data.items.find(i => i.id === itemId) ?? null;
  const weatherByDate = new Map(history.map(d => [d.date, d]));
  const m = model(unitsPerDay(data, itemId), history);
  const byDay = new Map<string, { date: string; quantity: number; orders: number }>();
  for (const s of data.sales) {
    if (s.itemId !== itemId) continue;
    const day = byDay.get(s.date) ?? { date: s.date, quantity: 0, orders: 0 };
    day.quantity += s.quantity;
    day.orders += 1;
    byDay.set(s.date, day);
  }
  const sales = [...byDay.values()]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 20)
    .map(d => ({ ...d, weather: weatherByDate.get(d.date) ?? null }));
  const totalSold = data.sales.filter(s => s.itemId === itemId).reduce((n, s) => n + s.quantity, 0);
  return {
    item,
    totalSold,
    days: history.length,
    profile: m.profile,
    lift: m.lift,
    byClass: CLASSES.map(c => ({ weatherClass: c, avg: m.byClass[c].avg, days: m.byClass[c].days })),
    sales,
  };
}

export function dashboardInsights(data: ErpData, history: WeatherDay[], forecast: WeatherDay[]) {
  const soldIds = new Set(data.sales.map(s => s.itemId));
  const dailyDemand = forecast.map(d => ({ date: d.date, weatherClass: d.weatherClass, units: 0 }));

  const rows = data.items
    .filter((i: Item) => soldIds.has(i.id))
    .map(item => {
      const m = model(unitsPerDay(data, item.id), history);
      const perDay = forecast.map(d => expectedOn(m, d.weatherClass));
      perDay.forEach((u, idx) => (dailyDemand[idx].units += u));
      const expected7 = perDay.reduce((a, b) => a + b, 0);
      const baseline7 = m.overall * forecast.length;
      const available = item.stockAvailable + item.stockIncoming;
      const reorder = Math.max(0, Math.ceil(expected7 * 1.2 + item.minimumStock - available));
      return {
        id: item.id,
        sku: item.sku,
        name: item.name,
        group: item.group,
        stockAvailable: item.stockAvailable,
        stockIncoming: item.stockIncoming,
        minimumStock: item.minimumStock,
        profile: m.profile,
        lift: m.lift,
        expected7,
        baseline7,
        weatherDriven: m.profile !== 'neutral' && expected7 > baseline7 * 1.1,
        daysOfCover: expected7 > 0 ? item.stockAvailable / (expected7 / forecast.length) : null,
        reorder,
      };
    });

  const reorder = rows
    .filter(r => r.reorder > 0)
    .sort((a, b) => Number(b.weatherDriven) - Number(a.weatherDriven) || (a.daysOfCover ?? 99) - (b.daysOfCover ?? 99));

  return {
    forecast,
    dailyDemand,
    reorder,
    stats: {
      itemsAnalysed: rows.length,
      weatherItems: rows.filter(r => r.profile !== 'neutral').length,
      reorderCount: reorder.length,
      weatherDrivenCount: reorder.filter(r => r.weatherDriven).length,
      sunnyDays: forecast.filter(d => d.weatherClass === 'sunny').length,
      rainDays: forecast.filter(d => d.weatherClass === 'rain').length,
    },
  };
}
