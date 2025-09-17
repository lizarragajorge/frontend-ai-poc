using System.Net.Http.Json;
using System.Text.Json;
using Azure.Core;
using Azure.Identity;
using Microsoft.Extensions.Configuration;

namespace Shared;

public class FabricAgentClient
{
    private readonly IHttpClientFactory _httpFactory;
    private readonly IConfiguration _config;

    public FabricAgentClient(IHttpClientFactory httpFactory, IConfiguration config)
    {
        _httpFactory = httpFactory;
        _config = config;
    }

    private TokenCredential BuildCredential()
    {
        var tenantId = _config["FABRIC_TENANT_ID"];
        var clientId = _config["FABRIC_CLIENT_ID"];
        var clientSecret = _config["FABRIC_CLIENT_SECRET"];

        if (!string.IsNullOrWhiteSpace(clientId) && !string.IsNullOrWhiteSpace(clientSecret) && !string.IsNullOrWhiteSpace(tenantId))
        {
            return new ClientSecretCredential(tenantId, clientId, clientSecret);
        }

        return new DefaultAzureCredential();
    }

    public async Task<object> SendChatAsync(object payload, CancellationToken ct = default)
    {
    var apiKey = _config["FABRIC_API_KEY"];
    var chatUrl = _config["FABRIC_AGENT_CHAT_URL"];
        var baseUrl = _config["FABRIC_AGENT_BASE_URL"];
        var agentId = _config["FABRIC_AGENT_ID"];
        var scope = _config["FABRIC_SCOPE"] ?? "https://api.fabric.microsoft.com/.default";
    var apiVersion = _config["FABRIC_API_VERSION"] ?? "2024-08-01-preview";

        var client = _httpFactory.CreateClient();
        string targetUrl;
        var req = new HttpRequestMessage(HttpMethod.Post, "http://localhost/"); // placeholder, will reset below
        try
        {
            if (!string.IsNullOrWhiteSpace(apiKey))
            {
                targetUrl = !string.IsNullOrWhiteSpace(chatUrl)
                    ? chatUrl!
                    : (baseUrl?.TrimEnd('/') + $"/agents/{agentId}/chat");
                if (string.IsNullOrWhiteSpace(targetUrl))
                    throw new InvalidOperationException("FABRIC_AGENT_CHAT_URL or FABRIC_AGENT_BASE_URL/FABRIC_AGENT_ID must be configured for API key auth");

                // If api-version missing, try a set of common previews
                if (targetUrl != null && !targetUrl.Contains("api-version="))
                {
                    var versions = string.IsNullOrWhiteSpace(apiVersion)
                        ? new[] { "2024-08-01-preview", "2024-07-01-preview", "2024-06-01-preview", "2024-05-01-preview" }
                        : new[] { apiVersion };
                    foreach (var v in versions)
                    {
                        var url = targetUrl + (targetUrl.Contains("?") ? "&" : "?") + $"api-version={Uri.EscapeDataString(v)}";
                        using var attempt = new HttpRequestMessage(HttpMethod.Post, url);
                        attempt.Headers.Add("api-key", apiKey);
                        attempt.Headers.TryAddWithoutValidation("Ocp-Apim-Subscription-Key", apiKey);
                        attempt.Content = JsonContent.Create(payload);
                        using var resp = await client.SendAsync(attempt, ct);
                        var txt = await resp.Content.ReadAsStringAsync(ct);
                        if (resp.IsSuccessStatusCode) {
                            try { var doc = JsonSerializer.Deserialize<JsonElement>(txt); return new { success = true, data = doc, apiVersion = v }; } catch { return new { success = true, raw = txt, apiVersion = v }; }
                        }
                        if ((int)resp.StatusCode == 400 && txt.Contains("API version not supported", StringComparison.OrdinalIgnoreCase))
                        {
                            continue; // try next version
                        }
                        return new { success = false, status = (int)resp.StatusCode, error = txt, apiVersionTried = v };
                    }
                    return new { success = false, status = 400, error = "No supported api-version found", tried = versions };
                }

                // api-version already present, single-shot
                req = new HttpRequestMessage(HttpMethod.Post, targetUrl);
                req.Headers.Add("api-key", apiKey);
                req.Headers.TryAddWithoutValidation("Ocp-Apim-Subscription-Key", apiKey);
            }
            else
            {
                if (string.IsNullOrWhiteSpace(baseUrl))
                    throw new InvalidOperationException("FABRIC_AGENT_BASE_URL not configured");
                targetUrl = baseUrl!.TrimEnd('/') + "/chat";
                var cred = BuildCredential();
                var token = await cred.GetTokenAsync(new TokenRequestContext(new[] { scope }), ct);

                if (!targetUrl.Contains("api-version="))
                {
                    var versions = string.IsNullOrWhiteSpace(apiVersion)
                        ? new[] { "2024-08-01-preview", "2024-07-01-preview", "2024-06-01-preview", "2024-05-01-preview" }
                        : new[] { apiVersion };
                    foreach (var v in versions)
                    {
                        var url = targetUrl + (targetUrl.Contains("?") ? "&" : "?") + $"api-version={Uri.EscapeDataString(v)}";
                        using var attempt = new HttpRequestMessage(HttpMethod.Post, url);
                        attempt.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token.Token);
                        attempt.Content = JsonContent.Create(payload);
                        using var resp = await client.SendAsync(attempt, ct);
                        var txt = await resp.Content.ReadAsStringAsync(ct);
                        if (resp.IsSuccessStatusCode) {
                            try { var doc = JsonSerializer.Deserialize<JsonElement>(txt); return new { success = true, data = doc, apiVersion = v }; } catch { return new { success = true, raw = txt, apiVersion = v }; }
                        }
                        if ((int)resp.StatusCode == 400 && txt.Contains("API version not supported", StringComparison.OrdinalIgnoreCase))
                        {
                            continue;
                        }
                        return new { success = false, status = (int)resp.StatusCode, error = txt, apiVersionTried = v };
                    }
                    return new { success = false, status = 400, error = "No supported api-version found", tried = versions };
                }

                req = new HttpRequestMessage(HttpMethod.Post, targetUrl);
                req.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token.Token);
            }
        }
        catch
        {
            req.Dispose();
            throw;
        }

        req.Content = JsonContent.Create(payload);

    using var res = await client.SendAsync(req, ct);
        var text = await res.Content.ReadAsStringAsync(ct);
        if (!res.IsSuccessStatusCode)
        {
            return new
            {
                success = false,
                status = (int)res.StatusCode,
                error = text
            };
        }

        try
        {
            var doc = JsonSerializer.Deserialize<JsonElement>(text);
            return new { success = true, data = doc };
        }
        catch
        {
            return new { success = true, raw = text };
        }
    }
}
