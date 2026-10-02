import { useEffect, useState } from 'react';
import { Box, Stack, Text } from '@jtl-software/platform-ui-react';
import { TriangleAlert } from 'lucide-react';
import { apiUrl } from './constants';

type HealthResponse = {
  status: 'ok' | 'misconfigured';
  missing: string[];
};

const POLL_INTERVAL_MS = 5000;

const ConfigWarningBanner: React.FC = () => {
  const [missing, setMissing] = useState<string[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    const check = async (): Promise<void> => {
      try {
        const res = await fetch(`${apiUrl}/health`);
        if (!res.ok) return;
        const data = (await res.json()) as HealthResponse;
        if (cancelled) return;
        setMissing(data.status === 'misconfigured' ? data.missing : null);
      } catch {
        // Backend not reachable yet (still starting). Try again on the next tick.
      }
    };

    void check();
    const id = window.setInterval(check, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  if (!missing || missing.length === 0) return null;

  return (
    <Box
      className="border-b border-amber-300 bg-amber-50 px-4 py-3 text-amber-900"
      role="alert"
    >
      <Stack spacing="3" direction="row" itemAlign="start">
        <TriangleAlert size={20} color="#b45309" strokeWidth={2} />
        <Stack spacing="1" direction="column">
          <Text type="small" weight="semibold">
            Backend is missing credentials: {missing.join(', ')}
          </Text>
          <Text type="xs">
            Every JTL API call will fail until you add these to{' '}
            <code className="rounded bg-amber-100 px-1 py-0.5">packages/backend/.env</code> (Node) or{' '}
            <code className="rounded bg-amber-100 px-1 py-0.5">appsettings.Local.json</code> (.NET).
            Get the values from the{' '}
            <a
              href="https://partner.jtl-cloud.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Partner Portal
            </a>{' '}
            under your app's <strong>Client credentials</strong>, then restart the backend.
          </Text>
        </Stack>
      </Stack>
    </Box>
  );
};

export default ConfigWarningBanner;