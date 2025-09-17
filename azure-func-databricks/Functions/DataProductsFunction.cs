using System.Net;
using System.Text.Json;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using Shared;

namespace Functions;

public class DataProductsFunction
{
    private readonly DatabricksClient _client;
    private readonly ILogger _logger;

    public DataProductsFunction(DatabricksClient client, ILoggerFactory loggerFactory)
    {
        _client = client;
        _logger = loggerFactory.CreateLogger<DataProductsFunction>();
    }

    // GET /api/data-products?limit=100
    [Function("DataProducts")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Function, "get", Route = "data-products")] HttpRequestData req)
    {
        try
        {
            int limit = 500; // hard cap safeguard
            int requested = 100;
            var query = System.Web.HttpUtility.ParseQueryString(req.Url.Query);
            if (int.TryParse(query.Get("limit"), out var parsed) && parsed > 0)
            {
                requested = parsed;
            }
            if (requested > limit) requested = limit;

            // User provided fixed query (PoC): select * from tpch.external_inf_schema.schema_details
            // We append limit via subquery if needed.
            string baseSql = "select * from tpch.external_inf_schema.schema_details";
            string finalSql = requested > 0 ? baseSql + $" limit {requested}" : baseSql;

            var result = await _client.ExecuteSqlAsync(finalSql, req.FunctionContext.CancellationToken);
            var status = result.Success ? HttpStatusCode.OK : HttpStatusCode.BadRequest;
            var resp = req.CreateResponse(status);
            resp.Headers.Add("Access-Control-Allow-Origin", "*");
            resp.Headers.Add("Content-Type", "application/json");
            var payload = new {
                success = result.Success,
                error = result.Error,
                count = result.Rows.Count,
                rows = result.Rows,
                statementId = result.StatementId,
                sql = finalSql
            };
            await resp.WriteStringAsync(JsonSerializer.Serialize(payload));
            return resp;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled error in DataProducts function");
            var errorResp = req.CreateResponse(HttpStatusCode.InternalServerError);
            errorResp.Headers.Add("Access-Control-Allow-Origin", "*");
            await errorResp.WriteStringAsync(JsonSerializer.Serialize(new { error = ex.Message }));
            return errorResp;
        }
    }
}
