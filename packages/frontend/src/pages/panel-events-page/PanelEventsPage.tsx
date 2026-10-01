import { useCallback, useEffect, useState } from 'react';
import { Badge, Box, Button, Separator, Stack, Text } from '@jtl-software/platform-ui-react';
import { Activity } from 'lucide-react';
import IPanelEventsPageProps from './IPanelEventsPageProps';

type LogEntry = { source: string; detail: string };

/**
 * Panel demo: a panel reacts to what the user does in the ERP page it is docked to. The App Bridge
 * pushes events (the user selected a different customer) and lets the panel pull the current context
 * on demand. This page subscribes to `CustomerChanged` and logs what it receives.
 */
const PanelEventsPage: React.FC<IPanelEventsPageProps> = ({ appBridge }) => {
  const [customerId, setCustomerId] = useState<string | undefined>(undefined);
  const [log, setLog] = useState<LogEntry[]>([]);

  const addLog = useCallback((entry: LogEntry) => setLog(prev => [entry, ...prev]), []);

  useEffect(() => {
    // The ERP publishes CustomerChanged whenever the user selects a different customer.
    const unsubscribe = appBridge.event.subscribe('CustomerChanged', (data: unknown) => {
      const id = (data as { customerId?: string }).customerId;
      setCustomerId(id);
      addLog({ source: 'CustomerChanged', detail: id ?? '(none)' });
    });
    return () => unsubscribe();
  }, [appBridge, addLog]);

  const getCurrentCustomer = useCallback(async () => {
    const id = (await appBridge.method.call('getCurrentCustomerId')) as string | undefined;
    setCustomerId(id);
    addLog({ source: 'getCurrentCustomerId', detail: id ?? '(none)' });
  }, [appBridge, addLog]);

  return (
    <Box className="p-4">
      <Stack spacing="4" direction="column">
        <Stack spacing="2" direction="column" itemAlign="center">
          <Activity size={32} color="#1a56db" strokeWidth={1.5} />
          <Text type="h4" align="center">
            Panel Events
          </Text>
          <Text type="xs" color="muted" align="center">
            A panel reacts to what the user does in the ERP: the App Bridge delivers events, and lets you pull the current context on demand.
          </Text>
        </Stack>

        <Separator />

        <Stack spacing="2" direction="column">
          <Text type="xs" weight="semibold" color="muted">
            SELECTED CUSTOMER
          </Text>
          <Stack spacing="2" direction="row" itemAlign="center">
            <Badge variant={customerId ? 'default' : 'outline'} label={customerId ?? 'none'} />
            <Button variant="outline" onClick={getCurrentCustomer} label="Get current customer" />
          </Stack>
          <Text type="xs" color="muted">
            <Text type="inline-code">{"appBridge.method.call('getCurrentCustomerId')"}</Text>
          </Text>
        </Stack>

        <Separator />

        <Stack spacing="2" direction="column">
          <Stack spacing="2" direction="row" itemAlign="center">
            <Text type="small" weight="semibold">
              EVENT LOG
            </Text>
            <Badge variant="default" label="Listening" />
          </Stack>
          <Text type="xs" color="muted">
            <Text type="inline-code">{"appBridge.event.subscribe('CustomerChanged', ...)"}</Text>
          </Text>
          {log.length === 0 ? (
            <Text type="small" color="muted">
              No events yet. Select a customer in the ERP.
            </Text>
          ) : (
            <Stack spacing="1" direction="column">
              {log.map((entry, i) => (
                <div key={i} className="w-full p-2 rounded" style={{ background: 'var(--base-muted)' }}>
                  <Text type="xs">
                    <Text type="inline-code">{entry.source}</Text> → {entry.detail}
                  </Text>
                </div>
              ))}
            </Stack>
          )}
        </Stack>
      </Stack>
    </Box>
  );
};

export default PanelEventsPage;
