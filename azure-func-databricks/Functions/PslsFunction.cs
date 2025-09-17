using System.Net;
using System.Text.Json;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using Shared;

namespace Functions;

public class PslsFunction
{
    private readonly DatabricksClient _client;
    private readonly ILogger _logger;

    public PslsFunction(DatabricksClient client, ILoggerFactory loggerFactory)
    {
        _client = client;
        _logger = loggerFactory.CreateLogger<PslsFunction>();
    }

    // GET /api/psls
    [Function("Psls")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Function, "get", Route = "psls")] HttpRequestData req)
    {
        try
        {
            const string sql = "select distinct PSL from tpch.external_inf_schema.schema_details order by PSL";
            var result = await _client.ExecuteSqlAsync(sql, req.FunctionContext.CancellationToken);
            var status = result.Success ? HttpStatusCode.OK : HttpStatusCode.BadRequest;
            var resp = req.CreateResponse(status);
            resp.Headers.Add("Access-Control-Allow-Origin", "*");
            resp.Headers.Add("Content-Type", "application/json");
            var payload = new { success = result.Success, error = result.Error, count = result.Rows.Count, rows = result.Rows, statementId = result.StatementId };
            await resp.WriteStringAsync(JsonSerializer.Serialize(payload));
            return resp;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled error in Psls function");
            var err = req.CreateResponse(HttpStatusCode.InternalServerError);
            err.Headers.Add("Access-Control-Allow-Origin", "*");
            await err.WriteStringAsync(JsonSerializer.Serialize(new { error = ex.Message }));
            return err;
        }
    }
}
