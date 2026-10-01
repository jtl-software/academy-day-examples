export const money = value => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
export const percent = value => new Intl.NumberFormat('de-DE', { style: 'percent', maximumFractionDigits: 1 }).format(value);

export function summarize(rows, groupBy, from, to, query = '') {
  const text = query.trim().toLocaleLowerCase('de-DE');
  const selected = rows.filter(row => row.date >= from && row.date <= to && (!text || [row.supplier, row.customer, row.address, row.invoice].some(value => value.toLocaleLowerCase('de-DE').includes(text))));
  const total = selected.reduce((acc, row) => ({ revenue: acc.revenue + row.revenue, cost: acc.cost + row.cost, profit: acc.profit + row.revenue - row.cost }), { revenue: 0, cost: 0, profit: 0 });
  const groups = new Map();
  for (const row of selected) {
    const label = row[groupBy] || 'Nicht zugeordnet';
    const value = groups.get(label) || { label, revenue: 0, cost: 0, profit: 0, count: 0 };
    value.revenue += row.revenue;
    value.cost += row.cost;
    value.profit += row.revenue - row.cost;
    value.count++;
    groups.set(label, value);
  }
  const breakdown = [...groups.values()].map(group => ({ ...group, margin: group.revenue ? group.profit / group.revenue : 0, share: total.revenue ? group.revenue / total.revenue : 0 })).sort((a, b) => b.revenue - a.revenue);
  const months = new Map();
  for (const row of selected) {
    const key = row.date.slice(0, 7);
    const value = months.get(key) || { month: key, revenue: 0, profit: 0 };
    value.revenue += row.revenue;
    value.profit += row.revenue - row.cost;
    months.set(key, value);
  }
  return { total: { ...total, margin: total.revenue ? total.profit / total.revenue : 0 }, breakdown, months: [...months.values()].sort((a, b) => a.month.localeCompare(b.month)), rowCount: selected.length };
}
