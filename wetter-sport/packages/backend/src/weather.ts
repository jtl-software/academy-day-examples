export type WeatherClass = 'sunny' | 'rain' | 'cold' | 'mixed';

export interface WeatherDay {
  date: string; // YYYY-MM-DD
  code: number;
  tempMax: number;
  tempMin: number;
  precipitation: number; // mm
  sunshineHours: number;
  weatherClass: WeatherClass;
}

export interface Location {
  lat: number;
  lon: number;
  name: string;
}

export const LOOKBACK_DAYS = 180;

export function classify(tempMax: number, precipitation: number, sunshineHours: number): WeatherClass {
  if (precipitation >= 1) return 'rain';
  if (tempMax < 8) return 'cold';
  if (tempMax >= 18 || (tempMax >= 14 && sunshineHours >= 6)) return 'sunny';
  return 'mixed';
}

const DAILY = 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,sunshine_duration';
const cache = new Map<string, { at: number; data: { history: WeatherDay[]; forecast: WeatherDay[] } }>();

const isoDate = (d: Date) => d.toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' });

async function fetchDaily(base: string, params: Record<string, string>): Promise<WeatherDay[]> {
  const url = new URL(base);
  url.search = new URLSearchParams({ daily: DAILY, timezone: 'Europe/Berlin', ...params }).toString();
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
  const d = (await res.json()).daily;
  return (d.time as string[]).flatMap((date, i) => {
    const tempMax = d.temperature_2m_max[i];
    if (tempMax == null) return [];
    const precipitation = d.precipitation_sum[i] ?? 0;
    const sunshineHours = (d.sunshine_duration[i] ?? 0) / 3600;
    return [{ date, code: d.weather_code[i] ?? 0, tempMax, tempMin: d.temperature_2m_min[i] ?? tempMax, precipitation, sunshineHours, weatherClass: classify(tempMax, precipitation, sunshineHours) }];
  });
}

/** History from the archive (lags a few days), topped up with recent days and the 7-day forecast. */
export async function getWeather(loc: Location): Promise<{ history: WeatherDay[]; forecast: WeatherDay[] }> {
  const key = `${loc.lat.toFixed(2)},${loc.lon.toFixed(2)}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < 30 * 60_000) return hit.data;

  const coords = { latitude: String(loc.lat), longitude: String(loc.lon) };
  const today = isoDate(new Date());
  const [archive, recent] = await Promise.all([
    fetchDaily('https://archive-api.open-meteo.com/v1/archive', {
      ...coords,
      start_date: isoDate(new Date(Date.now() - LOOKBACK_DAYS * 86_400_000)),
      end_date: isoDate(new Date(Date.now() - 86_400_000)),
    }),
    fetchDaily('https://api.open-meteo.com/v1/forecast', { ...coords, past_days: '14', forecast_days: '7' }),
  ]);

  const byDate = new Map(archive.map(d => [d.date, d]));
  for (const d of recent) if (d.date < today && !byDate.has(d.date)) byDate.set(d.date, d);
  const data = {
    history: [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date)),
    forecast: recent.filter(d => d.date >= today).slice(0, 7),
  };
  cache.set(key, { at: Date.now(), data });
  return data;
}
