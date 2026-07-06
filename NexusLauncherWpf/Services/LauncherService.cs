using System.IO;
using NexusLauncherWpf.Models;

namespace NexusLauncherWpf.Services;

public sealed class LauncherService
{
    private readonly JsonStorageService _storage;
    private readonly ProcessLauncherService _processLauncher;
    private readonly ToastService _toasts;

    public LauncherService(JsonStorageService storage, ProcessLauncherService processLauncher, ToastService toasts)
    {
        _storage = storage;
        _processLauncher = processLauncher;
        _toasts = toasts;
    }

    public LauncherData Data { get; private set; } = new();

    public async Task LoadAsync()
    {
        Data = await _storage.LoadAsync();
    }

    public async Task SaveAsync() => await _storage.SaveAsync(Data);

    public async Task OpenAsync(LauncherItem item)
    {
        try
        {
            _processLauncher.Open(item);
            item.LastOpened = DateTime.Now;
            item.OpenCount++;
            AddActivity("Acceso abierto", item.Name, "Success");
            await SaveAsync();
            _toasts.Success($"Abriendo {item.Name}");
        }
        catch (Exception ex)
        {
            AddActivity("Error al abrir", $"{item.Name}: {ex.Message}", "Error");
            _toasts.Error($"No se pudo abrir {item.Name}: {ex.Message}");
        }
    }

    public void OpenContainingLocation(LauncherItem item)
    {
        try
        {
            _processLauncher.OpenContainingLocation(item);
            AddActivity("Ubicacion abierta", item.Name, "Info");
            _toasts.Success($"Ubicacion abierta: {item.Name}");
        }
        catch (Exception ex)
        {
            AddActivity("Error de ubicacion", $"{item.Name}: {ex.Message}", "Error");
            _toasts.Error($"No se pudo abrir la ubicacion: {ex.Message}");
        }
    }

    public async Task OpenGamingModeAsync()
    {
        var items = Data.Items.Where(item => Data.GamingMode.LauncherItemIds.Contains(item.Id)).ToList();
        if (items.Count == 0)
        {
            _toasts.Error("Modo Gaming no tiene accesos configurados.");
            return;
        }

        foreach (var item in items)
        {
            await OpenAsync(item);
        }
    }

    public bool IsInGamingMode(LauncherItem item)
    {
        return Data.GamingMode.LauncherItemIds.Contains(item.Id);
    }

    public void SetGamingMode(LauncherItem item, bool enabled)
    {
        if (enabled && !Data.GamingMode.LauncherItemIds.Contains(item.Id))
        {
            Data.GamingMode.LauncherItemIds.Add(item.Id);
        }

        if (!enabled)
        {
            Data.GamingMode.LauncherItemIds.Remove(item.Id);
        }
    }

    public LauncherItem Duplicate(LauncherItem source)
    {
        var copy = new LauncherItem
        {
            Name = $"{source.Name} copia",
            Description = source.Description,
            Path = source.Path,
            Arguments = source.Arguments,
            Type = source.Type,
            Category = source.Category,
            IconPath = source.IconPath,
            CoverImagePath = source.CoverImagePath,
            IsFavorite = false
        };

        Data.Items.Add(copy);
        AddActivity("Acceso duplicado", source.Name, "Info");
        _toasts.Success($"Duplicado: {source.Name}");
        return copy;
    }

    public IReadOnlyList<LauncherItem> GetInvalidItems()
    {
        return Data.Items.Where(item => !IsLaunchTargetValid(item)).ToList();
    }

    public async Task<string> ExportAsync()
    {
        var path = await _storage.ExportAsync(Data);
        AddActivity("Export JSON", path, "Success");
        _toasts.Success($"JSON exportado: {path}");
        return path;
    }

    public async Task ImportAsync(string path)
    {
        _storage.CreateManualBackup();
        var imported = await _storage.LoadFromFileAsync(path);
        Data = imported;
        AddActivity("Biblioteca importada", Path.GetFileName(path), "Success");
        await SaveAsync();
        _toasts.Success("Biblioteca importada");
    }

    public string? CreateBackup()
    {
        var backup = _storage.CreateManualBackup();
        AddActivity("Backup manual", backup ?? "Sin biblioteca para respaldar", backup is null ? "Info" : "Success");
        _toasts.Success(backup is null ? "No hay biblioteca para respaldar" : "Backup creado");
        return backup;
    }

