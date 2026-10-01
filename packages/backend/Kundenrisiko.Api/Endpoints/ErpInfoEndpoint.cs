using System.Text.Json;
using FastEndpoints;
using Kundenrisiko.Api.Services;

namespace Kundenrisiko.Api.Endpoints;

/// <summary>
/// Proxies requests to the JTL Platform ERP API. The tenant id is taken directly from the URL (or
/// the request body, for write methods) and trusted as-is - no verification on this route.
/// </summary>
public class ErpInfoEndpoint : EndpointWithoutRequest
{
    private readonly ErpApiService _erpApiService;

    public ErpInfoEndpoint(ErpApiService erpApiService)
    {
        _erpApiService = erpApiService;
    }

    public override void Configure()
    {
        Verbs(Http.GET, Http.POST, Http.PUT, Http.PATCH, Http.DELETE);
        Routes("/erp-info/{tenantId}/{*endpoint}");
        AllowAnonymous();
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var tenantId = Route<string>("tenantId")!;
        var endpoint = Route<string>("endpoint")!;
        var method = new HttpMethod(HttpContext.Request.Method);
        string? jsonBody = null;

        if (HttpContext.Request.Method is "POST" or "PUT" or "PATCH")
        {
            using var reader = new StreamReader(HttpContext.Request.Body);
            var rawBody = await reader.ReadToEndAsync(ct);

            if (!string.IsNullOrWhiteSpace(rawBody))
            {
                var bodyJson = JsonSerializer.Deserialize<JsonElement>(rawBody);

                // Allow overriding tenantId and endpoint from the request body.
                if (bodyJson.TryGetProperty("_tenantId", out var tenantOverride))
                    tenantId = tenantOverride.GetString()!;

                if (bodyJson.TryGetProperty("_endpoint", out var endpointOverride))
                    endpoint = endpointOverride.GetString()!;

                var cleaned = bodyJson.EnumerateObject()
                    .Where(p => p.Name is not "_tenantId" and not "_endpoint")
                    .ToDictionary(p => p.Name, p => p.Value);

                jsonBody = JsonSerializer.Serialize(cleaned);
            }
        }

        var (statusCode, responseBody) = await _erpApiService.ProxyErpRequestAsync(
            tenantId, endpoint, method, jsonBody);

        HttpContext.Response.StatusCode = statusCode;
        HttpContext.Response.ContentType = "application/json";
        await HttpContext.Response.WriteAsync(responseBody, ct);
    }
}
