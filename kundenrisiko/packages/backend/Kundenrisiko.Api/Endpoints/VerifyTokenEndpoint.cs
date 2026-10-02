using FastEndpoints;
using Kundenrisiko.Api.Services;

namespace Kundenrisiko.Api.Endpoints;

/// <summary>
/// Verifies an app token (sent as <c>Authorization: Bearer ...</c>) and returns its claims. The
/// frontend sends either the host-minted panel token or the app's own PKCE token; both go through
/// the same <see cref="AppTokenVerifier"/> check.
/// </summary>
public class VerifyTokenEndpoint : EndpointWithoutRequest
{
    private readonly AppTokenVerifier _verifier;

    public VerifyTokenEndpoint(AppTokenVerifier verifier)
    {
        _verifier = verifier;
    }

    public override void Configure()
    {
        Post("/verify-token");
        AllowAnonymous();
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var header = HttpContext.Request.Headers.Authorization.ToString();
        var token = header.StartsWith("Bearer ") ? header["Bearer ".Length..] : string.Empty;
        if (string.IsNullOrEmpty(token))
        {
            await Send.ResponseAsync(new { valid = false, error = "Missing Bearer access token" }, 401, ct);
            return;
        }

        var result = await _verifier.VerifyAsync(token, ct);

        var body = new Dictionary<string, object?> { ["valid"] = result.Valid, ["checks"] = result.Checks };
        if (result.Claims is not null) body["claims"] = result.Claims;
        if (result.Error is not null) body["error"] = result.Error;

        await Send.ResponseAsync(body, result.Valid ? 200 : 401, ct);
    }
}
