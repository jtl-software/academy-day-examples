import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppBridge } from '@jtl-software/cloud-apps-core';
import { Alert, Badge, Box, Button, Separator, Skeleton, Stack, Text } from '@jtl-software/platform-ui-react';
import { Mail, PartyPopper, Phone, Repeat, ShoppingBag, UserX } from 'lucide-react';
import { FirstOrderInfo, loadFirstOrderInfo } from '../../common/firstOrder';
import { buildWelcomeEmail, formatDate, formatMoney, SUPPORT_CONTACT, WelcomeEmail } from '../../common/welcomeEmail';

type LoadState = { status: 'idle' } | { status: 'loading' } | { status: 'error'; message: string } | { status: 'done'; info: FirstOrderInfo };

async function copyHtml(email: WelcomeEmail) {
  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/html': new Blob([email.html], { type: 'text/html' }),
        'text/plain': new Blob([email.text], { type: 'text/plain' }),
      }),
    ]);
  } catch {
    // The ERP iframe may not grant clipboard-write; fall back to copying a rendered selection.
    const holder = document.createElement('div');
    holder.innerHTML = email.html;
    holder.style.position = 'fixed';
    holder.style.left = '-9999px';
    document.body.appendChild(holder);
    const range = document.createRange();
    range.selectNodeContents(holder);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);
    document.execCommand('copy');
    window.getSelection()?.removeAllRanges();
    holder.remove();
  }
}

const EmailPreview: React.FC<{ html: string }> = ({ html }) => {
  const [height, setHeight] = useState(600);
  return (
    <iframe
      title="Vorschau Willkommensmail"
      srcDoc={html}
      className="w-full rounded-lg border"
      style={{ height, borderColor: 'var(--base-border)' }}
      onLoad={event => setHeight(event.currentTarget.contentDocument?.body.scrollHeight ?? 600)}
    />
  );
};

