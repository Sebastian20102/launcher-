using System.IO;
using System.Text.Json;
using System.Windows;
using System.Windows.Media;
using NexusLauncherWpf.Models;
using MediaColor = System.Windows.Media.Color;
using MediaColorConverter = System.Windows.Media.ColorConverter;

namespace NexusLauncherWpf.Services;

public sealed class ThemeService
{
    private readonly JsonSerializerOptions _options = new()
    {
        WriteIndented = true,
        PropertyNameCaseInsensitive = true
    };

    public string ThemeDirectory { get; } = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
        "NexusLauncher");

    public string ThemePath => Path.Combine(ThemeDirectory, "theme.json");
    public ThemeSettings Current { get; private set; } = ThemeSettings.Default();

    public async Task<ThemeSettings> LoadAsync()
    {
        Directory.CreateDirectory(ThemeDirectory);
        if (!File.Exists(ThemePath))
        {
            Current = ThemeSettings.Default();
            await SaveAsync(Current);
            Apply(Current);
            return Current;
        }

        await using var stream = File.OpenRead(ThemePath);
        Current = await JsonSerializer.DeserializeAsync<ThemeSettings>(stream, _options) ?? ThemeSettings.Default();
        Apply(Current);
        return Current;
    }

    public async Task SaveAsync(ThemeSettings settings)
    {
        Directory.CreateDirectory(ThemeDirectory);
        var tempPath = $"{ThemePath}.tmp";
        await using (var stream = File.Create(tempPath))
        {
            await JsonSerializer.SerializeAsync(stream, settings, _options);
        }

        File.Move(tempPath, ThemePath, true);
        Current = settings;
        Apply(Current);
    }

    public void Apply(ThemeSettings settings)
    {
        SetColor("ColorBg", settings.Background);
        SetColor("ColorSurface", settings.Surface);
        SetColor("ColorSurface2", settings.Surface2);
        SetColor("ColorSurface3", settings.Surface3);
        SetColor("ColorLine", settings.Line);
        SetColor("ColorText", settings.Text);
        SetColor("ColorMuted", settings.Muted);
        SetColor("ColorAccent", settings.Accent);
        SetColor("ColorAccent2", settings.Accent2);

        SetBrush("BgBrush", settings.Background);
        SetBrush("SurfaceBrush", settings.Surface);
        SetBrush("Surface2Brush", settings.Surface2);
        SetBrush("Surface3Brush", settings.Surface3);
        SetBrush("LineBrush", settings.Line);
        SetBrush("TextBrush", settings.Text);
        SetBrush("MutedBrush", settings.Muted);
        SetBrush("AccentBrush", settings.Accent);
        SetBrush("Accent2Brush", settings.Accent2);

        var compact = settings.Density.Equals("Compact", StringComparison.OrdinalIgnoreCase);
        var spacious = settings.Density.Equals("Spacious", StringComparison.OrdinalIgnoreCase);
        System.Windows.Application.Current.Resources["LauncherCardWidth"] = compact ? 226d : spacious ? 292d : 264d;
        System.Windows.Application.Current.Resources["LauncherCardMinHeight"] = compact ? 248d : spacious ? 318d : 286d;
        System.Windows.Application.Current.Resources["LauncherCardGap"] = compact ? new Thickness(0, 0, 12, 12) : spacious ? new Thickness(0, 0, 22, 22) : new Thickness(0, 0, 18, 18);
    }

    public void OpenThemeFolder()
    {
        Directory.CreateDirectory(ThemeDirectory);
        System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo(ThemeDirectory) { UseShellExecute = true });
    }

    private static void SetColor(string key, string value)
    {
        System.Windows.Application.Current.Resources[key] = ParseColor(value, Colors.Magenta);
    }

    private static void SetBrush(string key, string value)
    {
        var brush = System.Windows.Application.Current.Resources[key] as SolidColorBrush;
        var color = ParseColor(value, Colors.Magenta);
        if (brush is null || brush.IsFrozen)
        {
            System.Windows.Application.Current.Resources[key] = new SolidColorBrush(color);
            return;
        }

        brush.Color = color;
    }

    private static MediaColor ParseColor(string value, MediaColor fallback)
    {
        try
        {
            return (MediaColor)MediaColorConverter.ConvertFromString(value);
        }
        catch
        {
            return fallback;
        }
    }
}
