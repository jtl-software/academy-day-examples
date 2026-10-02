namespace Kundenrisiko.Api.Models;

public record AppTokenChecks(bool SignatureAndIssuer, bool Audience, bool AppId);