const FirstOrderView: React.FC<{ info: FirstOrderInfo }> = ({ info }) => {
  const email = useMemo(() => buildWelcomeEmail(info), [info]);
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const name = [info.firstName, info.lastName].filter(Boolean).join(' ') || info.company || 'Neuer Kunde';
  const mailto = `mailto:${encodeURIComponent(email.to ?? '')}?subject=${encodeURIComponent(email.subject)}&body=${encodeURIComponent(email.text)}`;

  const handleCopy = useCallback(async () => {
    await copyHtml(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [email]);

  return (
    <Stack spacing="4" direction="column">
      <div className="rounded-xl p-4 text-white" style={{ background: 'linear-gradient(135deg, #0B1B45 0%, #2722F8 100%)' }}>
        <Stack spacing="2" direction="column">
          <Stack spacing="2" direction="row" itemAlign="center">
            <PartyPopper size={22} color="#89D2FF" />
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#89D2FF' }}>
              Erstbestellung
            </span>
          </Stack>
          <span className="text-lg font-bold leading-snug">{name} bestellt zum ersten Mal!</span>
          <span className="text-sm" style={{ color: '#D6E4FF' }}>
            Auftrag {info.orderNumber}
            {info.orderDate ? ` vom ${formatDate(info.orderDate)}` : ''} · {formatMoney(info.totalGross, info.currencyIso)}
          </span>
        </Stack>
      </div>

      <Stack spacing="2" direction="column">
        <Text type="xs" weight="semibold" color="muted">
          KUNDE
        </Text>
        <Stack spacing="1" direction="column">
          <Text type="small" weight="semibold">
            {name}
          </Text>
          {info.customerNumber && (
            <Text type="xs" color="muted">
              Kundennummer {info.customerNumber}
            </Text>
          )}
          <Text type="xs" color="muted">
            {info.email ?? 'Keine E-Mail-Adresse hinterlegt'}
          </Text>
        </Stack>
      </Stack>

      <Separator />

      <Stack spacing="2" direction="column">
        <Stack spacing="2" direction="row" itemAlign="center">
          <Mail size={16} />
          <Text type="small" weight="semibold">
            Willkommensmail
          </Text>
        </Stack>
        <Text type="xs" color="muted">
          Betreff: {email.subject}
        </Text>
        <Stack spacing="1" direction="row" itemAlign="center">
          <Phone size={12} />
          <Text type="xs" color="muted">
            Kontakt in der Mail: {SUPPORT_CONTACT.name}, {SUPPORT_CONTACT.phone}
          </Text>
        </Stack>
        <Stack spacing="2" direction="row">
          <Button label={copied ? 'Kopiert!' : 'Mail kopieren'} variant="default" onClick={handleCopy} fullWidth />
          <a href={mailto} target="_blank" rel="noreferrer" className="w-full">
            <Button label="Im Mailprogramm" variant="outline" fullWidth disabled={!email.to} />
          </a>
        </Stack>
        <Button label={showPreview ? 'Vorschau ausblenden' : 'Vorschau anzeigen'} variant="ghost" size="sm" onClick={() => setShowPreview(v => !v)} />
        {showPreview && <EmailPreview html={email.html} />}
      </Stack>
    </Stack>
  );
};

const ReturningCustomerView: React.FC<{ info: FirstOrderInfo }> = ({ info }) => (
  <Stack spacing="3" direction="column">
    <Stack spacing="2" direction="row" itemAlign="center">
      <Repeat size={18} color="#2722F8" />
      <Text type="small" weight="semibold">
        Wiederkehrender Kunde
      </Text>
      <Badge variant="secondary" label={`${info.orderCount} Bestellungen`} />
    </Stack>
    <Text type="xs" color="muted">
      {[info.firstName, info.lastName].filter(Boolean).join(' ') || info.company} hat schon vor diesem Auftrag bestellt
      {info.firstOrderNumber ? `: erste Bestellung ${info.firstOrderNumber}` : ''}
      {info.firstOrderDate ? ` vom ${formatDate(info.firstOrderDate)}` : ''}.
    </Text>
  </Stack>
);

const FirstOrderPanePage: React.FC<{ appBridge: AppBridge }> = ({ appBridge }) => {
  const [salesOrderId, setSalesOrderId] = useState<string>('');
  const [result, setResult] = useState<{ salesOrderId: string; state: LoadState } | null>(null);

  useEffect(() => {
    appBridge.method.call<string>('getCurrentSalesOrderId').then(id => setSalesOrderId(id ?? ''));
    return appBridge.event.subscribe('SalesOrderChanged', (data: unknown) => {
      setSalesOrderId((data as { salesOrderId?: string }).salesOrderId ?? '');
    });
  }, [appBridge]);

  useEffect(() => {
    if (!salesOrderId) return;
    let active = true;
    loadFirstOrderInfo(appBridge, salesOrderId)
      .then(info => active && setResult({ salesOrderId, state: { status: 'done', info } }))
      .catch(
        (err: unknown) =>
          active && setResult({ salesOrderId, state: { status: 'error', message: err instanceof Error ? err.message : String(err) } }),
      );
    return () => {
      active = false;
    };
  }, [appBridge, salesOrderId]);

  const state: LoadState = !salesOrderId
    ? { status: 'idle' }
    : result?.salesOrderId === salesOrderId
      ? result.state
      : { status: 'loading' };

  return (
    <Box className="p-4">
      {state.status === 'idle' && (
        <Stack spacing="2" direction="column" itemAlign="center">
          <ShoppingBag size={32} color="#2722F8" strokeWidth={1.5} />
          <Text type="small" weight="semibold" align="center">
            Erstbestellungen erkennen
          </Text>
          <Text type="xs" color="muted" align="center">
            Wählen Sie eine Bestellung aus. Ist es die erste Bestellung des Kunden, erscheint hier eine Willkommensmail.
          </Text>
        </Stack>
      )}
      {state.status === 'loading' && (
        <Stack spacing="3" direction="column">
          <Skeleton variant="card" />
          <Skeleton variant="text" />
          <Skeleton variant="text" />
        </Stack>
      )}
      {state.status === 'error' && <Alert variant="destructive" title="Bestellung konnte nicht geladen werden" description={state.message} />}
      {state.status === 'done' && state.info.orderCount === null && (
        <Stack spacing="2" direction="row" itemAlign="center">
          <UserX size={18} />
          <Text type="xs" color="muted">
            Gastbestellung ohne Kundenkonto. Ob es die erste Bestellung ist, lässt sich nicht feststellen.
          </Text>
        </Stack>
      )}
      {state.status === 'done' && state.info.orderCount !== null &&
        (state.info.isFirstOrder ? <FirstOrderView info={state.info} /> : <ReturningCustomerView info={state.info} />)}
    </Box>
  );
};

export default FirstOrderPanePage;
