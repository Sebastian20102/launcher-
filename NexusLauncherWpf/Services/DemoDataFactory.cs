using System.IO;
using NexusLauncherWpf.Models;

namespace NexusLauncherWpf.Services;

public static class DemoDataFactory
{
    public static LauncherData Create()
    {
        var data = new LauncherData();
        data.Items =
        [
            new LauncherItem
            {
                Name = "Steam",
                Description = "Abrir biblioteca de Steam.",
                Path = @"C:\Program Files (x86)\Steam\steam.exe",
                Type = LauncherItemType.Exe,
                Category = LauncherCategory.Juegos,
                IsFavorite = true
            },
            new LauncherItem
            {
                Name = "Visual Studio Code",
                Description = "Editor principal para programacion.",
                Path = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Programs\Microsoft VS Code\Code.exe"),
                Type = LauncherItemType.Exe,
                Category = LauncherCategory.Programacion,
                IsFavorite = true
            },
            new LauncherItem
            {
                Name = "ChatGPT",
                Description = "Abrir ChatGPT en el navegador.",
                Path = "https://chatgpt.com",
                Type = LauncherItemType.Url,
                Category = LauncherCategory.IA,
                IsFavorite = true
            },
            new LauncherItem
            {
                Name = "Documentos",
                Description = "Carpeta de documentos del usuario.",
                Path = Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments),
                Type = LauncherItemType.Folder,
                Category = LauncherCategory.Carpetas
            },
            new LauncherItem
            {
                Name = "PowerShell",
                Description = "Terminal para comandos locales.",
                Path = "powershell.exe",
                Type = LauncherItemType.Command,
                Category = LauncherCategory.Utilidades
            }
        ];

        data.GamingMode.LauncherItemIds = data.Items.Where(item => item.Category == LauncherCategory.Juegos).Select(item => item.Id).ToList();
        return data;
    }
}
