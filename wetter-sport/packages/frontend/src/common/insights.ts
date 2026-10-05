import { useEffect, useState } from 'react';
import type { AppBridge } from '@jtl-software/cloud-apps-core';
import { apiUrl } from './constants';
import { locale } from './i18n';

export type WeatherClass = 'sunny' | 'rain' | 'cold' | 'mixed';
export type Profile = WeatherClass | 'neutral';

export interface WeatherDay {
  date: string;
  code: number;
  tempMax: number;
  tempMin: number;
  precipitation: number;
  sunshineHours: number;
  weatherClass: WeatherClass;
}

export interface ShopLocation {
  lat: number;
  lon: number;
  name: string;
}

interface Base {
  demo: boolean;
  location: ShopLocation;
}

export interface ItemInsights extends Base {
  item: { id: string; sku: string; name: string; group: string | null; stockAvailable: number; stockIncoming: number; minimumStock: number } | null;
  totalSold: number;
  days: number;
  profile: Profile;
  lift: number;
  byClass: { weatherClass: WeatherClass; avg: number; days: number }[];
  sales: { date: string; quantity: number; orders: number; weather: WeatherDay | null }[];
}

export interface ReorderRow {
  id: string;
  sku: string;
  name: string;
  group: string | null;
  stockAvailable: number;
  stockIncoming: number;
  minimumStock: number;
  profile: Profile;
  lift: number;
  expected7: number;
  baseline7: number;
  weatherDriven: boolean;
  daysOfCover: number | null;
  reorder: number;
}

export interface DashboardInsights extends Base {
  salesCount: number;
  forecast: WeatherDay[];
  dailyDemand: { date: string; weatherClass: WeatherClass; units: number }[];
  reorder: ReorderRow[];
  stats: { itemsAnalysed: number; weatherItems: number; reorderCount: number; weatherDrivenCount: number; sunnyDays: number; rainDays: number };
}

const LOCATION_KEY = 'wetter-sport-location';

export function loadLocation(): ShopLocation | null {
  try {
    const raw = localStorage.getItem(LOCATION_KEY);
    return raw ? (JSON.parse(raw) as ShopLocation) : null;
  } catch {
    return null;
  }
}

export function saveLocation(loc: ShopLocation): void {
  try {
    localStorage.setItem(LOCATION_KEY, JSON.stringify(loc));
  } catch {
    // storage blocked: the location then only lasts for this page view
  }
}

/** Loads insights from the backend, authenticated with the app token when running inside JTL. */
export function useInsights<T>(appBridge: AppBridge | null, path: string | null, location: ShopLocation | null, demo: boolean) {
  const key = JSON.stringify([path, location, demo]);
  const [state, setState] = useState<{ key: string; data: T | null; error: string | null }>({ key: '', data: null, error: null });

  useEffect(() => {
    if (!path) return;
    let active = true;
    (async () => {
      const params = new URLSearchParams();
      if (location) {
        params.set('lat', String(location.lat));
        params.set('lon', String(location.lon));
        params.set('name', location.name);
      }
      if (demo) params.set('demo', '1');
      const headers: Record<string, string> = {};
      if (appBridge) {
        const { accessToken } = await appBridge.method.call<{ accessToken: string }>('getAppToken');
        headers.Authorization = `Bearer ${accessToken}`;
      }
      const res = await fetch(`${apiUrl}${path}?${params}`, { headers });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
      if (active) setState({ key, data: body as T, error: null });
    })().catch(err => active && setState({ key, data: null, error: err instanceof Error ? err.message : String(err) }));
    return () => {
      active = false;
    };
  }, [appBridge, path, location, demo, key]);

  // Keeps showing the previous result while the next one loads.
  return { data: state.data, error: state.error, loading: state.key !== key };
}

export const fmt = (n: number, digits = 0) => n.toLocaleString(locale(), { maximumFractionDigits: digits, minimumFractionDigits: digits });

export const weekday = (date: string, style: 'short' | 'long' = 'short') =>
  new Date(`${date}T12:00:00`).toLocaleDateString(locale(), { weekday: style });

export const shortDate = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString(locale(), { day: '2-digit', month: '2-digit' });
