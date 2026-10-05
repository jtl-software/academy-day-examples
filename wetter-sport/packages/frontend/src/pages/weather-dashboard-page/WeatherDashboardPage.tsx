import { useState } from 'react';
import type { AppBridge } from '@jtl-software/cloud-apps-core';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertTriangle, CheckCircle2, CloudRain, Droplets, Package, ShoppingCart, Sun } from 'lucide-react';
import { fmt, loadLocation, saveLocation, shortDate, useInsights, weekday, type DashboardInsights, type ReorderRow, type ShopLocation } from '../../common/insights';
import { CLASS_META, ChartTooltip, ClassBadge, DemoBanner, LangToggle, LocationPicker, ProfileBadge, codeMeta } from '../../common/weather-ui';
import { t, useLang } from '../../common/i18n';

const GRID = '#e2e8f0';
const AXIS = { fontSize: 11, fill: '#64748b' };
const TEMP_MAX = '#D97706';
const TEMP_MIN = '#2563EB';
const STOCK = '#94A3B8';
const DEMAND = '#2722F8';

const WeatherDashboardPage: React.FC<{ appBridge: AppBridge | null }> = ({ appBridge }) => {
  const [shopLocation, setShopLocation] = useState<ShopLocation | null>(loadLocation);
  const [demo, setDemo] = useState(!appBridge);
  const [onlyWeather, setOnlyWeather] = useState(false);
  useLang();
  const { data, error, loading } = useInsights<DashboardInsights>(appBridge, '/insights/dashboard', shopLocation, demo);

  const changeLocation = (loc: ShopLocation) => {
    saveLocation(loc);
    setShopLocation(loc);
  };

  if (error) return <div className="m-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">{t('error.load', { msg: error })}</div>;
  if (!data) return <DashboardSkeleton />;

  const days = data.forecast.map(d => ({ ...d, day: `${weekday(d.date)} ${shortDate(d.date)}` }));
  const demand = data.dailyDemand.map(d => ({ ...d, day: `${weekday(d.date)} ${shortDate(d.date)}` }));
  const rows = onlyWeather ? data.reorder.filter(r => r.weatherDriven) : data.reorder;
  const topRows = data.reorder.slice(0, 8).map(r => ({ name: r.name, stock: r.stockAvailable + r.stockIncoming, demand: Math.round(r.expected7) }));
  const usedClasses = [...new Set(demand.map(d => d.weatherClass))];

  return (
    <div className={`min-h-screen bg-[#F4F4F0] pb-10 text-slate-800 transition-opacity ${loading ? 'opacity-60' : ''}`}>
      <header className="bg-gradient-to-br from-[#0B1B45] via-[#14296b] to-[#2722F8] px-6 pb-6 pt-5 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold">{t('dash.title')}</h1>
              <p className="text-sm text-blue-100/80">{t('dash.subtitle')}</p>
            </div>
            <div className="flex items-center gap-2">
              <LangToggle dark />
              <LocationPicker location={data.location} onChange={changeLocation} />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            {days.map((d, i) => {
              const Icon = codeMeta(d.code, d.sunshineHours).icon;
              return (
                <div key={d.date} className={`rounded-2xl p-3 backdrop-blur ${i === 0 ? 'bg-white/20 ring-1 ring-white/40' : 'bg-white/10'}`}>
                  <div className="text-xs text-blue-100">{i === 0 ? t('dash.today') : weekday(d.date, 'long')}</div>
                  <Icon size={30} className="my-2" color={d.weatherClass === 'sunny' ? '#FBBF24' : '#E2E8F0'} strokeWidth={1.6} />
                  <div className="text-lg font-semibold">
                    {fmt(d.tempMax)}° <span className="text-sm font-normal text-blue-100/80">{fmt(d.tempMin)}°</span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-1 text-[11px] text-blue-100/80">
                    <Droplets size={11} /> {fmt(d.precipitation, 1)} mm · {codeMeta(d.code, d.sunshineHours).label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-5 px-6 pt-5">
        <DemoBanner
          demo={data.demo}
          canToggle={!!appBridge}
          onToggle={() => setDemo(d => !d)}
          hint={data.salesCount === 0 ? t('dash.noSales') : undefined}
        />

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi icon={<Sun size={18} color="#D97706" />} label={t('kpi.sunny')} value={t('kpi.ofSeven', { n: data.stats.sunnyDays })} />
          <Kpi icon={<CloudRain size={18} color="#2563EB" />} label={t('kpi.rain')} value={t('kpi.ofSeven', { n: data.stats.rainDays })} />
          <Kpi icon={<ShoppingCart size={18} color={DEMAND} />} label={t('kpi.reorder')} value={t('kpi.items', { n: data.stats.reorderCount })} />
          <Kpi icon={<AlertTriangle size={18} color="#DC2626" />} label={t('kpi.weather')} value={t('kpi.items', { n: data.stats.weatherDrivenCount })} />
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <Card title={t('chart.temp')} subtitle={t('chart.tempSub')}>
            <ResponsiveContainer height={220}>
              <LineChart data={days} margin={{ top: 10, right: 28, left: -16, bottom: 0 }}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="day" tick={AXIS} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS} axisLine={false} tickLine={false} unit="°" />
                <Tooltip
                  content={({ active, payload, label }) => (
                    <ChartTooltip
                      active={active}
                      label={String(label ?? '')}
                      rows={(payload ?? []).map(p => ({ label: String(p.name), value: `${fmt(Number(p.value), 1)} °C`, color: String(p.color) }))}
                    />
                  )}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Line name={t('chart.max')} dataKey="tempMax" stroke={TEMP_MAX} strokeWidth={2} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} />
                <Line name={t('chart.min')} dataKey="tempMin" stroke={TEMP_MIN} strokeWidth={2} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card title={t('chart.rain')} subtitle={t('chart.rainSub')}>
            <ResponsiveContainer height={220}>
              <BarChart data={days} margin={{ top: 10, right: 28, left: -16, bottom: 0 }}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="day" tick={AXIS} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: '#f1f5f9' }}
                  content={({ active, payload, label }) => (
                    <ChartTooltip active={active} label={String(label ?? '')} rows={(payload ?? []).map(p => ({ label: t('chart.rain'), value: `${fmt(Number(p.value), 1)} mm` }))} />
                  )}
                />
                <Bar dataKey="precipitation" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card title={t('chart.demand')} subtitle={t('chart.demandSub')}>
            <ResponsiveContainer height={240}>
              <BarChart data={demand} margin={{ top: 10, right: 28, left: -16, bottom: 0 }}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="day" tick={AXIS} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: '#f1f5f9' }}
                  content={({ active, payload, label }) => {
                    const p = payload?.[0]?.payload as (typeof demand)[number] | undefined;
                    return p ? (
                      <ChartTooltip
                        active={active}
                        label={String(label ?? '')}
                        rows={[
                          { label: t('chart.expected'), value: t('unit.pcs', { n: fmt(p.units) }) },
                          { label: t('chart.weather'), value: CLASS_META[p.weatherClass].label, color: CLASS_META[p.weatherClass].color },
                        ]}
                      />
                    ) : null;
                  }}
                />
                <Bar dataKey="units" radius={[4, 4, 0, 0]} maxBarSize={36}>
                  {demand.map(d => (
                    <Cell key={d.date} fill={CLASS_META[d.weatherClass].color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-600">
              {usedClasses.map(c => (
                <ClassBadge key={c} weatherClass={c} />
              ))}
            </div>
          </Card>

          <Card title={t('chart.stockVsDemand')} subtitle={t('chart.stockVsDemandSub')}>
            {topRows.length === 0 ? (
              <EmptyOk />
            ) : (
              <ResponsiveContainer height={Math.max(240, topRows.length * 34 + 40)}>
                <BarChart data={topRows} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }} barGap={2} barCategoryGap={8}>
                  <CartesianGrid stroke={GRID} horizontal={false} />
                  <XAxis type="number" tick={AXIS} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={150} tick={{ ...AXIS, fill: '#334155' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: '#f1f5f9' }}
                    content={({ active, payload, label }) => (
                      <ChartTooltip
                        active={active}
                        label={String(label ?? '')}
                        rows={(payload ?? []).map(p => ({ label: String(p.name), value: t('unit.pcs', { n: fmt(Number(p.value)) }), color: String(p.color) }))}
                      />
                    )}
                  />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                  <Bar name={t('chart.stock')} dataKey="stock" fill={STOCK} radius={[0, 4, 4, 0]} maxBarSize={12} />
                  <Bar name={t('chart.demand7')} dataKey="demand" fill={DEMAND} radius={[0, 4, 4, 0]} maxBarSize={12} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </div>

        <Card
          title={t('reorder.title')}
          subtitle={t('reorder.subtitle')}
          action={
            <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-600">
              <input type="checkbox" checked={onlyWeather} onChange={e => setOnlyWeather(e.target.checked)} className="accent-[#2722F8]" />
              {t('reorder.onlyWeather')}
            </label>
          }
        >
          {rows.length === 0 ? <EmptyOk /> : <ReorderTable rows={rows} />}
        </Card>

        <p className="text-xs text-slate-500">
          {t('footer.basis', { source: data.demo ? t('footer.demo') : t('footer.lines', { n: fmt(data.salesCount) }), place: data.location.name })} {t('footer.formula')}
        </p>
      </main>
    </div>
  );
};

const ReorderTable: React.FC<{ rows: ReorderRow[] }> = ({ rows }) => (
  <div className="-mx-5 overflow-x-auto">
    <table className="w-full min-w-[760px] text-sm">
      <thead>
        <tr className="border-b border-slate-200 text-left text-xs font-medium text-slate-500">
          <th className="px-5 py-2">{t('reorder.item')}</th>
          <th className="px-3 py-2">{t('reorder.profile')}</th>
          <th className="px-3 py-2 text-right">{t('reorder.stock')}</th>
          <th className="px-3 py-2 text-right">{t('reorder.incoming')}</th>
          <th className="px-3 py-2 text-right">{t('reorder.demand')}</th>
          <th className="px-3 py-2 text-right">{t('reorder.cover')}</th>
          <th className="px-5 py-2 text-right">{t('reorder.suggest')}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(r => {
          const critical = r.daysOfCover !== null && r.daysOfCover < 3;
          return (
            <tr key={r.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
              <td className="px-5 py-2.5">
                <div className="font-medium">{r.name}</div>
                <div className="text-xs text-slate-500">
                  {r.sku}
                  {r.group ? ` · ${r.group}` : ''}
                </div>
              </td>
              <td className="px-3 py-2.5">
                <div className="flex flex-col items-start gap-1">
                  <ProfileBadge profile={r.profile} />
                  {r.weatherDriven && <span className="text-[11px] text-slate-500">{t('reorder.byWeather', { pct: fmt((r.expected7 / Math.max(r.baseline7, 0.01) - 1) * 100) })}</span>}
                </div>
              </td>
              <td className="px-3 py-2.5 text-right tabular-nums">{fmt(r.stockAvailable)}</td>
              <td className="px-3 py-2.5 text-right tabular-nums text-slate-500">{fmt(r.stockIncoming)}</td>
              <td className="px-3 py-2.5 text-right tabular-nums">{fmt(r.expected7)}</td>
              <td className="px-3 py-2.5 text-right">
                <span className={`inline-flex items-center gap-1 tabular-nums ${critical ? 'font-medium text-red-700' : 'text-slate-700'}`}>
                  {critical && <AlertTriangle size={13} />}
                  {r.daysOfCover === null ? '-' : t('reorder.days', { n: fmt(r.daysOfCover, 1) })}
                </span>
              </td>
              <td className="px-5 py-2.5 text-right">
                <span className="inline-flex items-center gap-1 rounded-lg bg-[#2722F8]/10 px-2 py-1 font-semibold tabular-nums text-[#2722F8]">
                  <Package size={13} /> {t('unit.pcs', { n: fmt(r.reorder) })}
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

const Card: React.FC<{ title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode }> = ({ title, subtitle, action, children }) => (
  <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70">
    <div className="mb-3 flex items-start justify-between gap-3">
      <div>
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
    {children}
  </section>
);

const Kpi: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70">
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50">{icon}</div>
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  </div>
);

const EmptyOk = () => (
  <div className="flex items-center gap-2 py-6 text-sm text-slate-500">
    <CheckCircle2 size={16} className="text-emerald-600" /> {t('reorder.allGood')}
  </div>
);

const DashboardSkeleton = () => (
  <div className="min-h-screen animate-pulse bg-[#F4F4F0]">
    <div className="h-64 bg-[#0B1B45]" />
    <div className="mx-auto grid max-w-7xl gap-5 p-6 lg:grid-cols-2">
      {[0, 1, 2, 3].map(i => (
        <div key={i} className="h-64 rounded-2xl bg-white" />
      ))}
    </div>
  </div>
);

export default WeatherDashboardPage;
