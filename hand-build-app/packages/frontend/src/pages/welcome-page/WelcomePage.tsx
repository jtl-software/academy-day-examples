import { Card, CardHeader, CardTitle, CardDescription, CardContent, Text, Badge, Stack, Separator, Box, Link } from '@jtl-software/platform-ui-react';
import { CircleCheck, CircleAlert, Globe, UserPlus, KeyRound, CloudDownload, Settings, PanelRight } from 'lucide-react';

const routes = [
  { path: '/setup', icon: Settings, description: 'Initial app setup and tenant connection' },
  { path: '/erp', icon: Globe, description: 'ERP integration and data display' },
  { path: '/pane', icon: PanelRight, description: 'Context-aware customer sidebar panel' },
  { path: '/user-example', icon: KeyRound, description: 'Read the signed-in user from the token (claims, access token, userinfo)' },
];

const gettingStartedSteps = [
  {
    icon: UserPlus,
    title: 'Register your app',
    description: 'Create your app in the Partner Portal and get your Client ID and Secret.',
    linkUrl: 'https://partner.jtl-cloud.com/',
    linkLabel: 'Open Partner Portal',
  },
  {
    icon: KeyRound,
    title: 'Configure environment',
    description: 'Add your credentials to packages/backend/.env',
  },
  {
    icon: CloudDownload,
    title: 'Install in JTL-Cloud',
    description: "Open the Hub, find your app under 'Apps in development', and install it.",
    linkUrl: 'https://hub.jtl-cloud.com/',
    linkLabel: 'Open JTL-Cloud Hub',
  },
];

const RoutesList: React.FC = () => (
  <Stack spacing="3" direction="column">
    <Text type="xs" weight="semibold" color="muted">
      APP ROUTES
    </Text>
    {routes.map(route => (
      <Link key={route.path} url={route.path} isMonochrome>
        <Stack spacing="3" direction="row" itemAlign="center">
          <Badge variant="outline" label={route.path} />
          <Text type="small" color="muted">
            {route.description}
          </Text>
        </Stack>
      </Link>
    ))}
  </Stack>
);

const StandaloneWelcome: React.FC = () => (
  <Card className="max-w-[520px] w-full">
    <CardHeader className="items-center">
      <CircleAlert size={40} color="#f59e0b" strokeWidth={1.5} />
      <CardTitle>App is not connected</CardTitle>
      <CardDescription className="text-center">No AppBridge detected. The app is running locally outside the JTL Platform.</CardDescription>
    </CardHeader>
    <CardContent>
      <Stack spacing="5" direction="column">
        <Stack spacing="4" direction="column">
          <Text type="xs" weight="semibold" color="muted">
            GET STARTED
          </Text>
          {gettingStartedSteps.map((step, i) => (
            <Stack key={step.title} spacing="3" direction="row" itemAlign="start">
              <Badge variant="outline" label={String(i + 1)} />
              <Stack spacing="1" direction="column">
                <Text type="small" weight="medium">
                  {step.title}
                </Text>
                <Text type="xs" color="muted">
                  {step.description}
                </Text>
                {step.linkUrl && (
                  <Link url={step.linkUrl} target="_blank">
                    {step.linkLabel}
                  </Link>
                )}
              </Stack>
            </Stack>
          ))}
        </Stack>

        <Separator />

        <RoutesList />
      </Stack>
    </CardContent>
  </Card>
);

const ConnectedWelcome: React.FC = () => (
  <Card className="max-w-[520px] w-full">
    <CardHeader className="items-center">
      <CircleCheck size={40} color="#10b981" strokeWidth={1.5} />
      <CardTitle>App is connected</CardTitle>
      <CardDescription className="text-center">The AppBridge is active and your app is running inside the JTL Platform.</CardDescription>
    </CardHeader>
    <CardContent>
      <Stack spacing="5" direction="column">
        <RoutesList />

        <Separator />

        <Stack spacing="3" direction="column">
          <Text type="xs" weight="semibold" color="muted">
            STATUS
          </Text>
          <Stack spacing="2" direction="row" itemAlign="center">
            <Text type="small">AppBridge:</Text>
            <Badge variant="default" label="Connected" icon="check" />
          </Stack>
          <Stack spacing="2" direction="row" itemAlign="center">
            <Text type="small">Mode:</Text>
            <Text type="small" color="muted">
              ERP Embedded
            </Text>
          </Stack>
          <Text type="xs" color="muted">
            Navigate using the ERP menu to access app features.
          </Text>
        </Stack>
      </Stack>
    </CardContent>
  </Card>
);

const WelcomePage: React.FC<{ connected?: boolean }> = ({ connected = false }) => {
  return <Box className="flex justify-center p-12">{connected ? <ConnectedWelcome /> : <StandaloneWelcome />}</Box>;
};

export default WelcomePage;
