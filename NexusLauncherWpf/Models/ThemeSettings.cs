namespace NexusLauncherWpf.Models;

public sealed class ThemeSettings
{
    public string Name { get; set; } = "Nexus Gold";
    public string Background { get; set; } = "#090A0D";
    public string Surface { get; set; } = "#12151B";
    public string Surface2 { get; set; } = "#1A1F28";
    public string Surface3 { get; set; } = "#232A35";
    public string Line { get; set; } = "#303846";
    public string Text { get; set; } = "#F2F1EC";
    public string Muted { get; set; } = "#A7A39A";
    public string Accent { get; set; } = "#C8A96A";
    public string Accent2 { get; set; } = "#8F9C8A";
    public string Density { get; set; } = "Comfortable";
    public bool Animations { get; set; } = true;

    public static ThemeSettings Default() => new();

    public static ThemeSettings Slate() => new()
    {
        Name = "Slate Glass",
        Background = "#080A0E",
        Surface = "#10151C",
        Surface2 = "#17202B",
        Surface3 = "#222C38",
        Line = "#344152",
        Text = "#F3F6F8",
        Muted = "#9EABB8",
        Accent = "#9DB7C9",
        Accent2 = "#7F9A8A"
    };

    public static ThemeSettings Ember() => new()
    {
        Name = "Ember Black",
        Background = "#0B0908",
        Surface = "#15110F",
        Surface2 = "#211A16",
        Surface3 = "#2D241F",
        Line = "#46362F",
        Text = "#F4EFEA",
        Muted = "#B1A49A",
        Accent = "#C89962",
        Accent2 = "#A86F5C"
    };
}
