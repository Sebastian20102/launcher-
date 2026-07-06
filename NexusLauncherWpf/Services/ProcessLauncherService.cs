using System.Diagnostics;
using System.IO;
using NexusLauncherWpf.Models;

namespace NexusLauncherWpf.Services;

public sealed class ProcessLauncherService
{
    public void Open(LauncherItem item)
    {
        if ((item.Type is LauncherItemType.Exe or LauncherItemType.Folder) && !Path.Exists(item.Path))
        {
            throw new FileNotFoundException("No se encontro la ruta configurada.", item.Path);
        }

        var startInfo = item.Type switch
        {
            LauncherItemType.Url => new ProcessStartInfo(item.Path) { UseShellExecute = true },
            LauncherItemType.Folder => new ProcessStartInfo(item.Path) { UseShellExecute = true },
            LauncherItemType.Command => new ProcessStartInfo("powershell.exe", $"-NoExit -Command \"{item.Path} {item.Arguments}\"") { UseShellExecute = true },
            _ => new ProcessStartInfo(item.Path, item.Arguments) { UseShellExecute = true }
        };

        Process.Start(startInfo);
    }

    public void OpenContainingLocation(LauncherItem item)
    {
        if (item.Type is LauncherItemType.Url && !File.Exists(item.Path))
        {
            throw new InvalidOperationException("Este acceso es una URL y no tiene carpeta local.");
        }

        if (item.Type is LauncherItemType.Command)
        {
            Process.Start(new ProcessStartInfo("powershell.exe", "-NoExit") { UseShellExecute = true });
            return;
        }

        if (!Path.Exists(item.Path))
        {
            throw new FileNotFoundException("No se encontro la ruta configurada.", item.Path);
        }

        var explorerArgs = Directory.Exists(item.Path) ? $"\"{item.Path}\"" : $"/select,\"{item.Path}\"";
        Process.Start(new ProcessStartInfo("explorer.exe", explorerArgs) { UseShellExecute = true });
    }
}
