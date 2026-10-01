import { useCallback, useEffect, useState } from 'react';
import IErpPageProps from './IErpPageProps';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Separator,
  Stack,
  Text,
} from '@jtl-software/platform-ui-react';
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
  ordersWithItems: number;
  totalOrderCount: number;
  articles: Article[];
}

const ErpPage: React.FC<IErpPageProps> = ({ appBridge }) => {
  const [data, setData] = useState<SoldGoods | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const { accessToken } = await appBridge.method.call<{ accessToken: string }>('getAppToken');
      const response = await fetch(`${apiUrl}/sold-goods`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) {
        const body = await response.text();
        throw new Error(`${response.status}: ${body}`);
      }
      setData((await response.json()) as SoldGoods);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [appBridge]);

  useEffect((): void => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch the dashboard data on mount
    void load();
  }, [load]);

  const money = (value: number, currency: string): string =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: currency || 'EUR' }).format(value);
  const number = (value: number): string => value.toLocaleString('de-DE', { maximumFractionDigits: 2 });

  return (
    <Box className="flex justify-center p-8">
      <Box className="max-w-[860px] w-full flex flex-col gap-5">
        <Card>
          <CardHeader className="items-center">
            <PackageCheck size={40} color="#1a56db" strokeWidth={1.5} />
            <CardTitle>Einkaufswert der verkauften Waren</CardTitle>
            <CardDescription className="text-center">
              Absoluter (summierter) tatsächlicher Einkaufswert der verkauften Artikel: Summe aus
              Menge × Einkaufspreis (netto) je Position, über die letzten {data?.ordersConsidered ?? '…'} Aufträge.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Stack spacing="5" direction="column">
              {error && (
                <Box className="w-full p-3 rounded-lg bg-red-50 border border-red-200">
                  <Text type="small" color="danger">
                    {error}
                  </Text>
                </Box>
              )}

              <div
                className="w-full p-6 rounded-xl border border-[var(--base-border)] flex flex-col items-center gap-1"
                style={{ background: 'var(--base-muted)' }}
              >
                <Text type="xs" weight="semibold" color="muted">
                  GESAMTER EINKAUFSWERT (NETTO)
                </Text>
                <Text type="h1" weight="bold">
                  {loading && !data ? '…' : data ? money(data.totalPurchaseValueNet, data.currencyIso) : '–'}
                </Text>
                {data && (
                  <Text type="xs" color="muted">
                    {data.ordersWithItems} von {data.ordersConsidered} geladenen Aufträgen mit Positionen
                    {data.totalOrderCount > data.ordersConsidered ? ` (${data.totalOrderCount} Aufträge insgesamt)` : ''}
                  </Text>
                )}
              </div>

              <Button onClick={() => void load()} disabled={loading} label={loading ? 'Lädt…' : 'Aktualisieren'} icon="RefreshCw" />
            </Stack>
          </CardContent>
        </Card>

        {data && data.articles.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Je Artikel</CardTitle>
              <CardDescription>Absteigend nach Einkaufswert der verkauften Menge.</CardDescription>
            </CardHeader>
            <CardContent>
              <Separator />
              <Box className="w-full overflow-x-auto">
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      {['SKU', 'Artikel', 'Verkaufte Menge', 'Einkaufspreis (netto)', 'Einkaufswert (netto)'].map((col, idx) => (
                        <th
                          key={col}
                          style={{
                            textAlign: idx >= 2 ? 'right' : 'left',
                            padding: '8px',
                            borderBottom: '1px solid var(--base-border)',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.articles.map((a, i) => (
                      <tr key={a.sku || a.name || i}>
                        <td style={{ padding: '8px', borderBottom: '1px solid var(--base-border)', whiteSpace: 'nowrap' }}>{a.sku || '–'}</td>
                        <td style={{ padding: '8px', borderBottom: '1px solid var(--base-border)' }}>{a.name || '–'}</td>
                        <td style={{ padding: '8px', borderBottom: '1px solid var(--base-border)', textAlign: 'right' }}>{number(a.quantitySold)}</td>
                        <td style={{ padding: '8px', borderBottom: '1px solid var(--base-border)', textAlign: 'right' }}>{money(a.purchasePriceNet, data.currencyIso)}</td>
                        <td style={{ padding: '8px', borderBottom: '1px solid var(--base-border)', textAlign: 'right', fontWeight: 600 }}>{money(a.purchaseValueNet, data.currencyIso)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            </CardContent>
          </Card>
        )}

        {data && data.articles.length === 0 && !loading && (
          <Text type="small" color="muted" align="center">
            Keine verkauften Artikelpositionen in den geladenen Aufträgen gefunden.
          </Text>
        )}
      </Box>
    </Box>
  );
};

export default ErpPage;
