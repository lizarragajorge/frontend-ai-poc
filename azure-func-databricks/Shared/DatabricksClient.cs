using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Configuration;

namespace Shared;

public class DatabricksClient
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _config;
    private readonly JsonSerializerOptions _jsonOptions = new(JsonSerializerDefaults.Web)
    {
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        PropertyNameCaseInsensitive = true
    };

    public DatabricksClient(IHttpClientFactory httpClientFactory, IConfiguration config)
    {
        _httpClientFactory = httpClientFactory;
        _config = config;
    }

    public record DbResult(bool Success, string? Error, List<Dictionary<string, object?>> Rows, string? StatementId = null);

    public async Task<DbResult> ExecuteSqlAsync(string sql, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(sql))
            return new(false, "SQL required", new());

        var warehouseId = _config["DATABRICKS_WAREHOUSE_ID"];
        if (string.IsNullOrWhiteSpace(warehouseId))
            return new(false, "Missing DATABRICKS_WAREHOUSE_ID configuration.", new());

        var client = _httpClientFactory.CreateClient("Databricks");

        var submitPayload = new
        {
            statement = sql,
            warehouse_id = warehouseId,
            wait_timeout = "30s",
            rows_json = true
        };

        var submitResp = await client.PostAsJsonAsync("sql/statements", submitPayload, _jsonOptions, ct);
        if (!submitResp.IsSuccessStatusCode)
        {
            var body = await submitResp.Content.ReadAsStringAsync(ct);
            return new(false, $"Submit failed: {submitResp.StatusCode} {body}", new());
        }

        using var submitDoc = await JsonDocument.ParseAsync(await submitResp.Content.ReadAsStreamAsync(ct), cancellationToken: ct);
        var statementId = submitDoc.RootElement.GetProperty("statement_id").GetString();
        if (string.IsNullOrEmpty(statementId))
            return new(false, "No statement_id returned", new());

        for (int i = 0; i < 30; i++)
        {
            ct.ThrowIfCancellationRequested();
            await Task.Delay(1000, ct);
            var pollResp = await client.GetAsync($"sql/statements/{statementId}", ct);
            if (!pollResp.IsSuccessStatusCode)
            {
                var err = await pollResp.Content.ReadAsStringAsync(ct);
                return new(false, $"Polling failure: {pollResp.StatusCode} {err}", new());
            }

            using var pollDoc = await JsonDocument.ParseAsync(await pollResp.Content.ReadAsStreamAsync(ct), cancellationToken: ct);
            var status = pollDoc.RootElement.GetProperty("status").GetProperty("state").GetString();
            if (status == "SUCCEEDED")
            {
                var list = new List<Dictionary<string, object?>>();
                if (pollDoc.RootElement.TryGetProperty("result", out var result))
                {
                    // Preferred: rows (when rows_json=true is honored)
                    if (result.TryGetProperty("rows", out var rows))
                    {
                        foreach (var row in rows.EnumerateArray())
                        {
                            if (row.ValueKind == JsonValueKind.Object)
                            {
                                var dict = new Dictionary<string, object?>();
                                foreach (var prop in row.EnumerateObject())
                                {
                                    dict[prop.Name] = prop.Value.ValueKind switch
                                    {
                                        JsonValueKind.String => prop.Value.GetString(),
                                        JsonValueKind.Number => prop.Value.TryGetInt64(out var li) ? li : prop.Value.GetDouble(),
                                        JsonValueKind.True => true,
                                        JsonValueKind.False => false,
                                        JsonValueKind.Null => null,
                                        _ => prop.Value.ToString()
                                    };
                                }
                                list.Add(dict);
                            }
                        }
                    }
                    // Fallback: data_array + manifest schema (newer API form) -> synthesize row objects
                    else if (result.TryGetProperty("data_array", out var dataArray) &&
                             dataArray.ValueKind == JsonValueKind.Array)
                    {
                        var columnNames = new List<string>();
                        if (result.TryGetProperty("manifest", out var manifest) &&
                            manifest.TryGetProperty("schema", out var schema) &&
                            schema.TryGetProperty("columns", out var colsEl) &&
                            colsEl.ValueKind == JsonValueKind.Array)
                        {
                            foreach (var col in colsEl.EnumerateArray())
                            {
                                string? name = null;
                                if (col.ValueKind == JsonValueKind.Object && col.TryGetProperty("name", out var nameEl))
                                    name = nameEl.GetString();
                                columnNames.Add(string.IsNullOrEmpty(name) ? $"c{columnNames.Count}" : name!);
                            }
                        }
                        int colCount = columnNames.Count;
                        foreach (var rowArr in dataArray.EnumerateArray())
                        {
                            if (rowArr.ValueKind == JsonValueKind.Array)
                            {
                                var dict = new Dictionary<string, object?>();
                                int idx = 0;
                                foreach (var cell in rowArr.EnumerateArray())
                                {
                                    var colName = idx < colCount ? columnNames[idx] : $"c{idx}";
                                    dict[colName] = cell.ValueKind switch
                                    {
                                        JsonValueKind.String => cell.GetString(),
                                        JsonValueKind.Number => cell.TryGetInt64(out var li) ? li : cell.GetDouble(),
                                        JsonValueKind.True => true,
                                        JsonValueKind.False => false,
                                        JsonValueKind.Null => null,
                                        _ => cell.ToString()
                                    };
                                    idx++;
                                }
                                list.Add(dict);
                            }
                        }
                    }
                }
                return new(true, null, list, statementId);
            }
            if (status == "FAILED" || status == "CANCELED")
            {
                string? detailed = null;
                try
                {
                    var statusEl = pollDoc.RootElement.GetProperty("status");
                    if (statusEl.TryGetProperty("error", out var errorEl))
                    {
                        if (errorEl.ValueKind == JsonValueKind.Object)
                        {
                            if (errorEl.TryGetProperty("message", out var msgEl))
                                detailed = msgEl.GetString();
                            else
                                detailed = errorEl.ToString();
                        }
                        else
                        {
                            detailed = errorEl.ToString();
                        }
                    }
                }
                catch { /* swallow parsing issues */ }
                var combined = detailed is null ? $"Statement {status.ToLowerInvariant()}" : $"Statement {status.ToLowerInvariant()}: {detailed}";
                return new(false, combined, new(), statementId);
            }
        }
        return new(false, "Timed out waiting for statement result", new());
    }
}
