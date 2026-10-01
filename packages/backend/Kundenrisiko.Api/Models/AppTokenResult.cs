namespace Kundenrisiko.Api.Models;

public record AppTokenResult(
    bool Valid,
    AppTokenChecks Checks,
    IDictionary<string, object>? Claims = null,
    string? Error = null);
