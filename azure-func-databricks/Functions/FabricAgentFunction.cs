using System.Net;
using System.Net.Mime;
using System.Text.Json;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;

namespace Functions;

public class FabricAgentFunction
{
    private readonly Shared.FabricAgentClient _client;
    private readonly ILogger _logger;
    public FabricAgentFunction(Shared.FabricAgentClient client, ILoggerFactory loggerFactory)
    {
        _client = client;
        _logger = loggerFactory.CreateLogger<FabricAgentFunction>();
    }

    [Function("FabricAgentChat")]
    public async Task<HttpResponseData> Run([HttpTrigger(AuthorizationLevel.Anonymous, "post", "options", Route = "fabric/chat")] HttpRequestData req)
    {
        if (string.Equals(req.Method, "OPTIONS", StringComparison.OrdinalIgnoreCase))
        {
            var pre = req.CreateResponse(HttpStatusCode.NoContent);
            pre.Headers.Add("Access-Control-Allow-Origin", "*");
            pre.Headers.Add("Access-Control-Allow-Methods", "POST, OPTIONS");
            pre.Headers.Add("Access-Control-Allow-Headers", "Content-Type, Authorization, api-key");
            return pre;
        }
        try
        {
            using var doc = await JsonDocument.ParseAsync(req.Body);
            var payload = doc.RootElement.Deserialize<object>(new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            var result = await _client.SendChatAsync(payload!);

            var res = req.CreateResponse(HttpStatusCode.OK);
            res.Headers.Add("Content-Type", MediaTypeNames.Application.Json);
            res.Headers.Add("Access-Control-Allow-Origin", "*");
            res.Headers.Add("Access-Control-Allow-Methods", "POST, OPTIONS");
            res.Headers.Add("Access-Control-Allow-Headers", "Content-Type, Authorization");
            await res.WriteStringAsync(JsonSerializer.Serialize(result));
            return res;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "FabricAgentChat failed");
            var res = req.CreateResponse(HttpStatusCode.BadRequest);
            res.Headers.Add("Content-Type", MediaTypeNames.Application.Json);
            res.Headers.Add("Access-Control-Allow-Origin", "*");
            await res.WriteStringAsync(JsonSerializer.Serialize(new { success = false, error = ex.Message }));
            return res;
        }
    }
}
