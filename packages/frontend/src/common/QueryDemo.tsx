import { useCallback, useState } from 'react';
import { Box, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Separator, Stack, Text } from '@jtl-software/platform-ui-react';
import { BarChart3, Database, Package, ShoppingCart } from 'lucide-react';
import { gql } from 'graphql-request';

/** The example ERP queries both demos run. They need the `items.read` and `salesorders.read` scopes. */
const QUERIES = {
  topItems: gql`query TopItems {
    QueryItems(first: 5, order: [{ stockInOrders: DESC }]) {
      totalCount
      nodes {
        sku
        name
        stockInOrders
        salesPriceGross
      }
    }
  }`,
  recentOrders: gql`query RecentOrders {
    QuerySalesOrders(first: 5, order: [{ salesOrderDate: DESC }]) {
      totalCount
      nodes {
        salesOrderNumber
        salesOrderDate
        totalGrossAmount
        currencyIso
        companyName
      }
    }
  }`,
  stockOverview: gql`query StockOverview {
    QueryItems(first: 5, order: [{ stockTotal: DESC }]) {
      totalCount
      nodes {
        sku
        name
        stockTotal
        stockAvailable
        stockInOrders
      }
    }
  }`,
};

type QueryKey = keyof typeof QUERIES;

const QUERY_META: Record<QueryKey, { label: string; icon: React.FC<{ size?: number; color?: string; strokeWidth?: number; className?: string }> }> = {
  topItems: { label: 'Top Items by Orders', icon: ShoppingCart },
  recentOrders: { label: 'Recent Sales Orders', icon: BarChart3 },
  stockOverview: { label: 'Stock Overview', icon: Package },
};

const formatValue = (value: unknown): string => {
  if (value == null) return '–';
  if (typeof value === 'number') return value.toLocaleString('de-DE');
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return new Date(value).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
  return String(value);
};

/** Runs the shared ERP queries and renders the results. `request` is the transport each demo supplies:
 *  the client-server demo posts to its backend, the serverless demo calls the JTL API directly. */
const QueryDemo: React.FC<{ title: string; description: React.ReactNode; request: (query: string) => Promise<Record<string, unknown>> }> = ({ title, description, request }) => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<QueryKey | null>(null);
  const [results, setResults] = useState<Record<string, unknown>>({});

  const runQuery = useCallback(
    async (key: QueryKey) => {
      setLoading(key);
      setError(null);
      try {
        const data = await request(QUERIES[key]);
        setResults(prev => ({ ...prev, [key]: data }));
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(null);
      }
    },
    [request],
  );

  const renderResult = (key: QueryKey) => {
    const data = results[key] as Record<string, { totalCount: number; nodes: Record<string, unknown>[] }> | undefined;
    if (!data) return null;

    const queryResult = Object.values(data)[0];
    if (!queryResult?.nodes?.length) {
      return (
        <Text type="small" color="muted">
          No results found.
        </Text>
      );
    }

    const columns = Object.keys(queryResult.nodes[0]);

    return (
      <Stack spacing="2" direction="column">
        <Text type="xs" color="muted">
          {queryResult.totalCount} total results — showing first {queryResult.nodes.length}
        </Text>
        <Box className="w-full overflow-x-auto">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr>
                {columns.map(col => (
                  <th key={col} style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid var(--base-border)', fontWeight: 600 }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {queryResult.nodes.map((node, i) => (
                <tr key={i}>
                  {columns.map(col => (
                    <td key={col} style={{ padding: '6px 8px', borderBottom: '1px solid var(--base-border)' }}>
                      {formatValue(node[col])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
      </Stack>
    );
  };

  return (
    <Box className="flex justify-center p-12">
      <Card className="max-w-[720px] w-full">
        <CardHeader className="items-center">
          <Database size={40} color="#1a56db" strokeWidth={1.5} />
          <CardTitle>{title}</CardTitle>
          <CardDescription className="text-center">{description}</CardDescription>
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

            <Separator />

            {(Object.keys(QUERIES) as QueryKey[]).map(key => {
              const meta = QUERY_META[key];
              const Icon = meta.icon;

              return (
                <Stack key={key} spacing="3" direction="column">
                  <Stack spacing="2" direction="row" itemAlign="center">
                    <Icon size={16} color="#1a56db" className="shrink-0" />
                    <Text type="small" weight="semibold">
                      {meta.label}
                    </Text>
                  </Stack>
                  <div className="w-full p-3 rounded-lg" style={{ background: 'var(--base-muted)', fontFamily: 'monospace', fontSize: '0.75rem', whiteSpace: 'pre', overflowX: 'auto' }}>
                    {QUERIES[key].trim()}
                  </div>
                  <Button onClick={() => runQuery(key)} disabled={loading !== null} label={loading === key ? 'Loading...' : 'Run Query'} />
                  {renderResult(key)}
                  <Separator />
                </Stack>
              );
            })}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default QueryDemo;
