using System.Net;
using System.Text.Json;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Azure;
using Azure.AI.Inference;
using Azure.AI.Projects;
using Azure.Core;
using Azure.Core.Pipeline;
using Azure.Identity;

namespace Functions;

public class AiFoundryChatFunction
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _config;
    private readonly ILogger _logger;

    public AiFoundryChatFunction(IHttpClientFactory httpClientFactory, IConfiguration config, ILoggerFactory loggerFactory)
    {
        _httpClientFactory = httpClientFactory;
        _config = config;
        _logger = loggerFactory.CreateLogger<AiFoundryChatFunction>();
    }

    [Function("AiFoundryChat")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "options", "post", Route = "ai/chat")] HttpRequestData req)
    {
        var res = req.CreateResponse();
        res.Headers.Add("Access-Control-Allow-Origin", "*");
        res.Headers.Add("Access-Control-Allow-Headers", "Content-Type, x-functions-key");
        res.Headers.Add("Access-Control-Allow-Methods", "OPTIONS, POST");
        if (string.Equals(req.Method, "OPTIONS", StringComparison.OrdinalIgnoreCase))
        {
            res.StatusCode = HttpStatusCode.NoContent;
            return res;
        }
        try
        {
            using var reader = new StreamReader(req.Body);
            var bodyText = await reader.ReadToEndAsync();
            if (string.IsNullOrWhiteSpace(bodyText))
            {
                res.StatusCode = HttpStatusCode.BadRequest;
                await res.WriteStringAsync(JsonSerializer.Serialize(new { error = "Missing request body" }));
                return res;
            }

            using var doc = JsonDocument.Parse(bodyText);
            if (!doc.RootElement.TryGetProperty("messages", out var messagesEl) || messagesEl.ValueKind != JsonValueKind.Array)
            {
                res.StatusCode = HttpStatusCode.BadRequest;
                await res.WriteStringAsync(JsonSerializer.Serialize(new { error = "Expected 'messages' array" }));
                return res;
            }

            // Use Azure.AI.Projects SDK with AAD only (no REST/key flow)
            var projectEndpoint = _config["AZURE_AI_ENDPOINT"] ?? _config["AI_FOUNDRY_ENDPOINT"] ?? string.Empty;
            var modelName = _config["AZURE_AI_MODEL"] ?? _config["AI_FOUNDRY_DEPLOYMENT"] ?? _config["AI_FOUNDRY_MODEL"];
            if (string.IsNullOrWhiteSpace(projectEndpoint))
            {
                res.StatusCode = HttpStatusCode.BadRequest;
                await res.WriteStringAsync(JsonSerializer.Serialize(new { error = "Missing AZURE_AI_ENDPOINT (or AI_FOUNDRY_ENDPOINT)." }));
                return res;
            }
            if (string.IsNullOrWhiteSpace(modelName))
            {
                res.StatusCode = HttpStatusCode.BadRequest;
                await res.WriteStringAsync(JsonSerializer.Serialize(new { error = "Missing AZURE_AI_MODEL (or AI_FOUNDRY_DEPLOYMENT/AI_FOUNDRY_MODEL)." }));
                return res;
            }

            TokenCredential credential = new ChainedTokenCredential(
                new AzureCliCredential(),
                new ManagedIdentityCredential());
            var projectUri = new Uri(projectEndpoint);
            var inferenceEndpoint = $"{projectUri.GetLeftPart(UriPartial.Authority)}/models";

            var clientOptions = new AzureAIInferenceClientOptions();
            var tokenPolicy = new BearerTokenAuthenticationPolicy(credential, new[] { "https://ai.azure.com/.default" });
            clientOptions.AddPolicy(tokenPolicy, HttpPipelinePosition.PerRetry);

            var chatClient = new ChatCompletionsClient(new Uri(inferenceEndpoint), credential, clientOptions);

            var msgs = new List<ChatRequestMessage>();
            foreach (var m in messagesEl.EnumerateArray())
            {
                var role = m.GetProperty("role").GetString() ?? "user";
                var content = m.GetProperty("content").GetString() ?? string.Empty;
                if (string.Equals(role, "system", StringComparison.OrdinalIgnoreCase))
                    msgs.Add(new ChatRequestSystemMessage(content));
                else if (string.Equals(role, "assistant", StringComparison.OrdinalIgnoreCase))
                    msgs.Add(new ChatRequestAssistantMessage(content));
                else
                    msgs.Add(new ChatRequestUserMessage(content));
            }

            var options = new ChatCompletionsOptions();
            foreach (var msg in msgs) options.Messages.Add(msg);
            // Do not set Temperature/TopP/etc.; some models only accept defaults.
            options.Model = modelName;
            var sdkResponse = await chatClient.CompleteAsync(options);
            var reply = sdkResponse.Value?.Content ?? string.Empty;

            res.StatusCode = HttpStatusCode.OK;
            res.Headers.Add("Content-Type", "application/json");
            await res.WriteStringAsync(JsonSerializer.Serialize(new { text = reply }));
            return res;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled error in AiFoundryChatFunction");
            res.StatusCode = HttpStatusCode.InternalServerError;
            await res.WriteStringAsync(JsonSerializer.Serialize(new { error = ex.Message }));
            return res;
        }
    }
}
