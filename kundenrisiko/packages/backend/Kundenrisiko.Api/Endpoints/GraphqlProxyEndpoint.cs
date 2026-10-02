using System.Net.Http.Headers;
using System.Text;
using FastEndpoints;
using Kundenrisiko.Api.Services;

namespace Kundenrisiko.Api.Endpoints;

/// <summary>
/// Proxies GraphQL requests to the JTL Platform ERP GraphQL API. The frontend sends the app token
/// via <c>Authorization: Bearer ...</c>; the backend verifies it and trusts the tenant bound into the
/// token (<c>urn:jtl:tenant_id</c>) rather than taking it from the client, then authenticates to the
/// ERP API with client credentials. The request body is forwarded as-is (standard GraphQL:
/// { query, variables, operationName }).
/// </summary>
public class GraphqlProxyEndpoint : EndpointWithoutRequest
{
    private readonly ErpApiService _erpApiService;
    private readonly AppTokenVerifier _verifier;
    private readonly ILogger<GraphqlProxyEndpoint> _logger;

    public GraphqlProxyEndpoint(
        ErpApiService erpApiService,
        AppTokenVerifier verifier,
        ILogger<GraphqlProxyEndpoint> logger)
    {
        _erpApiService = erpApiService;
        _verifier = verifier;
        _logger = logger;
    }

    public override void Configure()
    {
        Post("/graphql");
        AllowAnonymous();
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var header = HttpContext.Request.Headers.Authorization.ToString();
        var token = header.StartsWith("Bearer ") ? header["Bearer ".Length..] : string.Empty;
        if (string.IsNullOrEmpty(token))
        {
            await Send.ResponseAsync(new { error = "Missing Bearer access token" }, 401, ct);
            return;
        }

        var result = await _verifier.VerifyAsync(token, ct);
        if (!result.Valid)
        {
            await Send.ResponseAsync(new { error = "Invalid app token", checks = result.Checks }, 401, ct);
            return;
        }

        var tenantId = result.Claims!.TryGetValue("urn:jtl:tenant_id", out var claim) ? claim?.ToString() : null;
        if (string.IsNullOrEmpty(tenantId))
        {
            await Send.ResponseAsync(new { error = "App token has no urn:jtl:tenant_id claim" }, 400, ct);
            return;
        }

        try
        {
            var accessToken = await _erpApiService.GetAccessTokenAsync();

            using var reader = new StreamReader(HttpContext.Request.Body);
            var graphqlBody = await reader.ReadToEndAsync(ct);

            var client = HttpContext.RequestServices.GetRequiredService<IHttpClientFactory>().CreateClient();
            client.DefaultRequestHeaders.Authorization =
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken);
            client.DefaultRequestHeaders.Add("X-Tenant-ID", tenantId);

            // Plain StringContent(body, Encoding.UTF8, "application/json") appends "; charset=utf-8",
            // which the ERP API rejects outright. Node and PHP both send a bare "application/json".
            var content = new StringContent(graphqlBody, Encoding.UTF8);
            content.Headers.ContentType = new MediaTypeHeaderValue("application/json");

            var response = await client.PostAsync("https://api.jtl-cloud.com/erp/v2/graphql", content, ct);

            var responseBody = await response.Content.ReadAsStringAsync(ct);

            HttpContext.Response.StatusCode = (int)response.StatusCode;
            HttpContext.Response.ContentType = "application/json";
            await HttpContext.Response.WriteAsync(responseBody, ct);
        }
        catch (Exception e)
        {
            _logger.LogError(e, "graphql proxy failed");
            await Send.ResponseAsync(new { error = "Failed to proxy GraphQL request", message = e.Message }, 500, ct);
        }
    }
}
