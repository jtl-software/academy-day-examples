import { Card, CardHeader, CardTitle, CardDescription, CardContent, Text, Stack, Separator, Box, Link } from '@jtl-software/platform-ui-react';
import { Rocket, ExternalLink, MonitorSmartphone } from 'lucide-react';

const manifestMapping = [{ field: 'capabilities.hub.appLauncher.redirectUrl', description: 'Opens this page in a new browser tab' }];

const HubPage: React.FC = () => {
  return (
    <Box className="flex justify-center p-12">
      <Card className="max-w-[520px] w-full">
        <CardHeader className="items-center">
          <Rocket size={40} color="#1a56db" strokeWidth={1.5} />
          <CardTitle>Launched from Hub</CardTitle>
          <CardDescription className="text-center">
            This page opens when a user clicks your app card in the JTL-Cloud Hub. It runs in a full browser tab, not inside the ERP iframe.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Stack spacing="5" direction="column">
            <Stack spacing="3" direction="column">
              <Text type="xs" weight="semibold" color="muted">
                MANIFEST MAPPING
              </Text>
              {manifestMapping.map(mapping => (
                <Stack key={mapping.field} spacing="3" direction="row" itemAlign="start">
                  <ExternalLink size={16} color="#1a56db" className="shrink-0 mt-0.5" />
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
              <Text type="xs" weight="semibold" color="muted">
                HOW THIS DIFFERS
              </Text>
              <Stack spacing="3" direction="row" itemAlign="start">
                <MonitorSmartphone size={16} color="#1a56db" className="shrink-0 mt-0.5" />
                <Text type="small" color="muted">
                  Unlike <Text type="inline-code">/erp</Text> and <Text type="inline-code">/pane</Text>, this page runs outside the ERP — there is no
                  AppBridge available. Use this for standalone features like dashboards, settings, or onboarding flows.
                </Text>
              </Stack>
            </Stack>

            <Separator />

            <Stack spacing="3" direction="column">
              <Text type="xs" weight="semibold" color="muted">
                NEXT STEPS
              </Text>
              <Text type="small" color="muted">
                Replace this page with your app's main standalone experience — a dashboard, configuration panel, or landing page.
              </Text>
              <Link url="https://hub.jtl-cloud.com/" target="_blank">
                Open JTL-Cloud Hub
              </Link>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default HubPage;
