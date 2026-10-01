import { apiUrl } from '../common/constants';
import type { Dashboard, DashboardParams } from './types';

export async function fetchDashboard(path: string, params: DashboardParams, appToken?: string): Promise<Dashboard> {
  const query = new URLSearchParams({ days: String(params.days), leadTime: String(params.leadTime) });
  const res = await fetch(`${apiUrl}${path}?${query}`, {
    headers: appToken ? { Authorization: `Bearer ${appToken}` } : {},
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message ?? body.error ?? `HTTP ${res.status}`);
  return body as Dashboard;
}
