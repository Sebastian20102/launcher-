using NexusLauncherWpf.Helpers;
using NexusLauncherWpf.Models;

namespace NexusLauncherWpf.ViewModels;

public sealed class LauncherItemViewModel : ObservableObject
{
    private bool _isInfoOpen;
    private bool _isLaunchTargetValid;

    public LauncherItemViewModel(LauncherItem item)
    {
        Item = item;
        RefreshValidation();
    }

    public LauncherItem Item { get; }
    public string Id => Item.Id;
    public string Name => Item.Name;
    public string Description => Item.Description;
    public string Path => Item.Path;
    public string Category => Item.Category.ToString();
    public string Type => Item.Type.ToString();
    public string OpenCountText => $"{Item.OpenCount} usos";
    public string LastOpenedText => Item.LastOpened?.ToString("dd/MM/yyyy HH:mm") ?? "Nunca abierto";
    public string Initials => string.Join("", Name.Split(' ', StringSplitOptions.RemoveEmptyEntries).Take(2).Select(part => char.ToUpperInvariant(part[0])));
    public string PathStatus => IsLaunchTargetValid ? "Ruta OK" : "Revisar ruta";
    public string LaunchMeta => $"{Type} / {Category}";

    public bool IsInfoOpen
    {
        get => _isInfoOpen;
        set => SetProperty(ref _isInfoOpen, value);
    }

    public string CategoryGlyph => Item.Category switch
    {
        LauncherCategory.Juegos => "GAME",
        LauncherCategory.Programacion => "DEV",
        LauncherCategory.IA => "AI",
        LauncherCategory.Diseno => "ART",
        LauncherCategory.Carpetas => "DIR",
        LauncherCategory.Web => "WEB",
        _ => "APP"
    };

    public string CoverStart => Item.Category switch
    {
        LauncherCategory.Juegos => "#2A3140",
        LauncherCategory.Programacion => "#263445",
        LauncherCategory.IA => "#303348",
        LauncherCategory.Diseno => "#3A3140",
        LauncherCategory.Carpetas => "#2D3540",
        LauncherCategory.Web => "#2B3442",
        _ => "#2A303B"
    };

    public string CoverEnd => Item.Category switch
    {
        LauncherCategory.Juegos => "#8C7A5A",
        LauncherCategory.Programacion => "#6F8A96",
        LauncherCategory.IA => "#8A7AA5",
        LauncherCategory.Diseno => "#A1766E",
        LauncherCategory.Carpetas => "#7C8B78",
        LauncherCategory.Web => "#6D7FA0",
        _ => "#7B8492"
    };

    public bool IsFavorite
    {
        get => Item.IsFavorite;
        set
        {
            if (Item.IsFavorite == value)
            {
                return;
            }

            Item.IsFavorite = value;
            OnPropertyChanged();
            OnPropertyChanged(nameof(FavoriteGlyph));
        }
    }

    public string FavoriteGlyph => IsFavorite ? "*" : "+";

    public bool IsLaunchTargetValid => _isLaunchTargetValid;

    public void RefreshValidation()
    {
        var isValid = CalculateLaunchTargetValid();
        if (SetProperty(ref _isLaunchTargetValid, isValid, nameof(IsLaunchTargetValid)))
        {
            OnPropertyChanged(nameof(PathStatus));
        }
    }

    private bool CalculateLaunchTargetValid()
    {
        if (Item.Type is LauncherItemType.Url)
        {
            return System.IO.File.Exists(Item.Path)
                || Uri.TryCreate(Item.Path, UriKind.Absolute, out var uri) && uri.Scheme is "http" or "https";
        }

        if (Item.Type is LauncherItemType.Command)
        {
            return !string.IsNullOrWhiteSpace(Item.Path);
        }

        return System.IO.Path.Exists(Item.Path);
    }
}
