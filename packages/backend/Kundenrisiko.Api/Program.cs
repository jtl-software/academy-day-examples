using FastEndpoints;
using FastEndpoints.Swagger;
using Kundenrisiko.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Configuration.AddJsonFile("appsettings.Local.json", optional: true, reloadOnChange: false);

var missingCredentials = RequiredCredentials.Missing(builder.Configuration);
if (missingCredentials.Count > 0)
{
    PrintMissingCredentialsBanner(missingCredentials);
}

builder.Services.AddFastEndpoints();
builder.Services.SwaggerDocument();

builder.Services.AddHttpClient();
builder.Services.AddScoped<ErpApiService>();
builder.Services.AddSingleton<AppTokenVerifier>();

builder.Services.AddCors(options =>
    options.AddDefaultPolicy(policy =>
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader()));

var app = builder.Build();

app.UseCors();
app.UseFastEndpoints();

if (app.Environment.IsDevelopment())
    app.UseSwaggerGen();

app.Run();

static void PrintMissingCredentialsBanner(IReadOnlyList<string> missing)
{
    const string red = "\u001b[31m";
    const string yellow = "\u001b[33m";
    const string bold = "\u001b[1m";
    const string reset = "\u001b[0m";
    var line = new string('━', 72);
    const string settingsPath = "appsettings.Local.json";

    Console.Error.WriteLine();
    Console.Error.WriteLine($"{red}{bold}{line}{reset}");
    Console.Error.WriteLine($"{red}{bold}  ⚠  Missing credentials: {string.Join(", ", missing)}{reset}");
    Console.Error.WriteLine($"{yellow}  The backend will start, but every JTL API call will fail until you{reset}");
    Console.Error.WriteLine($"{yellow}  add the values below to {bold}{settingsPath}{reset}{yellow} (see {settingsPath}.example):{reset}");
    Console.Error.WriteLine();
    Console.Error.WriteLine($"{yellow}      {{{reset}");
    Console.Error.WriteLine($"{yellow}        \"JtlPlatform\": {{{reset}");
    for (var i = 0; i < missing.Count; i++)
    {
        var trailingComma = i < missing.Count - 1 ? "," : string.Empty;
        Console.Error.WriteLine($"{yellow}          \"{missing[i]}\": \"<paste from Partner Portal>\"{trailingComma}{reset}");
    }
    Console.Error.WriteLine($"{yellow}        }}{reset}");
    Console.Error.WriteLine($"{yellow}      }}{reset}");
    Console.Error.WriteLine();
    Console.Error.WriteLine($"{yellow}  Get values: https://partner.jtl-cloud.com/ → your app → Client credentials{reset}");
    Console.Error.WriteLine($"{red}{bold}{line}{reset}");
    Console.Error.WriteLine();
}
