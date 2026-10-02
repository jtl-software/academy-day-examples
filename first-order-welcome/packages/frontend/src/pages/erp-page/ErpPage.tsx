import { useCallback, useState } from 'react';
import IErpPageProps from './IErpPageProps';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Text,
  Badge,
  Stack,
  Separator,
  Box,
  Button,
} from '@jtl-software/platform-ui-react';
import { Globe, Link as LinkIcon } from 'lucide-react';

const manifestMappings = [{ icon: LinkIcon, field: 'capabilities.erp.menuItems[].url', description: 'Sidebar menu entry' }];

const ErpPage: React.FC<IErpPageProps> = ({ appBridge }) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const [time, setTime] = useState<string | null>(null);

  const handleRequestTimestamp = useCallback(async (): Promise<void> => {
    try {
      setIsRequesting(true);
      appBridge.method.expose('getCurrentTime', () => new Date());
      const result = await appBridge.method.call<Date>('getCurrentTime');
      setTime(result.toUTCString());
    } finally {
      setIsRequesting(false);
    }
  }, [appBridge]);

  return (
    <Box className="flex justify-center p-12">
      <Card className="max-w-[520px] w-full">
        <CardHeader className="items-center">
          <Globe size={40} color="#1a56db" strokeWidth={1.5} />
          <CardTitle>ERP Integration</CardTitle>
          <CardDescription className="text-center">
            This is the main app view. It loads when the user clicks your app's menu entry in the ERP sidebar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Stack spacing="5" direction="column">
            <Stack spacing="3" direction="column">
              <Text type="xs" weight="semibold" color="muted">
                MANIFEST MAPPING
              </Text>
              {manifestMappings.map(mapping => (
                <Stack key={mapping.field} spacing="3" direction="row" itemAlign="start">
                  <mapping.icon size={16} color="#1a56db" className="shrink-0 mt-0.5" />
                  <Stack spacing="0" direction="column">
                    <Text type="inline-code">{mapping.field}</Text>
                    <Text type="xs" color="muted">
                      → {mapping.description}
                    </Text>
                  </Stack>
                </Stack>
              ))}
            </Stack>

            <Separator />

            <Stack spacing="3" direction="column">
              <Stack spacing="2" direction="row" itemAlign="center">
                <Text type="small" weight="semibold">
                  DEMO: AppBridge Methods
                </Text>
                <Badge variant="default" label="Ready" />
              </Stack>
              <Text type="xs" color="muted">
                The AppBridge lets you expose and call methods between your app and the platform.
              </Text>
              <Button onClick={handleRequestTimestamp} label={isRequesting ? 'Requesting...' : 'Request Current Time'} />
              <Box className="w-full p-4 border border-dashed border-[var(--base-border)] rounded-lg flex items-center justify-center">
                <Text type="small" color="muted">
                  {time ?? 'Click the button to test'}
                </Text>
              </Box>
              <Text type="xs" color="muted" align="center">
                <Text type="inline-code">{"appBridge.method.call('getCurrentTime')"}</Text>
              </Text>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ErpPage;
