using System.Net;
using System.Text.Json;
using Azure;
using Azure.AI.Agents.Persistent;
using Azure.Identity;
using Azure.Core;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Linq;

namespace Functions;

public class AiAgentChatFunction
{
    private readonly IConfiguration _config;
    private readonly ILogger _logger;

    public AiAgentChatFunction(IConfiguration config, ILoggerFactory loggerFactory)
    {
        _config = config;
        _logger = loggerFactory.CreateLogger<AiAgentChatFunction>();
    }

    [Function("AiAgentStart")] // POST /api/ai/agent/start
    public async Task<HttpResponseData> Start(
        [HttpTrigger(AuthorizationLevel.Anonymous, "options", "post", Route = "ai/agent/start")] HttpRequestData req)
    {
        var res = req.CreateResponse();
        AddCors(res);
        if (string.Equals(req.Method, "OPTIONS", StringComparison.OrdinalIgnoreCase))
        {
            res.StatusCode = HttpStatusCode.NoContent;
            return res;
        }
        try
        {
            var endpoint = _config["AZURE_AI_ENDPOINT"] ?? _config["AI_FOUNDRY_ENDPOINT"]; // allow reuse
            var model = _config["AZURE_AI_MODEL"] ?? _config["AI_FOUNDRY_DEPLOYMENT"];
            if (string.IsNullOrWhiteSpace(endpoint) || string.IsNullOrWhiteSpace(model))
            {
                res.StatusCode = HttpStatusCode.BadRequest;
                await res.WriteStringAsync(JsonSerializer.Serialize(new { error = "Missing AZURE_AI_ENDPOINT or AZURE_AI_MODEL" }));
                return res;
            }

            // Optional: accept an existing agentId in the request body
            string? incomingAgentId = null;
            using (var reader = new StreamReader(req.Body))
            {
                var bodyText = await reader.ReadToEndAsync();
                if (!string.IsNullOrWhiteSpace(bodyText))
                {
                    try
                    {
                        using var doc = JsonDocument.Parse(bodyText);
                        if (doc.RootElement.TryGetProperty("agentId", out var aidEl))
                        {
                            incomingAgentId = aidEl.GetString();
                        }
                    }
                    catch
                    {
                        // ignore malformed JSON; proceed with creating agent
                    }
                }
            }

            // If no agentId provided in the request, try to use configured agent id
            if (string.IsNullOrWhiteSpace(incomingAgentId))
            {
                incomingAgentId = _config["AZURE_AI_AGENT_ID"] ?? _config["AI_FOUNDRY_AGENT_ID"];
            }

            TokenCredential credential = new ChainedTokenCredential(
                new AzureCliCredential(),
                new ManagedIdentityCredential());

            var client = new PersistentAgentsClient(endpoint, credential);
            var instructions = _config["AZURE_AI_INSTRUCTIONS"] ?? "You are a helpful assistant for a data marketplace.";

            PersistentAgent agent;
            if (!string.IsNullOrWhiteSpace(incomingAgentId))
            {
                try
                {
                    agent = client.Administration.GetAgent(incomingAgentId).Value;
                }
                catch (RequestFailedException ex) when (ex.Status == 404)
                {
                    res.StatusCode = HttpStatusCode.BadRequest;
                    await res.WriteStringAsync(JsonSerializer.Serialize(new { error = $"Agent '{incomingAgentId}' not found" }));
                    return res;
                }
            }
            else
            {
                agent = client.Administration.CreateAgent(
                    model: model,
                    name: "Data Marketplace Assistant",
                    instructions: instructions,
                    tools: new List<ToolDefinition> { new CodeInterpreterToolDefinition() });
            }

            PersistentAgentThread thread = client.Threads.CreateThread();

            res.StatusCode = HttpStatusCode.OK;
            res.Headers.Add("Content-Type", "application/json");
            await res.WriteStringAsync(JsonSerializer.Serialize(new { agentId = agent.Id, threadId = thread.Id }));
            return res;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Agent start failed");
            res.StatusCode = HttpStatusCode.InternalServerError;
            await res.WriteStringAsync(JsonSerializer.Serialize(new { error = ex.Message }));
            return res;
        }
    }

