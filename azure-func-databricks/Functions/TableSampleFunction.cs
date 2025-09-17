using System.Net;
using System.Text.Json;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using Shared;

namespace Functions;

public class TableSampleFunction
{
    private readonly DatabricksClient _client;
    private readonly ILogger _logger;

    public TableSampleFunction(DatabricksClient client, ILoggerFactory loggerFactory)
    {
        _client = client;
        _logger = loggerFactory.CreateLogger<TableSampleFunction>();
    }

    [Function("TableSample")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Function, "get", Route = "table-sample")] HttpRequestData req)
    {
        var resp = req.CreateResponse();
        resp.Headers.Add("Access-Control-Allow-Origin", "*");
        resp.Headers.Add("Content-Type", "application/json");

        try
        {
            var query = System.Web.HttpUtility.ParseQueryString(req.Url.Query);
            var catalog = query.Get("catalog");
            var schema = query.Get("schema");
            var table = query.Get("table");
            var limitStr = query.Get("limit");

            if (string.IsNullOrWhiteSpace(catalog) || string.IsNullOrWhiteSpace(schema) || string.IsNullOrWhiteSpace(table))
            {
                resp.StatusCode = HttpStatusCode.BadRequest;
                await resp.WriteStringAsync(JsonSerializer.Serialize(new { success = false, error = "catalog, schema, and table are required" }));
                return resp;
            }

            // identifier safety: alphanumeric + underscore only
            bool Safe(string? s) => s is not null && System.Text.RegularExpressions.Regex.IsMatch(s, "^[A-Za-z0-9_]+$");
            if (!Safe(catalog) || !Safe(schema) || !Safe(table))
            {
                resp.StatusCode = HttpStatusCode.BadRequest;
                await resp.WriteStringAsync(JsonSerializer.Serialize(new { success = false, error = "Invalid identifier(s)" }));
                return resp;
            }

            int limit = 5;
            if (int.TryParse(limitStr, out var parsed))
            {
                limit = Math.Clamp(parsed, 1, 50);
            }

            var sql = $"select * from {catalog}.{schema}.{table} limit {limit}";

            var result = await _client.ExecuteSqlAsync(sql, req.FunctionContext.CancellationToken);
            resp.StatusCode = result.Success ? HttpStatusCode.OK : HttpStatusCode.BadRequest;
            await resp.WriteStringAsync(JsonSerializer.Serialize(new {
                success = result.Success,
                error = result.Error,
                count = result.Rows.Count,
                rows = result.Rows,
                sql,
                catalog,
                schema,
                table
            }));
            return resp;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled error in TableSample");
            resp.StatusCode = HttpStatusCode.InternalServerError;
            await resp.WriteStringAsync(JsonSerializer.Serialize(new { success = false, error = ex.Message }));
            return resp;
        }
    }
}
