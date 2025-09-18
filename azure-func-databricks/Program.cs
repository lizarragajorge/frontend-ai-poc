using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Configuration;
using System.Net.Http.Headers;

var host = new HostBuilder()
    .ConfigureAppConfiguration(cfg =>
    {
        cfg.AddJsonFile("appsettings.json", optional: true, reloadOnChange: true)
           .AddEnvironmentVariables()
           .AddJsonFile("local.settings.json", optional: true, reloadOnChange: true);
    })
    .ConfigureServices((context, services) =>
    {
        services.AddHttpClient("Databricks", client =>
        {
            var host = context.Configuration["DATABRICKS_HOST"] ?? string.Empty;
            var token = context.Configuration["DATABRICKS_TOKEN"] ?? string.Empty;
            if (!string.IsNullOrWhiteSpace(host))
            {
                client.BaseAddress = new Uri(host.TrimEnd('/') + "/api/2.0/");
            }
            if (!string.IsNullOrWhiteSpace(token))
            {
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
            }
        });
        services.AddHttpClient("AiFoundry", client =>
        {
            var endpoint = context.Configuration["AI_FOUNDRY_ENDPOINT"] ?? string.Empty;
            var apiKey = context.Configuration["AI_FOUNDRY_API_KEY"] ?? string.Empty;
            if (!string.IsNullOrWhiteSpace(endpoint))
            {
                client.BaseAddress = new Uri(endpoint.TrimEnd('/') + "/");
            }
            if (!string.IsNullOrWhiteSpace(apiKey))
            {
                client.DefaultRequestHeaders.Add("api-key", apiKey);
                // Some gateways expect this legacy header name
                client.DefaultRequestHeaders.Add("Ocp-Apim-Subscription-Key", apiKey);
            }
        });
        services.AddHttpClient();
        services.AddSingleton<Shared.DatabricksClient>();
    })
    .ConfigureFunctionsWorkerDefaults()
    .Build();

await host.RunAsync();
