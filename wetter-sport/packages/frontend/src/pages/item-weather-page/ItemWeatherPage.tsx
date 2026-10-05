import { useEffect, useState } from 'react';
import type { AppBridge } from '@jtl-software/cloud-apps-core';
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Droplets, MousePointerClick, Package, TrendingUp } from 'lucide-react';
import { fmt, loadLocation, shortDate, useInsights, weekday, type ItemInsights } from '../../common/insights';
import { CLASS_META, ChartTooltip, DemoBanner, LangToggle, PROFILE_META, ProfileBadge, codeMeta } from '../../common/weather-ui';
import { t, useLang } from '../../common/i18n';

const ItemWeatherPage: React.FC<{ appBridge: AppBridge | null }> = ({ appBridge }) => {
  const [itemId, setItemId] = useState<string | null>(() => (appBridge ? null : (new URLSearchParams(location.search).get('itemId') ?? 'demo-1')));
  const [demo, setDemo] = useState(!appBridge);
  const [shopLocation] = useState(loadLocation);
  useLang();

  useEffect(() => {
    if (!appBridge) return;
    appBridge.method
      .call<string>('getCurrentItemId')
      .then(id => id && setItemId(id))
      .catch(() => undefined);
    return appBridge.event.subscribe('ItemChanged', (data: unknown) => {
      setItemId((data as { itemId?: string }).itemId || null);
    });
  }, [appBridge]);

  const { data, error, loading } = useInsights<ItemInsights>(appBridge, itemId ? `/insights/item/${encodeURIComponent(itemId)}` : null, shopLocation, demo);

  if (!itemId) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-2 p-6 text-center text-sm text-slate-500">
        <MousePointerClick size={28} className="text-slate-400" />
        {t('pane.pick')}
        <LangToggle />
      </div>
    );
  }
  if (error) return <div className="m-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{t('error.load', { msg: error })}</div>;
  if (!data) return <PaneSkeleton />;

  const maxAvg = Math.max(...data.byClass.map(c => c.avg), 0.01);
  const chartData = data.byClass.filter(c => c.days > 0).map(c => ({ ...c, label: CLASS_META[c.weatherClass].label }));

  return (
    <div className={`space-y-4 p-4 text-slate-800 transition-opacity ${loading ? 'opacity-60' : ''}`}>
      <DemoBanner
        demo={data.demo}
        canToggle={!!appBridge}
        onToggle={() => setDemo(d => !d)}
        hint={data.sales.length === 0 ? t('pane.noSales', { days: data.days }) : undefined}
      />

      <header className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{data.item?.sku ?? itemId}</div>
          <LangToggle />
        </div>
        <h1 className="text-base font-semibold leading-snug">{data.item?.name ?? t('pane.unknownItem')}</h1>
        <ProfileBadge profile={data.profile} />
      </header>

      <div className="grid grid-cols-2 gap-2">
        <Stat icon={<TrendingUp size={14} />} label={t('pane.sold', { days: data.days })} value={fmt(data.totalSold)} />
        <Stat icon={<Package size={14} />} label={t('pane.stock')} value={data.item ? fmt(data.item.stockAvailable) : '-'} />
      </div>

      {data.profile !== 'neutral' && data.profile !== 'mixed' && (
        <p className="rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
          {t('pane.liftBefore')} <b>{PROFILE_META[data.profile].short}</b> {t('pane.liftAfter', { lift: fmt(data.lift, 1) })}
        </p>
      )}

      <section>
        <h2 className="mb-1 text-xs font-semibold text-slate-700">{t('pane.byWeather')}</h2>
        <div className="h-36">
          <ResponsiveContainer>
            <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 36, top: 4, bottom: 4 }} barCategoryGap={6}>
              <XAxis type="number" hide domain={[0, maxAvg * 1.1]} />
              <YAxis type="category" dataKey="label" width={96} tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: '#f1f5f9' }}
                content={({ active, payload }) => {
                  const p = payload?.[0]?.payload as (typeof chartData)[number] | undefined;
                  return p ? <ChartTooltip active={active} label={p.label} rows={[{ label: t('pane.avgPerDay'), value: fmt(p.avg, 2) }, { label: t('pane.days'), value: String(p.days) }]} /> : null;
                }}
              />
              <Bar dataKey="avg" radius={[0, 4, 4, 0]}>
                {chartData.map(c => (
                  <Cell key={c.weatherClass} fill={CLASS_META[c.weatherClass].color} />
                ))}
                <LabelList dataKey="avg" position="right" formatter={(v: unknown) => fmt(Number(v), 1)} style={{ fontSize: 11, fill: '#334155' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-xs font-semibold text-slate-700">{t('pane.lastDays')}</h2>
        {data.sales.length === 0 ? (
          <p className="text-xs text-slate-500">{t('pane.none')}</p>
        ) : (
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl ring-1 ring-slate-200">
            {data.sales.map(s => {
              const w = s.weather;
              const Icon = w ? codeMeta(w.code, w.sunshineHours).icon : null;
              return (
                <li key={s.date} className="flex items-center gap-3 bg-white px-3 py-2">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: w ? `${CLASS_META[w.weatherClass].color}1f` : '#f1f5f9' }}
                    title={w ? `${codeMeta(w.code, w.sunshineHours).label}, ${CLASS_META[w.weatherClass].label}` : t('pane.noWeather')}
                  >
                    {Icon && <Icon size={16} color={CLASS_META[w!.weatherClass].color} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium">
                      {weekday(s.date)}, {shortDate(s.date)}
                    </div>
                    <div className="truncate text-[11px] text-slate-500">
                      {w ? (
                        <>
                          {fmt(w.tempMax)}° / {fmt(w.tempMin)}° · <Droplets size={10} className="inline" /> {fmt(w.precipitation, 1)} mm
                        </>
                      ) : (
                        t('pane.noWeather')
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{t('unit.pcs', { n: fmt(s.quantity) })}</div>
                    <div className="text-[10px] text-slate-400">{s.orders === 1 ? t('pane.orders1') : t('pane.ordersN', { n: s.orders })}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <p className="text-[10px] text-slate-400">{t('pane.source', { place: data.location.name })}</p>
    </div>
  );
};

const Stat: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
    <div className="flex items-center gap-1 text-[11px] text-slate-500">
      {icon}
      {label}
    </div>
    <div className="mt-1 text-lg font-semibold">{value}</div>
  </div>
);

const PaneSkeleton = () => (
  <div className="animate-pulse space-y-3 p-4">
    <div className="h-4 w-1/3 rounded bg-slate-200" />
    <div className="h-5 w-2/3 rounded bg-slate-200" />
    <div className="grid grid-cols-2 gap-2">
      <div className="h-16 rounded-xl bg-slate-100" />
      <div className="h-16 rounded-xl bg-slate-100" />
    </div>
    <div className="h-36 rounded-xl bg-slate-100" />
    <div className="h-48 rounded-xl bg-slate-100" />
  </div>
);

export default ItemWeatherPage;
