import { createAppBridge } from '/bridge.js';

const status = document.querySelector('#setup-status');
const button = document.querySelector('#complete-setup');
let appBridge;

try {
  appBridge = await createAppBridge();
  const { accessToken } = await appBridge.method.call('getAppToken');
  const response = await fetch('/api/connect-tenant', { headers: { authorization: `Bearer ${accessToken}` } });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Mandant konnte nicht verbunden werden.');
  status.textContent = `Mandant ${data.tenantId} ist verbunden.`;
  button.disabled = false;
} catch (error) {
  status.textContent = error.message || 'JTL-Verbindung fehlgeschlagen.';
}

button.addEventListener('click', async () => {
  button.disabled = true;
  status.textContent = 'Einrichtung wird abgeschlossen …';
  try {
    await appBridge.method.call('setupCompleted');
    status.textContent = 'Einrichtung abgeschlossen. Öffne Profit Pulse im Cloud ERP.';
  } catch (error) {
    status.textContent = error.message || 'Einrichtung konnte nicht abgeschlossen werden.';
    button.disabled = false;
  }
});
