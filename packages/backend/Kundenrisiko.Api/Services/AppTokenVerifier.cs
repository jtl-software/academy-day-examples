using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Protocols;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Tokens;
using Kundenrisiko.Api.Models;

namespace Kundenrisiko.Api.Services;

/// <summary>
/// Verifies an app token (the host-minted panel token, or the app's own PKCE token) and returns its
/// claims. One path covers both: signature, issuer and expiry against the IdP's published keys
/// (discovered and cached, refreshed on rotation), then `aud` contains this app's id and any
/// `urn:jtl:app_id` is this app - so a token minted for another app can't be replayed here.
/// </summary>
public class AppTokenVerifier
{
    private readonly ConfigurationManager<OpenIdConnectConfiguration> _configManager;
    private readonly string _appId;

    public AppTokenVerifier(IConfiguration configuration)
    {
        Issuer = (configuration["JtlPlatform:Issuer"] ?? "https://id.jtl-cloud.com").TrimEnd('/');
        _appId = configuration["JtlPlatform:AppId"] ?? "";
        _configManager = new ConfigurationManager<OpenIdConnectConfiguration>(
            $"{Issuer}/.well-known/openid-configuration",
            new OpenIdConnectConfigurationRetriever(),
            new HttpDocumentRetriever());
    }

    public string Issuer { get; }

    public async Task<AppTokenResult> VerifyAsync(string token, CancellationToken ct)
    {
        var config = await _configManager.GetConfigurationAsync(ct);
        var parameters = new TokenValidationParameters
        {
            ValidIssuer = Issuer,
            IssuerSigningKeys = config.SigningKeys,
            ValidateIssuer = true,
            ValidateLifetime = true,
            // Audience is checked manually below, alongside urn:jtl:app_id, so a caller gets a
            // per-check breakdown rather than one opaque validation failure.
            ValidateAudience = false,
        };

        var result = await new JsonWebTokenHandler().ValidateTokenAsync(token, parameters);
        if (!result.IsValid)
        {
            return new AppTokenResult(
                Valid: false,
                Checks: new AppTokenChecks(SignatureAndIssuer: false, Audience: false, AppId: false),
                Error: result.Exception?.Message ?? "Invalid token");
        }

        var audience = ExtractAudience(result.Claims).Contains(_appId);

        // Only a truly absent claim passes as "absent"; a present value must equal this app's id,
        // so a wrong or malformed app_id fails rather than being coerced.
        var hasAppIdClaim = result.Claims.TryGetValue("urn:jtl:app_id", out var appIdClaim);
        var appIdOk = !hasAppIdClaim || appIdClaim?.ToString() == _appId;

        return new AppTokenResult(
            Valid: audience && appIdOk,
            Checks: new AppTokenChecks(SignatureAndIssuer: true, Audience: audience, AppId: appIdOk),
            Claims: result.Claims);
    }

    private static IReadOnlyList<string> ExtractAudience(IDictionary<string, object> claims)
    {
        if (!claims.TryGetValue("aud", out var aud) || aud is null)
            return [];

        if (aud is IEnumerable<object> list)
            return list.Select(a => a.ToString() ?? "").ToList();

        return [aud.ToString() ?? ""];
    }
}
