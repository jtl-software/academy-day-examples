import type { ErpData, Item, Sale } from './erp.js';
import type { WeatherClass, WeatherDay } from './weather.js';

type Spec = [name: string, group: string, base: number, effect: Partial<Record<WeatherClass, number>>, stock: number, minStock: number];

const SPECS: Spec[] = [
  ['Sonnenbrille Sport Polarized', 'Accessoires', 1.2, { sunny: 2.6, rain: 0.3, cold: 0.4 }, 4, 5],
  ['Fahrradhelm Urban', 'Radsport', 0.9, { sunny: 2.1, rain: 0.4, cold: 0.5 }, 6, 4],
  ['Sonnencreme LSF 50', 'Pflege', 1.6, { sunny: 3.0, rain: 0.2, cold: 0.2 }, 8, 10],
  ['Laufshorts Herren', 'Laufen', 1.1, { sunny: 2.0, rain: 0.6, cold: 0.3 }, 5, 4],
  ['Trinkflasche 750 ml', 'Accessoires', 1.4, { sunny: 1.9, rain: 0.7, cold: 0.6 }, 30, 8],
  ['Tennisbälle 4er Dose', 'Tennis', 1.0, { sunny: 2.3, rain: 0.3 }, 3, 6],
  ['Inline-Skates Fitness', 'Rollsport', 0.3, { sunny: 2.8, rain: 0.1, cold: 0.2 }, 2, 2],
  ['Regenjacke Trail', 'Outdoor', 0.8, { rain: 2.5, sunny: 0.3 }, 12, 4],
  ['Regenhose Packable', 'Outdoor', 0.5, { rain: 2.4, sunny: 0.2 }, 3, 3],
  ['Wanderschuhe GTX', 'Outdoor', 0.6, { rain: 1.6, mixed: 1.2 }, 9, 3],
  ['Thermo-Laufshirt', 'Laufen', 0.7, { cold: 2.6, sunny: 0.3 }, 14, 4],
  ['Laufhandschuhe', 'Laufen', 0.5, { cold: 3.0, sunny: 0.1 }, 2, 4],
  ['Yogamatte Pro', 'Fitness', 0.8, {}, 11, 4],
  ['Kurzhantel-Set 10 kg', 'Fitness', 0.4, { rain: 1.2 }, 6, 2],
  ['Fußball Match', 'Teamsport', 0.9, { sunny: 1.3, rain: 0.8 }, 15, 5],
];

// Deterministic pseudo-random numbers so the demo looks the same on every load.
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

function poisson(mean: number, rand: () => number): number {
  const l = Math.exp(-mean);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= rand();
  } while (p > l);
  return k - 1;
}

export function demoData(history: WeatherDay[]): ErpData {
  const rand = rng(42);
  const items: Item[] = SPECS.map(([name, group, , , stock, minStock], i) => ({
    id: `demo-${i + 1}`,
    sku: `SP-${String(1001 + i)}`,
    name,
    group,
    stockAvailable: stock,
    stockIncoming: i % 5 === 0 ? 2 : 0,
    minimumStock: minStock,
  }));

  const sales: Sale[] = [];
  let order = 24000;
  for (const day of history) {
    const weekend = [0, 6].includes(new Date(day.date).getDay()) ? 1.4 : 1;
    SPECS.forEach(([, , base, effect], i) => {
      const qty = poisson(base * (effect[day.weatherClass] ?? 1) * weekend, rand);
      for (let n = 0; n < qty; ) {
        const q = Math.min(qty - n, 1 + Math.floor(rand() * 2));
        sales.push({ itemId: items[i].id, quantity: q, date: day.date, orderNumber: `AU-${order++}` });
        n += q;
      }
    });
  }
  return { items, sales };
}
