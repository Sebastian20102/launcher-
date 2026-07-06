namespace NexusLauncherWpf.Models;

public sealed class LauncherData
{
    public AppSettings Settings { get; set; } = new();
    public GamingModeProfile GamingMode { get; set; } = new();
    public List<LauncherItem> Items { get; set; } = [];
    public List<ActivityEntry> Activity { get; set; } = [];
}
