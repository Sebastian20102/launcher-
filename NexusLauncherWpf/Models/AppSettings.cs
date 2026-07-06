namespace NexusLauncherWpf.Models;

public sealed class AppSettings
{
    public string Theme { get; set; } = "Dark";
    public string AccentColor { get; set; } = "#57D7BF";
    public bool StartInGamingMode { get; set; }
    public string DataFileName { get; set; } = "launcher-data.json";
}
