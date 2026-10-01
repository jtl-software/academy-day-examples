import { useState } from 'react';
import { BAND_LABEL, recommendedAction } from './model';
import type { Customer, RiskAssessment, RiskBand } from './types';
import './risk.css';

const bandColor: Record<RiskBand, string> = {
  niedrig: 'var(--risk-low)',
  mittel: 'var(--risk-mid)',
  hoch: 'var(--risk-high)',
};

export type RiskRow = { customer: Customer; assessment: RiskAssessment };

function Badge({ band }: { band: RiskBand }) {
  const color = bandColor[band];
  return (
    <span className="kr-badge" style={{ background: `${color}1a`, color }}>
      <span className="kr-dot" style={{ background: color }} />
      {BAND_LABEL[band]}
    </span>
  );
}

function Gauge({ score, band }: { score: number; band: RiskBand }) {
  const radius = 64;
  const cx = 82;
  const cy = 82;
  const circumference = Math.PI * radius;
  const filled = (Math.min(100, Math.max(0, score)) / 100) * circumference;
  const arc = `M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`;
  return (
    <svg width="164" height="94" viewBox="0 0 164 94" role="img" aria-label={`Risiko-Score ${score}`}>
      <path d={arc} fill="none" stroke="#ecece6" strokeWidth="13" strokeLinecap="round" />
      <path
        d={arc}
        fill="none"
        stroke={bandColor[band]}
        strokeWidth="13"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${circumference}`}
      />
      <text x={cx} y={cy - 12} textAnchor="middle" fontSize="31" fontWeight="700" fill="var(--jtl-dark-blue)">
        {score}
      </text>
      <text x={cx} y={cy + 6} textAnchor="middle" fontSize="11" fill="var(--kr-muted)">
        von 100
      </text>
    </svg>
  );
}

function Factors({ factors }: { factors: RiskAssessment['factors'] }) {
  return (
    <div>
      <p className="kr-section">Risikofaktoren</p>
      {factors.map((f) => {
        const maxPts = f.weight * 100;
        const fillPct = maxPts > 0 ? (f.contribution / maxPts) * 100 : 0;
        return (
          <div className="kr-factor" key={f.key}>
            <div className="r">
              <span>{f.label}</span>
              <span className="pts">
                {f.contribution.toFixed(1)} / {maxPts.toFixed(0)} Pkt.
              </span>
            </div>
            <div className="kr-bar">
              <span style={{ width: `${fillPct}%` }} />
            </div>
            <div className="dt">{f.detail}</div>
          </div>
        );
      })}
    </div>
  );
}

export function CustomerRiskCard({
  customer,
  assessment,
  compact = false,
}: {
  customer: Customer;
  assessment: RiskAssessment;
  compact?: boolean;
}) {
  const s = assessment.stats;
  return (
    <div className="kr-detail" style={compact ? { padding: 0 } : undefined}>
      <div className="kr-detail-head">
        <div>
          <h2>{customer.name}</h2>
          <div className="sub">
            {customer.id}
            {!compact && customer.email ? ` · ${customer.email}` : ''}
          </div>
        </div>
        <Badge band={assessment.band} />
      </div>

      <div className="kr-gauge">
        <Gauge score={assessment.score} band={assessment.band} />
        <div className="readout">
          <div className="prob">
            Retoure nächste Bestellung:{' '}
            <strong>{Math.round(assessment.returnProbability * 100)}%</strong>
          </div>
          <div className="sub">Datenbasis: {assessment.confidence}</div>
          <div className="kr-action">{recommendedAction(assessment.band)}</div>
        </div>
      </div>

      {!compact && (
        <div className="kr-stats">
          <div className="kr-stat">
            <div className="v">{s.orderCount}</div>
            <div className="l">Bestellungen</div>
          </div>
          <div className="kr-stat">
            <div className="v">{s.distinctShippingAddresses}</div>
            <div className="l">Lieferadressen</div>
          </div>
          <div className="kr-stat">
            <div className="v">{Math.round(s.billingMismatchShare * 100)}%</div>
            <div className="l">Adresse abweichend</div>
          </div>
          <div className="kr-stat">
            <div className="v">{s.avgOrderValue.toFixed(0)} €</div>
            <div className="l">Ø Bestellwert</div>
          </div>
        </div>
      )}

      <Factors factors={assessment.factors} />
    </div>
  );
}

export function RiskOverview({ rows }: { rows: RiskRow[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = rows.find((r) => r.customer.id === selectedId) ?? rows[0] ?? null;

  return (
    <div className="kr">
      <div className="kr-head">
        <h1>Kundenrisiko</h1>
        <p>Retouren-Risiko je Kunde aus Bestellhistorie, Lieferadressen und Bestellwert (Live-Daten).</p>
      </div>
      <div className="kr-layout">
        <div className="kr-panel">
          <div className="kr-list-head">
            <span>Kunden</span>
            <small>{rows.length} · nach Risiko</small>
          </div>
          {rows.map(({ customer, assessment }) => (
            <button
              key={customer.id}
              className={`kr-row${selected?.customer.id === customer.id ? ' active' : ''}`}
              onClick={() => setSelectedId(customer.id)}
            >
              <span className="kr-chip" style={{ background: bandColor[assessment.band] }}>
                {assessment.score}
              </span>
              <span className="meta">
                <div className="name">{customer.name}</div>
                <div className="sub">
                  {customer.id} · {assessment.stats.orderCount} Best. ·{' '}
                  {assessment.stats.distinctShippingAddresses} Adressen
                </div>
              </span>
            </button>
          ))}
        </div>
        <div className="kr-panel">
          {selected && (
            <CustomerRiskCard customer={selected.customer} assessment={selected.assessment} />
          )}
        </div>
      </div>
    </div>
  );
}
