using System.Net;
using System.Text.Json;
using Azure;
using Azure.AI.Projects;
using Azure.AI.Agents.Persistent;
using Azure.Core;
using Azure.Identity;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Configuration;

namespace Functions;

public class FabricAgentSdkFunction
{
    private readonly IConfiguration _config;

    public FabricAgentSdkFunction(IConfiguration config)
    {
        _config = config;
    }

    private static HttpResponseData Cors(HttpRequestData req)
    {
        var res = req.CreateResponse(HttpStatusCode.OK);
        res.Headers.Add("Access-Control-Allow-Origin", "*");
        res.Headers.Add("Access-Control-Allow-Headers", "Content-Type, Authorization");
        res.Headers.Add("Access-Control-Allow-Methods", "POST, OPTIONS");
        return res;
    }

    [Function("FabricAgentChatSdk")]
    public async Task<HttpResponseData> RunAsync([HttpTrigger(AuthorizationLevel.Anonymous, "post", "options", Route = "fabric/chat-sdk")] HttpRequestData req)
    {
        if (string.Equals(req.Method, "OPTIONS", StringComparison.OrdinalIgnoreCase))
        {
            return Cors(req);
        }

    var endpoint = _config["PROJECT_ENDPOINT"];
    var agentId = _config["FABRIC_AGENT_ID"];
        if (string.IsNullOrWhiteSpace(endpoint) || string.IsNullOrWhiteSpace(agentId))
        {
            var bad = req.CreateResponse(HttpStatusCode.BadRequest);
            bad.Headers.Add("Access-Control-Allow-Origin", "*");
            await bad.WriteStringAsync(JsonSerializer.Serialize(new { success = false, status = 400, error = "Missing PROJECT_ENDPOINT or FABRIC_AGENT_ID settings" }));
            return bad;
        }

        using var reader = new StreamReader(req.Body);
        var body = await reader.ReadToEndAsync();
        JsonElement payload;
        try { payload = JsonSerializer.Deserialize<JsonElement>(body); }
        catch
        {
            var bad = req.CreateResponse(HttpStatusCode.BadRequest);
            bad.Headers.Add("Access-Control-Allow-Origin", "*");
            await bad.WriteStringAsync(JsonSerializer.Serialize(new { success = false, status = 400, error = "Invalid JSON body" }));
            return bad;
        }

        // Allow payload overrides for agent/thread
        if (payload.ValueKind == JsonValueKind.Object)
        {
            if (payload.TryGetProperty("agentId", out var a) && a.ValueKind == JsonValueKind.String)
                agentId = a.GetString();
        }
        var messageText = ExtractUserMessage(payload) ?? "";
        if (string.IsNullOrWhiteSpace(messageText))
        {
            var bad = req.CreateResponse(HttpStatusCode.BadRequest);
            bad.Headers.Add("Access-Control-Allow-Origin", "*");
            await bad.WriteStringAsync(JsonSerializer.Serialize(new { success = false, status = 400, error = "Body must include messages with a user message", projectEndpoint = endpoint, agentId }));
            return bad;
        }

        try
        {
            var cred = BuildCredential();
            var normalized = NormalizeProjectEndpoint(endpoint);
            var client = new AIProjectClient(new Uri(normalized), cred);
            PersistentAgentsClient agents = client.GetPersistentAgentsClient();
            // Quick agent validation for clearer 400s
            try { _ = agents.Administration.GetAgent(agentId); }
            catch (RequestFailedException ex)
            {
                var notFound = req.CreateResponse(HttpStatusCode.BadRequest);
                notFound.Headers.Add("Access-Control-Allow-Origin", "*");
                await notFound.WriteStringAsync(JsonSerializer.Serialize(new { success = false, status = ex.Status, error = $"Agent not accessible: {ex.Message}", agentId, projectEndpoint = normalized }));
                return notFound;
            }

            // Use a new thread per request or override from payload
            PersistentAgentThread thread;
            string? incomingThreadId = null;
            if (payload.ValueKind == JsonValueKind.Object && payload.TryGetProperty("threadId", out var t) && t.ValueKind == JsonValueKind.String)
            {
                incomingThreadId = t.GetString();
            }
            if (!string.IsNullOrWhiteSpace(incomingThreadId))
            {
                // We cannot create a thread with an id, but we can at least attempt to use it; if invalid, fall back to create.
                try { thread = agents.Threads.GetThread(incomingThreadId); }
                catch { thread = agents.Threads.CreateThread(); }
            }
            else
            {
                thread = agents.Threads.CreateThread();
            }

            _ = agents.Messages.CreateMessage(thread.Id, MessageRole.User, messageText);

            // Run with an existing agent by ID
            ThreadRun run = agents.Runs.CreateRun(thread.Id, agentId);
            while (run.Status == RunStatus.Queued || run.Status == RunStatus.InProgress)
            {
                await Task.Delay(500);
                run = agents.Runs.GetRun(thread.Id, run.Id);
            }
            if (run.Status != RunStatus.Completed)
            {
                var err = req.CreateResponse(HttpStatusCode.BadGateway);
                err.Headers.Add("Access-Control-Allow-Origin", "*");
                await err.WriteStringAsync($"Run failed: {run.LastError?.Message}");
                return err;
            }

            // Collect assistant text
            var messages = agents.Messages.GetMessages(threadId: thread.Id, order: ListSortOrder.Ascending);
            string assistant = string.Empty;
            foreach (var m in messages)
            {
                // Take the last non-user message as assistant output
                if (!string.Equals(m.Role.ToString(), "User", StringComparison.OrdinalIgnoreCase))
                {
                    assistant = ConcatText(m);
                }
            }

            var ok = req.CreateResponse(HttpStatusCode.OK);
            ok.Headers.Add("Access-Control-Allow-Origin", "*");
            await ok.WriteStringAsync(JsonSerializer.Serialize(new { success = true, data = new { message = assistant, threadId = thread.Id, runId = run.Id, projectEndpoint = normalized } }));
            return ok;
        }
        catch (RequestFailedException ex)
        {
            var err = req.CreateResponse((HttpStatusCode)ex.Status);
            err.Headers.Add("Access-Control-Allow-Origin", "*");
            await err.WriteStringAsync(JsonSerializer.Serialize(new { success = false, status = ex.Status, error = ex.Message, agentId, projectEndpoint = endpoint }));
            return err;
        }
        catch (Exception ex)
        {
            var err = req.CreateResponse(HttpStatusCode.InternalServerError);
            err.Headers.Add("Access-Control-Allow-Origin", "*");
            await err.WriteStringAsync(JsonSerializer.Serialize(new { success = false, status = 500, error = ex.Message, agentId, projectEndpoint = endpoint }));
            return err;
        }
    }

