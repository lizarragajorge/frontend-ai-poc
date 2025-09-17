using System.Net;
using System.Text.Json;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using Shared;

namespace Functions;

public class TablesByProductFunction
{
    private readonly DatabricksClient _client;
    private readonly ILogger _logger;

    public TablesByProductFunction(DatabricksClient client, ILoggerFactory loggerFactory)
    {
        _client = client;
        _logger = loggerFactory.CreateLogger<TablesByProductFunction>();
    }

    // GET /api/data-products/{product}/tables
    [Function("TablesByProduct")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Function, "get", Route = "data-products/{product}/tables")] HttpRequestData req,
        string product)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(product))
            {
                var bad = req.CreateResponse(HttpStatusCode.BadRequest);
                bad.Headers.Add("Access-Control-Allow-Origin", "*");
                await bad.WriteStringAsync("{\"success\":false,\"error\":\"Missing product\"}");
                return bad;
            }

            // Basic sanitize: escape single quotes for literal; optional stricter regex
            var safeProduct = product.Replace("'", "''");
            var sql = $@"select table_catalog, table_schema, table_name, table_type
from tpch.information_schema.tables
where table_schema in (
  select distinct schema_name from tpch.external_inf_schema.schema_details where data_product = '{safeProduct}'
)
order by table_schema, table_name";

            var result = await _client.ExecuteSqlAsync(sql, req.FunctionContext.CancellationToken);
            var status = result.Success ? HttpStatusCode.OK : HttpStatusCode.BadRequest;
            var resp = req.CreateResponse(status);
            resp.Headers.Add("Access-Control-Allow-Origin", "*");
            resp.Headers.Add("Content-Type", "application/json");
            var payload = new
            {
                success = result.Success,
                error = result.Error,
                count = result.Rows.Count,
                rows = result.Rows,
                statementId = result.StatementId,
                product,
                sql
            };
            await resp.WriteStringAsync(JsonSerializer.Serialize(payload));
            return resp;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled error in TablesByProduct");
            var err = req.CreateResponse(HttpStatusCode.InternalServerError);
            err.Headers.Add("Access-Control-Allow-Origin", "*");
            await err.WriteStringAsync(JsonSerializer.Serialize(new { success = false, error = ex.Message }));
            return err;
        }
    }
}
