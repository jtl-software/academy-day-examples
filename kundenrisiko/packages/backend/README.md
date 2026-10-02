# .NET Backend Template

ASP.NET Core 8 + FastEndpoints + app-token verification (JWKS)

## Configuration

Copy `appsettings.Local.json.example` to `appsettings.Local.json` and add your Client ID, Secret and App ID.

## Scripts

- `dotnet run` — runs on port 3005
- Swagger UI at `/swagger` in development mode

## Endpoints

- `GET /health` — reports whether `JtlPlatform:ClientId`/`JtlPlatform:ClientSecret` are configured
- `POST /verify-token` — verifies an app token (`Authorization: Bearer <token>`) and returns its claims
- `POST /graphql` — proxies a GraphQL request to the JTL ERP API; verifies the app token and reads the tenant from its `urn:jtl:tenant_id` claim
- `ALL /erp-info/{tenantId}/{endpoint}` — proxies a REST request to the JTL ERP API (unauthenticated; tenant comes from the URL)
