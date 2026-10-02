import { useCallback, useEffect, useState } from 'react';
import { Alert, Badge, Box, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Skeleton, Stack, Text } from '@jtl-software/platform-ui-react';
import type { BadgeVariant } from '@jtl-software/platform-ui-react';
import { CoverBar, DemandBar, Sparkline } from './charts';
import type { Dashboard as DashboardData, DashboardLoader, ItemAnalysis, Status } from './types';

const WINDOWS = [30, 90, 180];
const TOP_DEMAND = 8;

const STATUS: Record<Status, { label: string; variant: BadgeVariant }> = {
  critical: { label: 'Kritisch', variant: 'danger' },
  reorder: { label: 'Jetzt bestellen', variant: 'warning' },
  soon: { label: 'Bald bestellen', variant: 'info' },
  ok: { label: 'OK', variant: 'success' },
};

const num = (value: number, digits = 0) => value.toLocaleString('de-DE', { maximumFractionDigits: digits });
const date = (iso: string) => new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
const isToday = (iso: string) => new Date(iso).toDateString() === new Date().toDateString();

const Trend: React.FC<{ pct: number | null }> = ({ pct }) => {
  if (pct === null) return <Text type="xs" color="info">neu</Text>;
  const color = pct > 10 ? 'success' : pct < -10 ? 'danger' : 'muted';
  const arrow = pct > 10 ? '▲' : pct < -10 ? '▼' : '▶';
  return (
    <Text type="xs" color={color} weight="semibold">
      {arrow} {pct > 0 ? '+' : ''}{num(pct)} %
    </Text>
  );
};

const Kpi: React.FC<{ label: string; value: number; hint: string }> = ({ label, value, hint }) => (
  <Card className="flex-1 min-w-[160px]">
    <CardContent className="pt-5">
      <Stack spacing="1" direction="column">
        <Text type="small" color="muted">{label}</Text>
        <Text type="h2" weight="semibold">{num(value)}</Text>
        <Text type="xs" color="muted">{hint}</Text>
      </Stack>
    </CardContent>
  </Card>
);

