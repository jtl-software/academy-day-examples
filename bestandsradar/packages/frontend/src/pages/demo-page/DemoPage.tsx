import Dashboard from '../../dashboard/Dashboard';
import { fetchDashboard } from '../../dashboard/api';
import type { DashboardParams } from '../../dashboard/types';

const loadDemo = (params: DashboardParams) => fetchDashboard('/dashboard/demo', params);

const DemoPage: React.FC = () => <Dashboard load={loadDemo} />;

export default DemoPage;
