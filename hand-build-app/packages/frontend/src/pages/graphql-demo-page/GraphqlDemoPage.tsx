import { useCallback } from 'react';
import { GraphQLClient } from 'graphql-request';
import IGraphqlDemoPageProps from './IGraphqlDemoPageProps';
import QueryDemo from '../../common/QueryDemo';
import { apiUrl } from '../../common/constants';

/**
 * Client-server demo: the frontend sends the app token to its own backend, which calls the JTL ERP
 * GraphQL API on the user's behalf. The token never touches the JTL API from the browser. See the
 * serverless demo for the direct-from-browser alternative.
 */
const GraphqlDemoPage: React.FC<IGraphqlDemoPageProps> = ({ appBridge }) => {
  const request = useCallback(
    async (query: string) => {
      const { accessToken } = await appBridge.method.call<{ accessToken: string }>('getAppToken');
      const client = new GraphQLClient(`${apiUrl}/graphql`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return client.request<Record<string, unknown>>(query);
    },
    [appBridge],
  );

  return (
    <QueryDemo
      title="GraphQL Demo (Client-Server)"
      description="Queries the JTL ERP GraphQL API through your backend, which verifies the app token and proxies the request."
      request={request}
    />
  );
};

export default GraphqlDemoPage;
