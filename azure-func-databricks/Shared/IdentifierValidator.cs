using System.Text.RegularExpressions;

namespace Shared;

public static class IdentifierValidator
{
    private static readonly Regex Allowed = new("^[A-Za-z0-9_]+$", RegexOptions.Compiled);

    public static bool IsSafe(string? value) => !string.IsNullOrWhiteSpace(value) && Allowed.IsMatch(value!);

    public static string? EnsureSafe(string? value) => IsSafe(value) ? value : null;
}
