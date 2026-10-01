import { Button, Input, Stack, Text, Separator, Box, Badge } from '@jtl-software/platform-ui-react';
import { useState, useEffect, useCallback } from 'react';
import IPanePageProps from './IPanePageProps';
import { PanelRight } from 'lucide-react';

const manifestFields = [
  { label: 'url', value: 'capabilities.erp.pane[].url' },
  { label: 'context', value: 'customers' },
  { label: 'matchChildContext', value: 'true' },
];

const PanePage: React.FC<IPanePageProps> = ({ appBridge }) => {
  const [customer, setCustomer] = useState<string | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = appBridge.event.subscribe('CustomerChanged', (data: unknown) => {
      return new Promise<void>(resolve => {
        setCustomer((data as { customerId: string }).customerId);
        resolve();
      });
    });

    return () => {
      unsubscribe();
    };
  }, [appBridge]);

  const handleGetCurrentCustomer = useCallback(() => {
    appBridge.method.call('getCurrentCustomerId').then(customerId => {
      setCustomer(customerId as string);
    });
  }, [appBridge]);

  return (
    <Box className="p-4">
      <Stack spacing="4" direction="column">
        <Stack spacing="2" direction="column" itemAlign="center">
          <PanelRight size={32} color="#1a56db" strokeWidth={1.5} />
          <Text type="h4" align="center">
            Customer Pane
          </Text>
          <Text type="xs" color="muted" align="center">
            This sidebar panel loads when the user views customer data. It receives context events from the ERP.
          </Text>
        </Stack>

        <Separator />

        <Stack spacing="2" direction="column">
          <Text type="xs" weight="semibold" color="muted">
            MANIFEST MAPPING
          </Text>
          {manifestFields.map(field => (
            <Stack key={field.label} spacing="2" direction="row" itemAlign="center">
              <Badge variant="outline" label={field.label} />
              <Text type="xs" color="muted">
                {field.value}
              </Text>
            </Stack>
          ))}
        </Stack>

        <Separator />

        <Stack spacing="3" direction="column">
          <Stack spacing="2" direction="row" itemAlign="center">
            <Text type="small" weight="semibold">
              DEMO: Events
            </Text>
            <Badge variant="default" label="Listening" />
          </Stack>
          <Text type="xs" color="muted">
            The AppBridge sends a CustomerChanged event when the user selects a different customer.
          </Text>
          <Input disabled value={customer} placeholder="No customer selected" />
          <Button variant="outline" onClick={handleGetCurrentCustomer} label="Get Current Customer" />
          <Text type="xs" color="muted" align="center">
            <Text type="inline-code">{"appBridge.event.subscribe('CustomerChanged', ...)"}</Text>
          </Text>
        </Stack>
      </Stack>
    </Box>
  );
};

export default PanePage;
