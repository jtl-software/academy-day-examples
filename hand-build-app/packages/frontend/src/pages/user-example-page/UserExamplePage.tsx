import { useEffect, useState } from 'react';
import { Badge, Box, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Separator, Stack, Text } from '@jtl-software/platform-ui-react';
import { ShieldCheck } from 'lucide-react';
import { fetchUserInfo, useJtlAuth } from '@jtl-software/cloud-apps-auth';

const issuer = import.meta.env.VITE_JTL_ISSUER ?? '';
// `npm run register` sets this when a node backend is present; the backend-verify demo stays hidden otherwise.
const backendUrl = import.meta.env.VITE_BACKEND_URL;

/** Pretty-printed JSON in a scrollable box, for token claims and API responses. */
const JsonBlock: React.FC<{ value: unknown }> = ({ value }) => (
  <Box className="max-h-48 overflow-auto rounded bg-gray-50 p-2">
    <pre className="whitespace-pre-wrap break-all font-mono text-xs text-gray-700">{JSON.stringify(value, null, 2)}</pre>
  </Box>
);

/** Example page showing how to read the signed-in user from the token: id-token claims, the access
 * token, and the /userinfo response. Reached only behind RequireJtlAuth, so a user exists. */
const UserExamplePage: React.FC = () => {
  const { user } = useJtlAuth();
  const accessToken = user?.access_token;

  const [userInfo, setUserInfo] = useState<Record<string, unknown> | null>(null);
  const [userInfoError, setUserInfoError] = useState<string | null>(null);

  const [verifyResult, setVerifyResult] = useState<unknown>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (!accessToken || !issuer) return;
    let cancelled = false;
    // Reset both so a later success can't keep showing a stale error, and vice versa.
    setUserInfo(null);
    setUserInfoError(null);
    fetchUserInfo(issuer, accessToken)
      .then(info => !cancelled && setUserInfo(info))
      .catch(err => !cancelled && setUserInfoError(err instanceof Error ? err.message : String(err)));
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  if (!user) return null;
  const { profile } = user;

  // Send the access token to the backend, which verifies it against the JTL IdP and returns the claims.
  const verifyInBackend = async () => {
    if (!accessToken || !backendUrl) return;
    setVerifying(true);
    setVerifyResult(null);
    try {
      const res = await fetch(`${backendUrl}/verify-token`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setVerifyResult(await res.json());
    } catch (err) {
      setVerifyResult({ error: err instanceof Error ? err.message : String(err) });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Box className="flex justify-center p-12">
      <Card className="max-w-[520px] w-full">
        <CardHeader className="items-center">
          <ShieldCheck size={40} color="#10b981" strokeWidth={1.5} />
          <CardTitle>Signed in</CardTitle>
          <CardDescription className="text-center">{profile.name ?? profile.email ?? profile.sub ?? 'Authenticated user'}</CardDescription>
        </CardHeader>
        <CardContent>
          <Stack spacing="5" direction="column">
            <Stack spacing="3" direction="column">
              <Text type="xs" weight="semibold" color="muted">
                ID TOKEN CLAIMS
              </Text>
              {profile.email && (
                <Stack spacing="2" direction="row" itemAlign="center">
                  <Badge variant="outline" label="email" />
                  <Text type="small" color="muted">
                    {profile.email}
                  </Text>
                </Stack>
              )}
              {profile.sub && (
                <Stack spacing="2" direction="row" itemAlign="center">
                  <Badge variant="outline" label="sub" />
                  <Text type="small" color="muted">
                    {profile.sub}
                  </Text>
                </Stack>
              )}
            </Stack>

            <Separator />

            <Stack spacing="2" direction="column">
              <Text type="xs" weight="semibold" color="muted">
                ACCESS TOKEN
              </Text>
              <Box className="max-h-32 overflow-auto rounded bg-gray-50 p-2">
                <Text type="inline-code">{accessToken}</Text>
              </Box>
            </Stack>

            <Separator />

            <Stack spacing="2" direction="column">
              <Text type="xs" weight="semibold" color="muted">
                USERINFO
              </Text>
              {userInfoError ? (
                <Text type="small" color="danger">
                  {userInfoError}
                </Text>
              ) : userInfo ? (
                <JsonBlock value={userInfo} />
              ) : (
                <Text type="small" color="muted">
                  Loading…
                </Text>
              )}
            </Stack>

            {backendUrl && (
              <>
                <Separator />
                <Stack spacing="2" direction="column">
                  <Text type="xs" weight="semibold" color="muted">
                    BACKEND VERIFICATION
                  </Text>
                  <Text type="xs" color="muted">
                    Sends the access token to your backend, which verifies its signature and issuer against the JTL IdP.
                  </Text>
                  <Button label={verifying ? 'Verifying…' : 'Verify token in backend'} variant="default" disabled={verifying} onClick={verifyInBackend} />
                  {verifyResult != null && <JsonBlock value={verifyResult} />}
                </Stack>
              </>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default UserExamplePage;
