const SERIES = 'var(--base-chart-1)';
const COVER_SCALE_DAYS = 90;

export const Sparkline: React.FC<{ values: number[]; label: string }> = ({ values, label }) => {
  const width = 96;
  const height = 24;
  const max = Math.max(...values, 1);
  const step = width / Math.max(values.length - 1, 1);
  const points = values.map((v, i) => [i * step, height - 2 - (v / max) * (height - 4)] as const);
  const [lastX, lastY] = points[points.length - 1] ?? [0, height];
  return (
    <svg width={width} height={height} role="img" aria-label={label} className="shrink-0 overflow-visible">
      <title>{label}</title>
      <polyline points={points.map(p => p.join(',')).join(' ')} fill="none" stroke={SERIES} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lastX} cy={lastY} r={3} fill={SERIES} stroke="var(--base-card)" strokeWidth={2} />
    </svg>
  );
};

export const DemandBar: React.FC<{ value: number; max: number; label: string }> = ({ value, max, label }) => (
  <div className="h-2 w-full rounded bg-[var(--base-muted)]" title={label}>
    <div className="h-2 rounded" style={{ width: `${Math.max((value / Math.max(max, 1)) * 100, 2)}%`, background: SERIES }} />
  </div>
);

/** Days of cover as a bar, with a tick where the supplier lead time ends. */
export const CoverBar: React.FC<{ days: number | null; leadTime: number }> = ({ days, leadTime }) => {
  const pct = (d: number) => `${Math.min(d / COVER_SCALE_DAYS, 1) * 100}%`;
  const label = days === null ? 'Kein Absatz' : `Reichweite ${days.toLocaleString('de-DE')} Tage, Lieferzeit ${leadTime} Tage`;
  return (
    <div className="relative h-2 w-24 rounded bg-[var(--base-muted)]" title={label} aria-label={label}>
      {days !== null && days > 0 && <div className="h-2 rounded" style={{ width: pct(days), background: SERIES }} />}
      <div className="absolute -top-1 h-4 w-0.5 bg-[var(--base-foreground)]" style={{ left: pct(leadTime) }} />
    </div>
  );
};
