using System.Net;
using System.Text.Json;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using Shared;

namespace Functions;

public class DatabricksQueryFunction
{
    private readonly DatabricksClient _client;
    private readonly ILogger _logger;

    public DatabricksQueryFunction(DatabricksClient client, ILoggerFactory loggerFactory)
    {
        _client = client;
        _logger = loggerFactory.CreateLogger<DatabricksQueryFunction>();
    }

    [Function("DatabricksQuery")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Function, "get", "post", Route = "databricks/query")] HttpRequestData req)
    {
        try
        {
            string? sql = null;

            if (req.Method.Equals("GET", StringComparison.OrdinalIgnoreCase))
            {
                var query = req.Url.Query; // includes leading ?
                if (!string.IsNullOrEmpty(query))
                {
                    foreach (var pair in query.TrimStart('?').Split('&', StringSplitOptions.RemoveEmptyEntries))
                    {
                        var kv = pair.Split('=', 2);
                        if (kv.Length == 2 && kv[0] == "sql")
                        {
                            var raw = Uri.UnescapeDataString(kv[1]);
                            // Handle application/x-www-form-urlencoded style where '+' represents space
                            sql = raw.Replace('+', ' ');
                            break;
                        }
                    }
                }
            }
            else if (req.Method.Equals("POST", StringComparison.OrdinalIgnoreCase))
            {
                using var reader = new StreamReader(req.Body);
                var body = await reader.ReadToEndAsync();
                if (!string.IsNullOrWhiteSpace(body))
                {
                    try
                    {
                        using var doc = JsonDocument.Parse(body);
                        if (doc.RootElement.TryGetProperty("sql", out var sqlProp))
                        {
                            sql = sqlProp.GetString();
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Invalid JSON body");
                    }
                }
            }

            // Default query changed to user-requested catalog metadata enumeration.
            // NOTE: This may return a large result set; consider adding a LIMIT if needed.
            sql ??= "select count(*) as cnt from system.information_schema.tables";

            var dbResult = await _client.ExecuteSqlAsync(sql, req.FunctionContext.CancellationToken);
            var status = dbResult.Success ? HttpStatusCode.OK : HttpStatusCode.BadRequest;
            var response = req.CreateResponse(status);
            response.Headers.Add("Access-Control-Allow-Origin", "*");
            response.Headers.Add("Access-Control-Allow-Headers", "Content-Type");
            response.Headers.Add("Content-Type", "application/json");
            var payload = new {
                success = dbResult.Success,
                error = dbResult.Error,
                rows = dbResult.Rows,
                statementId = dbResult.StatementId,
                sql = dbResult.Success ? null : sql // echo back sql only on failure for debugging
            };
            await response.WriteStringAsync(JsonSerializer.Serialize(payload));
            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled error in DatabricksQuery function");
            var errorResp = req.CreateResponse(HttpStatusCode.InternalServerError);
            errorResp.Headers.Add("Access-Control-Allow-Origin", "*");
            await errorResp.WriteStringAsync(JsonSerializer.Serialize(new { error = ex.Message }));
            return errorResp;
        }
    }
}
