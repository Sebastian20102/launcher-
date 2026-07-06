using System.IO;
using System.Text.Json;
using NexusLauncherWpf.Models;

namespace NexusLauncherWpf.Services;

public sealed class JsonStorageService
{
    private readonly JsonSerializerOptions _options = new()
    {
        WriteIndented = true,
        PropertyNameCaseInsensitive = true
    };

    public string DataDirectory { get; } = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
        "NexusLauncher");

    public string DataPath => Path.Combine(DataDirectory, "launcher-data.json");
    public string ExportDirectory => Path.Combine(DataDirectory, "exports");
    public string BackupDirectory => Path.Combine(DataDirectory, "backups");

    public async Task<LauncherData> LoadAsync()
    {
        Directory.CreateDirectory(DataDirectory);
        if (!File.Exists(DataPath))
        {
            var demo = DemoDataFactory.Create();
            await SaveAsync(demo);
            return demo;
        }

        try
        {
            await using var stream = File.OpenRead(DataPath);
            return await JsonSerializer.DeserializeAsync<LauncherData>(stream, _options) ?? DemoDataFactory.Create();
        }
        catch
        {
            var backup = GetLatestBackupPath();
            if (backup is not null)
            {
                await using var backupStream = File.OpenRead(backup);
                return await JsonSerializer.DeserializeAsync<LauncherData>(backupStream, _options) ?? DemoDataFactory.Create();
            }

            throw;
        }
    }

    public async Task SaveAsync(LauncherData data)
    {
        Directory.CreateDirectory(DataDirectory);
        CreateBackupIfNeeded();

        var tempPath = $"{DataPath}.tmp";
        await using (var stream = File.Create(tempPath))
        {
            await JsonSerializer.SerializeAsync(stream, data, _options);
        }

        File.Move(tempPath, DataPath, true);
        PruneBackups();
    }

    public async Task<LauncherData> LoadFromFileAsync(string path)
    {
        await using var stream = File.OpenRead(path);
        return await JsonSerializer.DeserializeAsync<LauncherData>(stream, _options)
            ?? throw new InvalidDataException("El archivo no contiene una biblioteca valida.");
    }

    public async Task<string> ExportAsync(LauncherData data)
    {
        Directory.CreateDirectory(ExportDirectory);
        var exportPath = Path.Combine(ExportDirectory, $"nexus-launcher-{DateTime.Now:yyyyMMdd-HHmmss}.json");
        await using var stream = File.Create(exportPath);
        await JsonSerializer.SerializeAsync(stream, data, _options);
        return exportPath;
    }

    public string? CreateManualBackup()
    {
        Directory.CreateDirectory(BackupDirectory);
        if (!File.Exists(DataPath))
        {
            return null;
        }

        var backupPath = Path.Combine(BackupDirectory, $"launcher-data-manual-{DateTime.Now:yyyyMMdd-HHmmss}.json");
        File.Copy(DataPath, backupPath, true);
        return backupPath;
    }

    public string? GetLatestBackupPath()
    {
        if (!Directory.Exists(BackupDirectory))
        {
            return null;
        }

        return Directory.EnumerateFiles(BackupDirectory, "*.json")
            .OrderByDescending(File.GetLastWriteTimeUtc)
            .FirstOrDefault();
    }

    private void CreateBackupIfNeeded()
    {
        if (!File.Exists(DataPath))
        {
            return;
        }

        Directory.CreateDirectory(BackupDirectory);
        var backupPath = Path.Combine(BackupDirectory, $"launcher-data-auto-{DateTime.Now:yyyyMMdd-HHmmss}.json");
        File.Copy(DataPath, backupPath, true);
    }

    private void PruneBackups()
    {
        if (!Directory.Exists(BackupDirectory))
        {
            return;
        }

        foreach (var oldBackup in Directory.EnumerateFiles(BackupDirectory, "*.json")
                     .OrderByDescending(File.GetLastWriteTimeUtc)
                     .Skip(12))
        {
            File.Delete(oldBackup);
        }
    }
}
