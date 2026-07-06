namespace NexusLauncherWpf.Models;

public sealed class LauncherItem
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public string Path { get; set; } = "";
    public string Arguments { get; set; } = "";
    public LauncherItemType Type { get; set; } = LauncherItemType.Exe;
    public LauncherCategory Category { get; set; } = LauncherCategory.Utilidades;
    public string IconPath { get; set; } = "";
    public string CoverImagePath { get; set; } = "";
    public bool IsFavorite { get; set; }
    public DateTime? LastOpened { get; set; }
    public int OpenCount { get; set; }
}
