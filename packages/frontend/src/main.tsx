import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { JtlAuthProvider } from '@jtl-software/cloud-apps-auth';
import './index.css';
import App from './App.tsx';
import { createAppBridge, AppBridge } from '@jtl-software/cloud-apps-core';

// createAppBridge never resolves without an ERP/Hub host, so only start it when embedded.
const isEmbedded = window.self !== window.top;
// Handshake exactly once. A second handshake (e.g. StrictMode re-running the effect) makes the host
// expose its setup methods on the first bridge while the app keeps the second, so setupCompleted goes
// missing. Starting it here, once, keeps a single handshake regardless of how often the effect runs.
const bridgePromise = isEmbedded ? createAppBridge() : null;

// Resolve the AppBridge inside React (not via re-render) so the auth provider mounts once and can
// process the /callback. `bridgeResolved` lets App wait before deciding embedded vs standalone, so
// an embedded app never briefly triggers a browser login while the bridge is still connecting.
// The app reads its own VITE_JTL_* env here and passes it in, keeping the auth package env-agnostic.
const Root = () => {
  const [appBridge, setAppBridge] = useState<AppBridge | null>(null);
  const [bridgeResolved, setBridgeResolved] = useState(!isEmbedded);

  useEffect(() => {
    if (!bridgePromise) return;
    let active = true;
    bridgePromise.then(bridge => {
      if (!active) return;
      setAppBridge(bridge);
      setBridgeResolved(true);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <JtlAuthProvider
      issuer={import.meta.env.VITE_JTL_ISSUER ?? ''}
      clientId={import.meta.env.VITE_JTL_CLIENT_ID ?? ''}
      scope={import.meta.env.VITE_JTL_SCOPE}
      defaultReturnPath="/"
    >
      <App appBridge={appBridge} bridgeResolved={bridgeResolved} />
    </JtlAuthProvider>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
