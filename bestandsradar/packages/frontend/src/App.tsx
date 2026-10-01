import { AppBridge } from '@jtl-software/cloud-apps-core';
import './App.css';
import ConfigWarningBanner from './common/ConfigWarningBanner';
import { DemoPage, ErpPage, HubPage, SetupPage, UserExamplePage, WelcomePage } from './pages';
import { RequireJtlAuth } from '@jtl-software/cloud-apps-auth';
import { useEffect } from 'react';

type AppMode = 'setup' | 'erp' | 'demo' | 'hub' | 'user-example' | 'callback';

/** Pages served inside the ERP/Hub iframe. Identity comes from the AppBridge, not browser login. */
const EmbeddedRouter: React.FC<{ appBridge: AppBridge; mode: AppMode }> = ({ appBridge, mode }) => {
  switch (mode) {
    case 'setup':
      return <SetupPage appBridge={appBridge} />;
    case 'erp':
      return <ErpPage appBridge={appBridge} />;
    case 'demo':
      return <DemoPage />;
    default:
      return <WelcomePage connected />;
  }
};

/** Standalone browser pages. Everything here is behind the JTL login (see RequireJtlAuth). */
const StandaloneRouter: React.FC<{ mode: AppMode }> = ({ mode }) => {
  switch (mode) {
    case 'hub':
      return <HubPage />;
    case 'user-example':
      return <UserExamplePage />;
    default:
      return <WelcomePage />;
  }
};

const AppRouter: React.FC<{ appBridge: AppBridge | null; bridgeResolved: boolean }> = ({ appBridge, bridgeResolved }) => {
  const mode: AppMode = location.pathname.substring(1) as AppMode;

  useEffect((): void => {
    if (appBridge) {
      console.log('[Bestandsradar] bridge created!');
    }
  }, [appBridge]);

  // The /callback is always a top-level browser tab; let RequireJtlAuth show progress while the
  // AuthProvider finishes the sign-in, without waiting on the (absent) bridge.
  if (mode === 'callback') {
    return (
      <RequireJtlAuth>
        <StandaloneRouter mode={mode} />
      </RequireJtlAuth>
    );
  }

  // Sample data needs neither the ERP nor a login.
  if (mode === 'demo' && !appBridge) {
    return <DemoPage />;
  }

  // Wait until we know whether we're embedded before choosing a router, so an embedded app
  // doesn't briefly fall into the standalone (login) branch while the bridge connects.
  if (!bridgeResolved) {
    return null;
  }

  if (appBridge) {
    return <EmbeddedRouter appBridge={appBridge} mode={mode} />;
  }

  return (
    <RequireJtlAuth>
      <StandaloneRouter mode={mode} />
    </RequireJtlAuth>
  );
};

const App: React.FC<{ appBridge: AppBridge | null; bridgeResolved: boolean }> = ({ appBridge, bridgeResolved }) => (
  <>
    <ConfigWarningBanner />
    <AppRouter appBridge={appBridge} bridgeResolved={bridgeResolved} />
  </>
);

export default App;
