namespace NexusLauncherWpf.Models;

public sealed class ActivityEntry
{
    public DateTime Timestamp { get; set; } = DateTime.Now;
    public string Title { get; set; } = "";
    public string Detail { get; set; } = "";
    public string Level { get; set; } = "Info";
}
