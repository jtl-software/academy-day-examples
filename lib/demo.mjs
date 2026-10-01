const suppliers = ['Nordlicht Trading', 'Vogel & Partner', 'Bergmann Supply', 'Urban Essentials', 'Küstenwerk'];
const customers = ['Studio Form', 'Meyer Retail', 'Maison Berger', 'Lena Hoffmann', 'Kaufhaus West', 'Atelier Nord', 'Süd & Sohn'];
const cities = [['Berlin', 'DE'], ['Hamburg', 'DE'], ['München', 'DE'], ['Köln', 'DE'], ['Wien', 'AT'], ['Zürich', 'CH']];
const street = ['Lindenstraße 24', 'Hafenweg 8', 'Am Markt 11', 'Parkallee 67', 'Gartenstraße 4', 'Seestraße 19'];
export function demoRows() {
  const rows = [];
  for (let month = 0; month < 9; month++) {
    for (let i = 0; i < 21; i++) {
      const n = month * 21 + i;
      const revenue = Math.round((390 + ((n * 137) % 1700) + month * 20) * (i % 11 === 0 ? 2.2 : 1));
      const cost = Math.round(revenue * (0.49 + ((n * 13) % 22) / 100));
      const city = cities[(i + month * 2) % cities.length];
      rows.push({ date: `2026-${String(month + 1).padStart(2, '0')}-${String(1 + (i * 7) % 27).padStart(2, '0')}`, supplier: suppliers[(i * 3 + month) % suppliers.length], customer: customers[(i + month * 2) % customers.length], address: `${street[i % street.length]}, ${city[0]} (${city[1]})`, invoice: `RE-2026-${String(n + 1).padStart(4, '0')}`, revenue, cost });
    }
  }
  return rows;
}
