import { useEffect, useRef, useState } from 'react';
import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSun, Languages, MapPin, Snowflake, Sun, type LucideIcon } from 'lucide-react';
import { setLang, t, useLang } from './i18n';
import type { Profile, ShopLocation, WeatherClass } from './insights';

export const CLASS_META: Record<WeatherClass, { label: string; color: string; icon: LucideIcon }> = {
  sunny: { get label() { return t('class.sunny'); }, color: '#D97706', icon: Sun },
  mixed: { get label() { return t('class.mixed'); }, color: '#94A3B8', icon: CloudSun },
  rain: { get label() { return t('class.rain'); }, color: '#2563EB', icon: CloudRain },
  cold: { get label() { return t('class.cold'); }, color: '#0D9488', icon: Snowflake },
};

export const PROFILE_META: Record<Profile, { label: string; short: string }> = {
  sunny: { get label() { return t('profile.sunny'); }, get short() { return t('short.sunny'); } },
  rain: { get label() { return t('profile.rain'); }, get short() { return t('short.rain'); } },
  cold: { get label() { return t('profile.cold'); }, get short() { return t('short.cold'); } },
  mixed: { get label() { return t('profile.mixed'); }, get short() { return t('profile.mixed'); } },
  neutral: { get label() { return t('profile.neutral'); }, get short() { return t('profile.neutral'); } },
};

/** WMO weather code as used by Open-Meteo. The daily code is the worst of the day, so dry days use sunshine hours. */
export function codeMeta(code: number, sunshineHours: number): { label: string; icon: LucideIcon } {
  if (code <= 3) {
    if (sunshineHours >= 8) return { label: t('code.sunny'), icon: Sun };
    if (sunshineHours >= 4) return { label: t('code.fair'), icon: CloudSun };
    return { label: t('code.overcast'), icon: Cloud };
  }
  if (code <= 48) return { label: t('code.fog'), icon: CloudFog };
  if (code <= 57) return { label: t('code.drizzle'), icon: CloudDrizzle };
  if (code <= 67 || (code >= 80 && code <= 82)) return { label: t('code.rain'), icon: CloudRain };
  if (code <= 77 || code === 85 || code === 86) return { label: t('code.snow'), icon: Snowflake };
  return { label: t('code.storm'), icon: CloudLightning };
}

/** Switches the UI between German and English. */
export const LangToggle: React.FC<{ dark?: boolean }> = ({ dark }) => {
  const lang = useLang();
  return (
    <div
      role="group"
      aria-label="Sprache / Language"
      className={`inline-flex items-center gap-0.5 rounded-lg p-0.5 text-xs font-medium ${dark ? 'bg-white/10 ring-1 ring-white/20' : 'bg-slate-100 ring-1 ring-slate-200'}`}
    >
      <Languages size={14} className={`mx-1 ${dark ? 'text-blue-100' : 'text-slate-500'}`} />
      {(['de', 'en'] as const).map(l => (
        <button
          key={l}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`rounded-md px-2 py-1 uppercase ${
            lang === l ? (dark ? 'bg-white text-[#0B1B45]' : 'bg-white text-slate-900 shadow-sm') : dark ? 'text-blue-100 hover:bg-white/10' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
};

export const ClassBadge: React.FC<{ weatherClass: WeatherClass }> = ({ weatherClass }) => {
  const m = CLASS_META[weatherClass];
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium text-slate-700" style={{ background: `${m.color}1f` }}>
      <m.icon size={12} color={m.color} strokeWidth={2.2} />
      {m.label}
    </span>
  );
};

export const ProfileBadge: React.FC<{ profile: Profile }> = ({ profile }) => {
  if (profile === 'neutral' || profile === 'mixed') {
    return <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">{PROFILE_META[profile].label}</span>;
  }
  return <ClassBadge weatherClass={profile} />;
};

export const DemoBanner: React.FC<{ demo: boolean; canToggle: boolean; onToggle: () => void; hint?: string }> = ({ demo, canToggle, onToggle, hint }) => {
  if (!demo && !hint) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
      <span>{demo ? t('demo.banner') : hint}</span>
      {canToggle && (
        <button onClick={onToggle} className="rounded-lg bg-white px-2 py-1 font-medium text-amber-900 shadow-sm ring-1 ring-amber-200 hover:bg-amber-100">
          {demo ? t('demo.showReal') : t('demo.showDemo')}
        </button>
      )}
    </div>
  );
};

/** City search via the Open-Meteo geocoding API. */
export const LocationPicker: React.FC<{ location: ShopLocation; onChange: (loc: ShopLocation) => void }> = ({ location, onChange }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<(ShopLocation & { admin: string })[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim().length < 2) return;
    const t = setTimeout(async () => {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=de`);
      const body = await res.json();
      setResults(
        (body.results ?? []).map((r: { latitude: number; longitude: number; name: string; admin1?: string; country_code?: string }) => ({
          lat: r.latitude,
          lon: r.longitude,
          name: r.name,
          admin: [r.admin1, r.country_code].filter(Boolean).join(', '),
        })),
      );
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)} className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-sm text-white ring-1 ring-white/20 hover:bg-white/20">
        <MapPin size={14} />
        {location.name}
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-72 rounded-xl bg-white p-2 shadow-xl ring-1 ring-slate-200">
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t('location.search')}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500"
          />
          <ul className="mt-1 max-h-60 overflow-auto">
            {(query.trim().length < 2 ? [] : results).map(r => (
              <li key={`${r.lat},${r.lon}`}>
                <button
                  className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-800 hover:bg-slate-100"
                  onClick={() => {
                    onChange({ lat: r.lat, lon: r.lon, name: r.name });
                    setOpen(false);
                    setQuery('');
                  }}
                >
                  {r.name} <span className="text-xs text-slate-500">{r.admin}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export const ChartTooltip: React.FC<{ active?: boolean; label?: string; rows: { label: string; value: string; color?: string }[] }> = ({ active, label, rows }) => {
  if (!active) return null;
  return (
    <div className="rounded-lg bg-white px-3 py-2 text-xs shadow-lg ring-1 ring-slate-200">
      {label && <div className="mb-1 font-semibold text-slate-800">{label}</div>}
      {rows.map(r => (
        <div key={r.label} className="flex items-center gap-2 text-slate-600">
          {r.color && <span className="h-2 w-2 rounded-full" style={{ background: r.color }} />}
          <span>{r.label}</span>
          <span className="ml-auto pl-3 font-medium text-slate-900">{r.value}</span>
        </div>
      ))}
    </div>
  );
};