const DemandList: React.FC<{ items: ItemAnalysis[] }> = ({ items }) => {
  const top = [...items].sort((a, b) => b.unitsSold - a.unitsSold).slice(0, TOP_DEMAND);
  const max = top[0]?.unitsSold ?? 1;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gefragte Artikel</CardTitle>
        <CardDescription>Meistverkaufte Artikel im Zeitraum. Trend: zweite Hälfte des Zeitraums gegen die erste. Linie: Verkäufe pro Woche.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-[minmax(160px,1.4fr)_minmax(120px,2fr)_70px_80px_96px] items-center gap-x-4 gap-y-3">
          {top.map(item => (
            <div key={item.itemId} className="contents">
              <Stack spacing="0" direction="column">
                <Text type="small" weight="semibold" truncate>{item.name}</Text>
                <Text type="xs" color="muted">{item.sku}</Text>
              </Stack>
              <DemandBar value={item.unitsSold} max={max} label={`${num(item.unitsSold)} Stück verkauft`} />
              <Text type="small" align="end">{num(item.unitsSold)} Stk.</Text>
              <Trend pct={item.trendPct} />
              <Sparkline values={item.weeklySales} label={`Verkäufe pro Woche: ${item.weeklySales.join(', ')}`} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const ReorderTable: React.FC<{ items: ItemAnalysis[] }> = ({ items }) => {
  const [showAll, setShowAll] = useState(false);
  const rows = showAll ? items : items.filter(i => i.status !== 'ok');
  const th = 'px-3 py-2 text-left text-xs font-semibold text-[var(--base-muted-foreground)] whitespace-nowrap';
  const td = 'px-3 py-2 text-sm whitespace-nowrap';
  return (
    <Card>
      <CardHeader>
        <Stack spacing="3" direction="row" itemAlign="center" justify="between">
          <Stack spacing="1" direction="column">
            <CardTitle>Nachbestellungen</CardTitle>
            <CardDescription>Meldebestand = Absatz während der Lieferzeit + Sicherheitsbestand. Bestellt wird, sobald verfügbarer Bestand plus Zulauf den Meldebestand erreicht.</CardDescription>
          </Stack>
          <Button variant="outline" size="sm" label={showAll ? 'Nur Handlungsbedarf' : `Alle ${items.length} Artikel`} onClick={() => setShowAll(v => !v)} />
        </Stack>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <Text type="small" color="muted">Kein Handlungsbedarf. Alle Artikel reichen über die Lieferzeit hinaus.</Text>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[var(--base-border)]">
                  <th className={th}>Status</th>
                  <th className={th}>Artikel</th>
                  <th className={`${th} text-right`}>Verfügbar</th>
                  <th className={`${th} text-right`}>Zulauf</th>
                  <th className={`${th} text-right`}>Ø Absatz/Tag</th>
                  <th className={th}>Reichweite</th>
                  <th className={`${th} text-right`}>Meldebestand</th>
                  <th className={th}>Bestellen bis</th>
                  <th className={`${th} text-right`}>Vorschlag</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(item => (
                  <tr key={item.itemId} className="border-b border-[var(--base-border)] last:border-0 hover:bg-[var(--base-accent)]">
                    <td className={td}><Badge variant={STATUS[item.status].variant} label={STATUS[item.status].label} /></td>
                    <td className={`${td} max-w-[280px]`}>
                      <Text type="small" weight="semibold" truncate>{item.name}</Text>
                      <Text type="xs" color="muted" truncate>{item.sku}{item.supplierName ? ` · ${item.supplierName}` : ''}</Text>
                    </td>
                    <td className={`${td} text-right`}>{num(item.stockAvailable)}</td>
                    <td className={`${td} text-right`}>{item.stockIncoming ? num(item.stockIncoming) : '-'}</td>
                    <td className={`${td} text-right`}>{num(item.dailyDemand, 2)}</td>
                    <td className={td}>
                      <Stack spacing="2" direction="row" itemAlign="center">
                        <CoverBar days={item.daysOfCover} leadTime={item.leadTimeDays} />
                        <Text type="xs" color="muted">
                          {item.daysOfCover === null ? '-' : `${num(item.daysOfCover)} T.`} / {item.leadTimeDays} T.{item.leadTimeIsDefault ? '*' : ''}
                        </Text>
                      </Stack>
                    </td>
                    <td className={`${td} text-right`} title={`davon Sicherheitsbestand ${num(item.safetyStock)}`}>{num(item.reorderPoint)}</td>
                    <td className={td}>{item.reorderDate ? (isToday(item.reorderDate) ? <Text type="small" weight="semibold">sofort</Text> : date(item.reorderDate)) : '-'}</td>
                    <td className={`${td} text-right font-semibold`}>{item.suggestedQuantity ? `${num(item.suggestedQuantity)} Stk.` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Box className="pt-3">
              <Text type="xs" color="muted">
                Reichweite: verfügbarer Bestand in Tagen, Strich = Lieferzeit. * Keine Lieferzeit beim Standardlieferanten hinterlegt, Standardwert verwendet. Vorschlag deckt Lieferzeit plus 30 Tage.
              </Text>
            </Box>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const Dashboard: React.FC<{ load: DashboardLoader }> = ({ load }) => {
  const [days, setDays] = useState(90);
  const [leadTime, setLeadTime] = useState(14);
  const [reloads, setReloads] = useState(0);
  const [result, setResult] = useState<{ key: string; data: DashboardData | null; error: string | null }>({ key: '', data: null, error: null });
  const requestKey = `${days}/${leadTime}/${reloads}`;
  const loading = result.key !== requestKey;
  const { data, error } = result;
  const refresh = useCallback(() => setReloads(n => n + 1), []);

  useEffect(() => {
    let active = true;
    load({ days, leadTime }).then(
      next => active && setResult({ key: requestKey, data: next, error: null }),
      (err: unknown) => active && setResult(prev => ({ key: requestKey, data: prev.data, error: err instanceof Error ? err.message : String(err) })),
    );
    return () => {
      active = false;
    };
  }, [load, days, leadTime, requestKey]);

  return (
    <Box className="mx-auto max-w-[1280px] p-6">
      <Stack spacing="6" direction="column">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <Stack spacing="1" direction="column">
            <Stack spacing="2" direction="row" itemAlign="center">
              <Text type="h2" weight="semibold">Bestandsradar</Text>
              {data?.isDemo && <Badge variant="secondary" label="Demodaten" />}
            </Stack>
            <Text type="small" color="muted">
              {data ? `Verkaufshistorie ${date(data.from)} bis ${date(data.to)}` : 'Verkaufshistorie wird geladen'}
            </Text>
          </Stack>
          <div className="flex flex-wrap items-center gap-3">
            <Stack spacing="1" direction="row" itemAlign="center">
              {WINDOWS.map(w => (
                <Button key={w} size="sm" variant={w === days ? 'default' : 'outline'} label={`${w} Tage`} onClick={() => setDays(w)} />
              ))}
            </Stack>
            <label className="flex items-center gap-2 text-sm text-[var(--base-muted-foreground)]">
              Standard-Lieferzeit
              <input
                type="number"
                min={1}
                max={180}
                value={leadTime}
                onChange={e => setLeadTime(Math.min(Math.max(Number(e.target.value) || 1, 1), 180))}
                className="w-16 rounded-md border border-[var(--base-input)] bg-[var(--base-background)] px-2 py-1 text-[var(--base-foreground)]"
              />
              Tage
            </label>
            <Button size="sm" variant="secondary" label="Aktualisieren" isLoading={loading} onClick={refresh} />
          </div>
        </div>

        {error && <Alert variant="destructive" title="Dashboard konnte nicht geladen werden" description={error} />}

        {!data && loading && (
          <Stack spacing="4" direction="column">
            <Skeleton variant="card" />
            <Skeleton variant="card" />
          </Stack>
        )}

        {data && (
          <>
            <div className="flex flex-wrap gap-4">
              <Kpi label="Artikel mit Verkäufen" value={data.totals.itemsWithSales} hint={`${num(data.totals.unitsSold)} Stück verkauft`} />
              <Kpi label="Kritisch" value={data.totals.critical} hint="Bestand reicht nicht bis zur nächsten Lieferung" />
              <Kpi label="Jetzt bestellen" value={data.totals.reorder} hint="Meldebestand erreicht" />
              <Kpi label="Bald bestellen" value={data.totals.soon} hint="Meldebestand in den nächsten 14 Tagen" />
            </div>
            {data.items.length === 0 ? (
              <Alert variant="info" title="Keine Verkäufe im Zeitraum" description="Wähle einen längeren Zeitraum oder prüfe, ob Aufträge in JTL-Wawi vorhanden sind." />
            ) : (
              <>
                <DemandList items={data.items} />
                <ReorderTable items={data.items} />
              </>
            )}
          </>
        )}
      </Stack>
    </Box>
  );
};

export default Dashboard;
