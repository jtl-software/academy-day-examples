import { Box, Stack, Text, Separator } from '@jtl-software/platform-ui-react';
import { useState, useEffect, useCallback } from 'react';
import IPanePageProps from './IPanePageProps';
import { PackageCheck } from 'lucide-react';
import { apiUrl } from '../../common/constants';

interface Article {
  sku: string;
  name: string;
  quantitySold: number;
  purchasePriceNet: number;
  purchaseValueNet: number;
}

interface SoldGoods {
  totalPurchaseValueNet: number;
  currencyIso: string;
  ordersConsidered: number;
  ordersScanned: number;
  articles: Article[];
}

const PanePage: React.FC<IPanePageProps> = ({ appBridge }) => {
  const [customer, setCustomer] = useState<string | undefined>(undefined);
  const [data, setData] = useState<SoldGoods | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (customerId: string): Promise<void> => {
      setLoading(true);
      setError(null);
      setData(null);
      try {
        const { accessToken } = await appBridge.method.call<{ accessToken: string }>('getAppToken');
        const response = await fetch(`${apiUrl}/sold-goods`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ customerId }),
        });
        if (!response.ok) throw new Error(`${response.status}: ${await response.text()}`);
        setData((await response.json()) as SoldGoods);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    },
    [appBridge],
  );

  // Pick up the customer already open when the panel mounts.
  useEffect(() => {
    appBridge.method.call('getCurrentCustomerId').then((id) => {
      if (typeof id === 'string' && id) setCustomer(id);
    });
  }, [appBridge]);

  // Follow the ERP's customer selection.
  useEffect(() => {
    const unsubscribe = appBridge.event.subscribe('CustomerChanged', (payload: unknown) =>
      Promise.resolve().then(() => {
        setCustomer((payload as { customerId: string }).customerId);
      }),
    );
    return () => {
      unsubscribe();
    };
  }, [appBridge]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch the panel data when the selected customer changes
    if (customer) void load(customer);
  }, [customer, load]);

  const money = (value: number, currency: string): string =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: currency || 'EUR' }).format(value);
  const number = (value: number): string => value.toLocaleString('de-DE', { maximumFractionDigits: 2 });

  return (
    <Box className="p-4">
      <Stack spacing="4" direction="column">
        <Stack spacing="2" direction="column" itemAlign="center">
          <PackageCheck size={32} color="#1a56db" strokeWidth={1.5} />
          <Text type="h4" align="center">
            Einkaufswert verkaufter Waren
          </Text>
          <Text type="xs" color="muted" align="center">
            Tatsächlicher Einkaufswert (netto) der an diesen Kunden verkauften Artikel: Summe aus Menge × Einkaufspreis je Position.
          </Text>
        </Stack>

        <Separator />

        {!customer && (
          <Text type="small" color="muted" align="center">
            Kein Kunde ausgewählt.
          </Text>
        )}

        {error && (
          <Box className="w-full p-3 rounded-lg bg-red-50 border border-red-200">
            <Text type="xs" color="danger">
              {error}
            </Text>
          </Box>
        )}

        {customer && (
          <div className="w-full p-4 rounded-xl border border-[var(--base-border)] flex flex-col items-center gap-1" style={{ background: 'var(--base-muted)' }}>
            <Text type="xs" weight="semibold" color="muted">
              EINKAUFSWERT (NETTO)
            </Text>
            <Text type="h2" weight="bold">
              {loading ? '…' : data ? money(data.totalPurchaseValueNet, data.currencyIso) : '–'}
            </Text>
            {data && (
              <Text type="xs" color="muted">
                {data.ordersConsidered} Aufträge dieses Kunden (in {data.ordersScanned} geprüften)
              </Text>
            )}
          </div>
        )}

        {data && data.articles.length > 0 && (
          <Stack spacing="2" direction="column">
            <Text type="xs" weight="semibold" color="muted">
              TOP-ARTIKEL NACH EINKAUFSWERT
            </Text>
            {data.articles.slice(0, 5).map((a, i) => (
              <Box key={a.sku || a.name || i} className="w-full">
                <Stack spacing="0" direction="row" justify="between" itemAlign="center">
                  <Stack spacing="0" direction="column">
                    <Text type="xs" weight="semibold">
                      {a.name || a.sku || '–'}
                    </Text>
                    <Text type="xs" color="muted">
                      {number(a.quantitySold)} × {money(a.purchasePriceNet, data.currencyIso)}
                    </Text>
                  </Stack>
                  <Text type="xs" weight="semibold">
                    {money(a.purchaseValueNet, data.currencyIso)}
                  </Text>
                </Stack>
                <Separator />
              </Box>
            ))}
          </Stack>
        )}

        {data && data.articles.length === 0 && !loading && customer && (
          <Text type="xs" color="muted" align="center">
            Keine verkauften Artikelpositionen für diesen Kunden gefunden.
          </Text>
        )}
      </Stack>
    </Box>
  );
};

export default PanePage;
