import { AppBridge } from '@jtl-software/cloud-apps-core';
import './App.css';
import ConfigWarningBanner from './common/ConfigWarningBanner';
import { ErpPage, GraphqlDemoPage, HubPage, PanePage, PanelEventsPage, ServerlessGraphqlPage, SetupPage, UserExamplePage, WelcomePage } from './pages';
import { RequireJtlAuth } from '@jtl-software/cloud-apps-auth';
import { useEffect } from 'react';

type AppMode = 'setup' | 'erp' | 'pane' | 'panel-events' | 'hub' | 'graphql-demo' | 'graphql-serverless' | 'user-example' | 'callback' | 'risk';

/** Pages served inside the ERP/Hub iframe. Identity comes from the AppBridge, not browser login. */
const EmbeddedRouter: React.FC<{ appBridge: AppBridge; mode: AppMode }> = ({ appBridge, mode }) => {
  switch (mode) {
    case 'setup':
      return <SetupPage appBridge={appBridge} />;
    case 'erp':
      return <ErpPage appBridge={appBridge} />;
    case 'pane':
      return <PanePage appBridge={appBridge} />;
    case 'panel-events':
      return <PanelEventsPage appBridge={appBridge} />;
    case 'graphql-demo':
      return <GraphqlDemoPage appBridge={appBridge} />;
    case 'graphql-serverless':
      return <ServerlessGraphqlPage appBridge={appBridge} />;
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
      console.log('[HelloWorldApp] bridge created!');
    }
  }, [appBridge]);

  // Opened standalone (dev server root, no ERP host): the app scores live Wawi orders, which only
  // exist inside the Cloud ERP, so there is nothing to show here. Point the developer to the ERP.
  if (mode === 'risk' || (location.pathname === '/' && !appBridge && bridgeResolved)) {
    return (
      <div style={{ padding: 40, background: '#eeeee7', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif', color: '#0b1b45' }}>
        <h1 style={{ fontSize: 20, margin: 0 }}>Kundenrisiko</h1>
        <p style={{ color: '#5c6472', maxWidth: 560 }}>
          Diese App bewertet das Retouren-Risiko je Kunde aus Live-Bestelldaten in JTL-Wawi. Die Daten
          gibt es nur im Cloud ERP: öffne die App im ERP über den Menüpunkt <b>Kundenrisiko</b> oder das
          Panel in der Kundenansicht.
        </p>
      </div>
    );
  }

  // The /callback is always a top-level browser tab; let RequireJtlAuth show progress while the
  // AuthProvider finishes the sign-in, without waiting on the (absent) bridge.
  if (mode === 'callback') {
    return (
      <RequireJtlAuth>
        <StandaloneRouter mode={mode} />
      </RequireJtlAuth>
    );
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
