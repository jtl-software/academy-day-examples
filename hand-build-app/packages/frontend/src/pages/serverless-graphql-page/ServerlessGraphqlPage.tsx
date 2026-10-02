import { useCallback } from 'react';
import { GraphQLClient } from 'graphql-request';
import IServerlessGraphqlPageProps from './IServerlessGraphqlPageProps';
import QueryDemo from '../../common/QueryDemo';
import { jtlApiUrl } from '../../common/constants';

/**
 * Serverless demo: the frontend calls the JTL ERP GraphQL API directly with the app token from
 * `getAppToken`, no backend involved. The token is scoped to this user, tenant and app, so the API
 * knows who is calling. Use this when your app has no server of its own.
 */
const ServerlessGraphqlPage: React.FC<IServerlessGraphqlPageProps> = ({ appBridge }) => {
  const request = useCallback(
    async (query: string) => {
      const { accessToken } = await appBridge.method.call<{ accessToken: string }>('getAppToken');
      const client = new GraphQLClient(`${jtlApiUrl}/erp/v2/graphql`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return client.request<Record<string, unknown>>(query);
    },
    [appBridge],
  );

  return (
    <QueryDemo
      title="GraphQL Demo (Serverless)"
      description="Queries the JTL ERP GraphQL API directly from the browser with the app token - no backend."
      request={request}
    />
  );
};

export default ServerlessGraphqlPage;