    [Function("AiAgentSend")] // POST /api/ai/agent/send
    public async Task<HttpResponseData> Send(
        [HttpTrigger(AuthorizationLevel.Anonymous, "options", "post", Route = "ai/agent/send")] HttpRequestData req)
    {
        var res = req.CreateResponse();
        AddCors(res);
        if (string.Equals(req.Method, "OPTIONS", StringComparison.OrdinalIgnoreCase))
        {
            res.StatusCode = HttpStatusCode.NoContent;
            return res;
        }
        try
        {
            using var reader = new StreamReader(req.Body);
            var body = await reader.ReadToEndAsync();
            if (string.IsNullOrWhiteSpace(body))
            {
                res.StatusCode = HttpStatusCode.BadRequest;
                await res.WriteStringAsync(JsonSerializer.Serialize(new { error = "Missing body" }));
                return res;
            }
            using var doc = JsonDocument.Parse(body);
            var root = doc.RootElement;
            var endpoint = _config["AZURE_AI_ENDPOINT"] ?? _config["AI_FOUNDRY_ENDPOINT"];
            var model = _config["AZURE_AI_MODEL"] ?? _config["AI_FOUNDRY_DEPLOYMENT"];
            if (string.IsNullOrWhiteSpace(endpoint) || string.IsNullOrWhiteSpace(model))
            {
                res.StatusCode = HttpStatusCode.BadRequest;
                await res.WriteStringAsync(JsonSerializer.Serialize(new { error = "Missing AZURE_AI_ENDPOINT or AZURE_AI_MODEL" }));
                return res;
            }

            TokenCredential credential = new ChainedTokenCredential(
                new AzureCliCredential(),
                new ManagedIdentityCredential());
            var client = new PersistentAgentsClient(endpoint, credential);

            if (!root.TryGetProperty("agentId", out var agentIdEl) ||
                !root.TryGetProperty("threadId", out var threadIdEl) ||
                !root.TryGetProperty("text", out var textEl))
            {
                res.StatusCode = HttpStatusCode.BadRequest;
                await res.WriteStringAsync(JsonSerializer.Serialize(new { error = "Expected agentId, threadId, text" }));
                return res;
            }
            string agentId = agentIdEl.GetString() ?? string.Empty;
            string threadId = threadIdEl.GetString() ?? string.Empty;
            string text = textEl.GetString() ?? string.Empty;
            if (string.IsNullOrWhiteSpace(agentId) || string.IsNullOrWhiteSpace(threadId) || string.IsNullOrWhiteSpace(text))
            {
                res.StatusCode = HttpStatusCode.BadRequest;
                await res.WriteStringAsync(JsonSerializer.Serialize(new { error = "Invalid inputs" }));
                return res;
            }

            // Get references
            var agent = client.Administration.GetAgent(agentId).Value;
            var thread = client.Threads.GetThread(threadId).Value;
            // Post user message
            client.Messages.CreateMessage(thread.Id, MessageRole.User, text);
            // Run the agent on the thread
            var run = client.Runs.CreateRun(thread, agent).Value;
            // Poll until completion
            do
            {
                await Task.Delay(500);
                run = client.Runs.GetRun(thread.Id, run.Id).Value;
            }
            while (run.Status == RunStatus.Queued || run.Status == RunStatus.InProgress);

            // Gather messages
            var msgs = client.Messages.GetMessages(threadId: thread.Id, order: ListSortOrder.Ascending);
            var lastAssistant = msgs.LastOrDefault(m => m.Role != MessageRole.User);
            string reply = "";
            if (lastAssistant != null)
            {
                foreach (var content in lastAssistant.ContentItems)
                {
                    if (content is MessageTextContent txt)
                    {
                        reply += txt.Text;
                    }
                }
            }

            res.StatusCode = HttpStatusCode.OK;
            res.Headers.Add("Content-Type", "application/json");
            await res.WriteStringAsync(JsonSerializer.Serialize(new { text = reply }));
            return res;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Agent send failed");
            res.StatusCode = HttpStatusCode.InternalServerError;
            await res.WriteStringAsync(JsonSerializer.Serialize(new { error = ex.Message }));
            return res;
        }
    }

    private static void AddCors(HttpResponseData res)
    {
        res.Headers.Add("Access-Control-Allow-Origin", "http://localhost:4200");
        res.Headers.Add("Access-Control-Allow-Headers", "Content-Type");
        res.Headers.Add("Access-Control-Allow-Methods", "OPTIONS, POST");
    }
}
