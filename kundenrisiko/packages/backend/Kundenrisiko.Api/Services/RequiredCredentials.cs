namespace Kundenrisiko.Api.Services;

/// <summary>
/// Single source of truth for the configuration keys this app requires.
/// Consumed by both the startup banner (<c>Program.cs</c>) and the
/// <c>/health</c> endpoint so they can't drift apart.
/// </summary>
public static class RequiredCredentials
{
    public static readonly IReadOnlyList<(string Key, string ConfigPath)> All =
    [
        ("ClientId", "JtlPlatform:ClientId"),
        ("ClientSecret", "JtlPlatform:ClientSecret"),
    ];

    public static List<string> Missing(IConfiguration configuration) =>
        All
            .Where(pair => string.IsNullOrWhiteSpace(configuration[pair.ConfigPath]))
            .Select(pair => pair.Key)
            .ToList();
}
