using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace Kundenrisiko.Api.Services;

public class ErpApiService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<ErpApiService> _logger;

    public ErpApiService(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<ErpApiService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;
    }

    /// <summary>
    /// Fetches a short-lived access token via the OAuth2 client credentials flow.
    /// Equivalent to getJwt() in the Node.js sample.
    /// </summary>
    public async Task<string> GetAccessTokenAsync()
    {
        var clientId = _configuration["JtlPlatform:ClientId"];
        var clientSecret = _configuration["JtlPlatform:ClientSecret"];

        if (string.IsNullOrWhiteSpace(clientId) || string.IsNullOrWhiteSpace(clientSecret))
            throw new InvalidOperationException(
                "JtlPlatform:ClientId and JtlPlatform:ClientSecret must be set in appsettings.Local.json " +
                "or via environment variables JtlPlatform__ClientId / JtlPlatform__ClientSecret.");

        _logger.LogInformation("Fetching access token for client {ClientId}", clientId);

        var authString = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{clientId}:{clientSecret}"));
        var client = _httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Basic", authString);

        // Zitadel rejects a client_credentials request that asks for no scope.
        var body = new FormUrlEncodedContent([
            new KeyValuePair<string, string>("grant_type", "client_credentials"),
            new KeyValuePair<string, string>("scope", "openid")
        ]);

        var response = await client.PostAsync(GetAuthEndpoint(), body);
        var json = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            var error = JsonSerializer.Deserialize<JsonElement>(json);
            throw new InvalidOperationException(
                $"Failed to fetch access token ({response.StatusCode}): {error.GetProperty("error")}");
        }

        var data = JsonSerializer.Deserialize<JsonElement>(json);
        return data.GetProperty("access_token").GetString()!;
    }

    /// <summary>
    /// Proxies an arbitrary HTTP request to the JTL Platform ERP API.
    /// Equivalent to the /erp-info route in the Node.js sample.
    /// </summary>
    public async Task<(int StatusCode, string Body)> ProxyErpRequestAsync(
        string tenantId, string endpoint, HttpMethod method, string? jsonBody)
    {
        var jwt = await GetAccessTokenAsync();
        var client = _httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", jwt);
        client.DefaultRequestHeaders.Add("X-Tenant-ID", tenantId);

        var request = new HttpRequestMessage(method,
            $"https://api.jtl-cloud.com/erp/{endpoint}");

        if (jsonBody is not null && (method == HttpMethod.Post || method == HttpMethod.Put || method == HttpMethod.Patch))
        {
            // A charset parameter on Content-Type makes the ERP API reject the request outright, so
            // this sends a bare "application/json" rather than StringContent's default "; charset=utf-8".
            request.Content = new StringContent(jsonBody, Encoding.UTF8);
            request.Content.Headers.ContentType = new MediaTypeHeaderValue("application/json");
        }

        var response = await client.SendAsync(request);
        var responseBody = await response.Content.ReadAsStringAsync();
        return ((int)response.StatusCode, responseBody);
    }

    /// <summary>
    /// The service account mints its token at the issuer's token endpoint (JtlPlatform:Issuer +
    /// /oauth/v2/token). `npm run register` writes JtlPlatform:Issuer; the fallback is production.
    /// </summary>
    string GetAuthEndpoint()
    {
        var issuer = (_configuration["JtlPlatform:Issuer"] ?? "https://id.jtl-cloud.com")
            .TrimEnd('/');
        return $"{issuer}/oauth/v2/token";
    }
}