    private TokenCredential BuildCredential()
    {
        var tenantId = _config["FABRIC_TENANT_ID"];
        var clientId = _config["FABRIC_CLIENT_ID"];
        var clientSecret = _config["FABRIC_CLIENT_SECRET"];
        if (!string.IsNullOrWhiteSpace(tenantId) && !string.IsNullOrWhiteSpace(clientId) && !string.IsNullOrWhiteSpace(clientSecret))
        {
            return new ClientSecretCredential(tenantId, clientId, clientSecret);
        }
        // Use explicit tenant if provided to avoid cross-tenant token issues
        var fallbackTenant = tenantId ?? _config["AZURE_TENANT_ID"];
        if (!string.IsNullOrWhiteSpace(fallbackTenant))
        {
            return new DefaultAzureCredential(new DefaultAzureCredentialOptions
            {
                SharedTokenCacheTenantId = fallbackTenant,
                VisualStudioTenantId = fallbackTenant,
                InteractiveBrowserTenantId = fallbackTenant,
                TenantId = fallbackTenant
            });
        }
        return new DefaultAzureCredential();
    }

    private static string NormalizeProjectEndpoint(string endpoint)
    {
        try
        {
            var uri = new Uri(endpoint);
            var path = uri.AbsolutePath;
            var newPath = path.Replace("/api/projects/", "/projects/").Replace("/api/projects", "/projects");
            if (newPath.StartsWith("/api/") && !newPath.StartsWith("/projects/"))
            {
                newPath = newPath.Substring(4); // drop leading '/api'
            }
            var builder = new UriBuilder(uri)
            {
                Path = newPath.TrimEnd('/')
            };
            return builder.Uri.ToString().TrimEnd('/');
        }
        catch
        {
            return endpoint;
        }
    }

    private static string? ExtractUserMessage(JsonElement payload)
    {
        try
        {
            // Direct inputs: { input: "..." } or { text: "..." }
            if (payload.TryGetProperty("input", out var input) && input.ValueKind == JsonValueKind.String)
                return input.GetString();
            if (payload.TryGetProperty("text", out var txt) && txt.ValueKind == JsonValueKind.String)
                return txt.GetString();

            if (payload.TryGetProperty("messages", out var msgs) && msgs.ValueKind == JsonValueKind.Array)
            {
                foreach (var m in msgs.EnumerateArray().Reverse())
                {
                    if (m.TryGetProperty("role", out var role) && role.GetString() == "user")
                    {
                        if (m.TryGetProperty("content", out var c))
                        {
                            if (c.ValueKind == JsonValueKind.String) return c.GetString();
                            if (c.ValueKind == JsonValueKind.Array)
                            {
                                foreach (var p in c.EnumerateArray())
                                {
                                    if (p.TryGetProperty("text", out var t) && t.ValueKind == JsonValueKind.String)
                                        return t.GetString();
                                }
                            }
                        }
                    }
                }
            }
        }
        catch { }
        return null;
    }

    private static string ConcatText(PersistentThreadMessage m)
    {
        var parts = new List<string>();
        foreach (var item in m.ContentItems)
        {
            if (item is MessageTextContent t && !string.IsNullOrWhiteSpace(t.Text))
                parts.Add(t.Text);
        }
        return string.Join("\n", parts);
    }
}