    public void OpenBackupFolder()
    {
        Directory.CreateDirectory(_storage.BackupDirectory);
        System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo(_storage.BackupDirectory) { UseShellExecute = true });
        _toasts.Success("Carpeta de backups abierta");
    }

    public async Task<IReadOnlyList<LauncherItem>> DiscoverWindowsShortcutsAsync()
    {
        var existingPaths = Data.Items
            .Select(item => item.Path)
            .Where(path => !string.IsNullOrWhiteSpace(path))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        var candidates = GetDiscoveryRoots()
            .Where(Directory.Exists)
            .SelectMany(GetShortcutCandidates)
            .Where(path => !existingPaths.Contains(path))
            .Where(IsUsefulShortcut)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(80)
            .ToList();

        var imported = new List<LauncherItem>();
        foreach (var path in candidates)
        {
            var item = CreateItemFromPath(path);
            Data.Items.Add(item);
            imported.Add(item);
            existingPaths.Add(path);
        }

        if (imported.Count > 0)
        {
            await SaveAsync();
            AddActivity("Deteccion de Windows", $"{imported.Count} accesos importados", "Success");
            _toasts.Success($"{imported.Count} accesos detectados");
        }
        else
        {
            AddActivity("Deteccion de Windows", "Sin accesos nuevos", "Info");
            _toasts.Success("No se encontraron accesos nuevos");
        }

        return imported;
    }

    public void OpenDataFolder()
    {
        Directory.CreateDirectory(_storage.DataDirectory);
        System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo(_storage.DataDirectory) { UseShellExecute = true });
        _toasts.Success("Carpeta de datos abierta");
    }

    private static bool IsLaunchTargetValid(LauncherItem item)
    {
        if (item.Type is LauncherItemType.Url)
        {
            return File.Exists(item.Path)
                || Uri.TryCreate(item.Path, UriKind.Absolute, out var uri) && uri.Scheme is "http" or "https";
        }

        if (item.Type is LauncherItemType.Command)
        {
            return !string.IsNullOrWhiteSpace(item.Path);
        }

        return Path.Exists(item.Path);
    }

    private static IEnumerable<string> GetDiscoveryRoots()
    {
        yield return Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
        yield return Environment.GetFolderPath(Environment.SpecialFolder.CommonDesktopDirectory);
        yield return Environment.GetFolderPath(Environment.SpecialFolder.StartMenu);
        yield return Environment.GetFolderPath(Environment.SpecialFolder.CommonStartMenu);
    }

    private static IEnumerable<string> GetShortcutCandidates(string root)
    {
        try
        {
            return Directory.EnumerateFiles(root, "*.*", SearchOption.AllDirectories)
                .Where(path => path.EndsWith(".lnk", StringComparison.OrdinalIgnoreCase)
                    || path.EndsWith(".exe", StringComparison.OrdinalIgnoreCase)
                    || path.EndsWith(".bat", StringComparison.OrdinalIgnoreCase)
                    || path.EndsWith(".cmd", StringComparison.OrdinalIgnoreCase)
                    || path.EndsWith(".url", StringComparison.OrdinalIgnoreCase));
        }
        catch
        {
            return [];
        }
    }

    private static bool IsUsefulShortcut(string path)
    {
        var name = Path.GetFileNameWithoutExtension(path).ToLowerInvariant();
        return !string.IsNullOrWhiteSpace(name)
            && !name.Contains("uninstall")
            && !name.Contains("desinstalar")
            && !name.Contains("readme")
            && !name.Contains("help")
            && !name.Contains("manual")
            && !name.Contains("license");
    }

    private static LauncherItem CreateItemFromPath(string path)
    {
        var name = Path.GetFileNameWithoutExtension(path).Replace("_", " ").Trim();
        var category = GuessCategory(path, name);
        var type = path.EndsWith(".url", StringComparison.OrdinalIgnoreCase)
            ? LauncherItemType.Url
            : path.EndsWith(".bat", StringComparison.OrdinalIgnoreCase) || path.EndsWith(".cmd", StringComparison.OrdinalIgnoreCase)
                ? LauncherItemType.Command
                : LauncherItemType.Exe;

        return new LauncherItem
        {
            Name = name,
            Description = $"Detectado automaticamente desde Windows.",
            Path = path,
            Type = type,
            Category = category,
            IsFavorite = category is LauncherCategory.Juegos or LauncherCategory.Programacion
        };
    }

    private static LauncherCategory GuessCategory(string path, string name)
    {
        var text = $"{path} {name}".ToLowerInvariant();
        if (text.Contains("steam") || text.Contains("epic") || text.Contains("game") || text.Contains("battle.net") || text.Contains("gog"))
        {
            return LauncherCategory.Juegos;
        }

        if (text.Contains("visual studio") || text.Contains("code") || text.Contains("cursor") || text.Contains("git") || text.Contains("python") || text.Contains("node"))
        {
            return LauncherCategory.Programacion;
        }

        if (text.Contains("chatgpt") || text.Contains("copilot") || text.Contains("ai") || text.Contains("claude"))
        {
            return LauncherCategory.IA;
        }

        if (text.Contains("figma") || text.Contains("adobe") || text.Contains("photoshop") || text.Contains("illustrator") || text.Contains("blender"))
        {
            return LauncherCategory.Diseno;
        }

        if (text.Contains("chrome") || text.Contains("edge") || text.Contains("firefox") || text.Contains(".url"))
        {
            return LauncherCategory.Web;
        }

        return LauncherCategory.Utilidades;
    }

    public async Task DeleteAsync(LauncherItem item)
    {
        Data.Items.Remove(item);
        Data.GamingMode.LauncherItemIds.Remove(item.Id);
        AddActivity("Acceso eliminado", item.Name, "Info");
        await SaveAsync();
        _toasts.Success($"{item.Name} eliminado");
    }

    private void AddActivity(string title, string detail, string level)
    {
        Data.Activity.Insert(0, new ActivityEntry
        {
            Title = title,
            Detail = detail,
            Level = level,
            Timestamp = DateTime.Now
        });

        if (Data.Activity.Count > 80)
        {
            Data.Activity.RemoveRange(80, Data.Activity.Count - 80);
        }
    }
}
