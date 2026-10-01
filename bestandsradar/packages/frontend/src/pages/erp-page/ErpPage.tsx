import { useCallback } from 'react';
import IErpPageProps from './IErpPageProps';
import Dashboard from '../../dashboard/Dashboard';
import { fetchDashboard } from '../../dashboard/api';
import type { DashboardParams } from '../../dashboard/types';

const ErpPage: React.FC<IErpPageProps> = ({ appBridge }) => {
  const load = useCallback(
    async (params: DashboardParams) => {
      const { accessToken } = await appBridge.method.call<{ accessToken: string }>('getAppToken');
      return fetchDashboard('/dashboard', params, accessToken);
    },
    [appBridge],
  );

  return <Dashboard load={load} />;
};

export default ErpPage;
