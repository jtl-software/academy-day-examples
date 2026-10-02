using FastEndpoints;
using Kundenrisiko.Api.Services;

namespace Kundenrisiko.Api.Endpoints;

public class HealthEndpoint : EndpointWithoutRequest
{
    private readonly IConfiguration _configuration;

    public HealthEndpoint(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public override void Configure()
    {
        Get("/health");
        AllowAnonymous();
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var missing = RequiredCredentials.Missing(_configuration);
        await Send.OkAsync(new
        {
            status = missing.Count == 0 ? "ok" : "misconfigured",
            missing,
        }, ct);
    }
}
