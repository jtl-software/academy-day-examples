using FastEndpoints;

namespace Kundenrisiko.Api.Endpoints;

public class HomeEndpoint : EndpointWithoutRequest<string>
{
    public override void Configure()
    {
        Get("/");
        AllowAnonymous();
    }

    public override async Task HandleAsync(CancellationToken ct)
        => await Send.OkAsync("Hello from C# + FastEndpoints!", ct);
}
