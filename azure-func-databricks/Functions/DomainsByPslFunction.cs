using System.Net;
using System.Text.Json;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using Shared;

namespace Functions;

public class DomainsByPslFunction
{
    private readonly DatabricksClient _client;
    private readonly ILogger _logger;

    public DomainsByPslFunction(DatabricksClient client, ILoggerFactory loggerFactory)
    {
        _client = client;
        _logger = loggerFactory.CreateLogger<DomainsByPslFunction>();
    }

    // GET /api/psls/{psl}/domains
    [Function("DomainsByPsl")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Function, "get", Route = "psls/{psl}/domains")] HttpRequestData req, string psl)
    {
        try
        {
            if (!IdentifierValidator.IsSafe(psl))
            {
                var bad = req.CreateResponse(HttpStatusCode.BadRequest);
                await bad.WriteStringAsync(JsonSerializer.Serialize(new { error = "Invalid PSL identifier" }));
                return bad;
            }
            string sql = $"select distinct category_domain from tpch.external_inf_schema.schema_details where PSL = '{psl}' order by category_domain";
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
            _logger.LogError(ex, "Unhandled error in DomainsByPsl function");
            var err = req.CreateResponse(HttpStatusCode.InternalServerError);
            err.Headers.Add("Access-Control-Allow-Origin", "*");
            await err.WriteStringAsync(JsonSerializer.Serialize(new { error = ex.Message }));
            return err;
        }
    }
}
