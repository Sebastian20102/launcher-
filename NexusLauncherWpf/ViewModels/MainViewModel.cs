using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Windows;
using System.Windows.Data;
using System.Windows.Input;
using Microsoft.Win32;
using NexusLauncherWpf.Helpers;
using NexusLauncherWpf.Models;
using NexusLauncherWpf.Services;

namespace NexusLauncherWpf.ViewModels;

public sealed class MainViewModel : ObservableObject
{
    private readonly LauncherService _launcherService;
    private readonly ToastService _toastService;
    private readonly ThemeService _themeService;
    private string _currentView = "Inicio";
    private string _searchText = "";
    private string _selectedCategory = "Todos";
    private LauncherItemViewModel? _selectedItem;
    private string _toastMessage = "";
    private bool _isToastVisible;
    private bool _isErrorToast;
    private bool _isBusy;
    private bool _isCommandPaletteOpen;
    private string _commandQuery = "";
    private string _busyMessage = "Preparando Nexus";
    private int _currentPage;
    private IReadOnlyList<LauncherItemViewModel> _filteredItems = [];
    private IReadOnlyList<LauncherItemViewModel> _pagedItems = [];
    private int _totalPages = 1;
    private ThemeSettings _theme = ThemeSettings.Default();
    private const int PageSize = 18;

    public MainViewModel(LauncherService launcherService, ToastService toastService, ThemeService themeService)
    {
        _launcherService = launcherService;
        _toastService = toastService;
        _themeService = themeService;
        ItemsView = CollectionViewSource.GetDefaultView(Items);
        ItemsView.Filter = FilterItem;

        NavigateCommand = new RelayCommand(param => CurrentView = param?.ToString() ?? "Inicio");
        OpenCommand = new RelayCommand(async param => await OpenAsync(param as LauncherItemViewModel ?? SelectedItem), param => !IsBusy && (param is LauncherItemViewModel || SelectedItem is not null));
        ToggleFavoriteCommand = new RelayCommand(async param => await ToggleFavoriteAsync(param as LauncherItemViewModel));
        ToggleCardInfoCommand = new RelayCommand(param => ToggleCardInfo(param as LauncherItemViewModel));
        SelectItemCommand = new RelayCommand(param => SelectItem(param as LauncherItemViewModel));
        OpenCategoryCommand = new RelayCommand(param => OpenCategory(param?.ToString() ?? "Todos"));
        OpenCommandPaletteCommand = new RelayCommand(_ => OpenCommandPalette());
        CloseCommandPaletteCommand = new RelayCommand(_ => CloseCommandPalette());
        DuplicateCommand = new RelayCommand(async param => await DuplicateAsync(param as LauncherItemViewModel ?? SelectedItem), param => param is LauncherItemViewModel || SelectedItem is not null);
        OpenLocationCommand = new RelayCommand(param => OpenLocation(param as LauncherItemViewModel ?? SelectedItem), param => param is LauncherItemViewModel || SelectedItem is not null);
        ValidateLibraryCommand = new RelayCommand(_ => ValidateLibrary());
        OpenDataFolderCommand = new RelayCommand(_ => _launcherService.OpenDataFolder());
        DeleteCommand = new RelayCommand(async param => await DeleteAsync(param as LauncherItemViewModel ?? SelectedItem), param => param is LauncherItemViewModel || SelectedItem is not null);
        GamingModeCommand = new RelayCommand(async _ => await RunBusyAsync("Abriendo perfil rapido", () => _launcherService.OpenGamingModeAsync()));
        AddCommand = new RelayCommand(_ => AddRequested?.Invoke());
        EditCommand = new RelayCommand(param => EditRequested?.Invoke(param as LauncherItemViewModel ?? SelectedItem), param => param is LauncherItemViewModel || SelectedItem is not null);
        SaveCommand = new RelayCommand(async _ => await SaveAsync());
        ExportCommand = new RelayCommand(async _ => await ExportAsync());
        ImportCommand = new RelayCommand(async _ => await ImportAsync());
        DiscoverAppsCommand = new RelayCommand(async _ => await DiscoverAppsAsync());
        NextPageCommand = new RelayCommand(_ => MovePage(1));
        PreviousPageCommand = new RelayCommand(_ => MovePage(-1));
        CreateBackupCommand = new RelayCommand(_ => _launcherService.CreateBackup());
        OpenBackupFolderCommand = new RelayCommand(_ => _launcherService.OpenBackupFolder());
        ApplyThemeCommand = new RelayCommand(async _ => await ApplyThemeAsync());
        ResetThemeCommand = new RelayCommand(async _ => await SetThemePresetAsync(ThemeSettings.Default()));
        SlateThemeCommand = new RelayCommand(async _ => await SetThemePresetAsync(ThemeSettings.Slate()));
        EmberThemeCommand = new RelayCommand(async _ => await SetThemePresetAsync(ThemeSettings.Ember()));
        OpenThemeFolderCommand = new RelayCommand(_ => _themeService.OpenThemeFolder());

        _toastService.ToastRequested += OnToastRequested;
    }

    public ObservableCollection<LauncherItemViewModel> Items { get; } = [];
    public ICollectionView ItemsView { get; }
    public IReadOnlyList<string> NavigationItems { get; } = ["Inicio", "Biblioteca", "Favoritos", "Revision", "Ajustes"];
    public IReadOnlyList<string> Categories { get; } = ["Todos", "Juegos", "Programacion", "IA", "Diseno", "Utilidades", "Carpetas", "Web"];

    public ICommand NavigateCommand { get; }
    public ICommand OpenCommand { get; }
    public ICommand ToggleFavoriteCommand { get; }
    public ICommand ToggleCardInfoCommand { get; }
    public ICommand SelectItemCommand { get; }
    public ICommand OpenCategoryCommand { get; }
    public ICommand OpenCommandPaletteCommand { get; }
    public ICommand CloseCommandPaletteCommand { get; }
    public ICommand DuplicateCommand { get; }
    public ICommand OpenLocationCommand { get; }
    public ICommand ValidateLibraryCommand { get; }
    public ICommand OpenDataFolderCommand { get; }
    public ICommand DeleteCommand { get; }
    public ICommand GamingModeCommand { get; }
    public ICommand AddCommand { get; }
    public ICommand EditCommand { get; }
    public ICommand SaveCommand { get; }
    public ICommand ExportCommand { get; }
    public ICommand ImportCommand { get; }
    public ICommand DiscoverAppsCommand { get; }
    public ICommand NextPageCommand { get; }
    public ICommand PreviousPageCommand { get; }
    public ICommand CreateBackupCommand { get; }
    public ICommand OpenBackupFolderCommand { get; }
    public ICommand ApplyThemeCommand { get; }
    public ICommand ResetThemeCommand { get; }
    public ICommand SlateThemeCommand { get; }
    public ICommand EmberThemeCommand { get; }
    public ICommand OpenThemeFolderCommand { get; }
    public event Action? AddRequested;
    public event Action<LauncherItemViewModel?>? EditRequested;

    public string CurrentView
    {
        get => _currentView;
        set
        {
            if (SetProperty(ref _currentView, value))
            {
                _currentPage = 0;
                NotifyLibraryEngineChanged(refreshView: false);
                OnPropertyChanged(nameof(PageTitle));
            }
        }
    }

    public string PageTitle => CurrentView switch
    {
        "Inicio" => "Centro de mando",
        "Biblioteca" => "Biblioteca",
        "Favoritos" => "Favoritos",
        "Recientes" => "Recientes",
        "Herramientas" => "Herramientas",
        "Revision" => "Revision",
        "Actividad" => "Actividad",
        "Design Lab" => "Design Lab",
        "Ajustes" => "Ajustes",
        _ => CurrentView
    };

    public string SearchText
    {
        get => _searchText;
        set
        {
            if (SetProperty(ref _searchText, value))
            {
                _currentPage = 0;
                NotifyLibraryEngineChanged(refreshView: false);
            }
        }
    }

    public string SelectedCategory
    {
        get => _selectedCategory;
        set
        {
            if (SetProperty(ref _selectedCategory, value))
            {
                _currentPage = 0;
                NotifyLibraryEngineChanged(refreshView: false);
            }
        }
    }

    public LauncherItemViewModel? SelectedItem
    {
        get => _selectedItem;
        set
        {
            if (SetProperty(ref _selectedItem, value))
            {
                OnPropertyChanged(nameof(SelectedItemTitle));
                OnPropertyChanged(nameof(SelectedItemDescription));
                OnPropertyChanged(nameof(SelectedItemPath));
                OnPropertyChanged(nameof(SelectedItemMeta));
                OnPropertyChanged(nameof(SelectedItemStatus));
                OnPropertyChanged(nameof(IsInspectorVisible));
            }
        }
    }

    public LauncherItemViewModel? FeaturedItem => Items.FirstOrDefault(item => item.IsFavorite) ?? Items.FirstOrDefault();
    public IEnumerable<LauncherItemViewModel> FavoriteItems => Items.Where(item => item.IsFavorite).Take(6);
    public IEnumerable<LauncherItemViewModel> RecentItems => Items.OrderByDescending(item => item.Item.LastOpened ?? DateTime.MinValue).Take(6);
    public IEnumerable<LauncherItemViewModel> ToolItems => Items.Where(item => item.Item.Category is LauncherCategory.Programacion or LauncherCategory.Utilidades or LauncherCategory.IA).Take(8);
    public IEnumerable<LauncherItemViewModel> InvalidItems => Items.Where(item => !item.IsLaunchTargetValid);
    public IEnumerable<LauncherItemViewModel> PagedItems => _pagedItems;
    public IEnumerable<LauncherItemViewModel> LibraryRailItems => _filteredItems.Take(80);
    public IEnumerable<ActivityEntry> ActivityItems => _launcherService.Data.Activity.Take(40);
    public IEnumerable<LauncherItemViewModel> GamingModeItems => Items.Where(item => _launcherService.Data.GamingMode.LauncherItemIds.Contains(item.Id));
    public int FavoriteCount => Items.Count(item => item.IsFavorite);
    public int GameCount => Items.Count(item => item.Item.Category == LauncherCategory.Juegos);
    public int InvalidCount => Items.Count(item => !item.IsLaunchTargetValid);
    public int ProfileCount => GamingModeItems.Count();
    public string SelectedItemTitle => SelectedItem?.Name ?? "Selecciona un acceso";
    public string SelectedItemDescription => SelectedItem?.Description ?? "Abre detalles para ver ruta, categoria, estado y acciones rapidas.";
    public string SelectedItemPath => SelectedItem?.Path ?? "Sin seleccion";
    public string SelectedItemMeta => SelectedItem?.LaunchMeta ?? "Nexus Launcher";
    public string SelectedItemStatus => SelectedItem?.PathStatus ?? "Esperando seleccion";
    public int TotalPages => _totalPages;
    public int CurrentPageDisplay => Math.Min(_currentPage + 1, TotalPages);
    public string PageSummary => $"{CurrentPageDisplay}/{TotalPages} - {_filteredItems.Count} accesos";
    public bool IsInspectorVisible => SelectedItem?.IsInfoOpen == true;

    public string ToastMessage
    {
        get => _toastMessage;
        set => SetProperty(ref _toastMessage, value);
    }

    public bool IsToastVisible
    {
        get => _isToastVisible;
        set => SetProperty(ref _isToastVisible, value);
    }

    public bool IsErrorToast
    {
        get => _isErrorToast;
        set => SetProperty(ref _isErrorToast, value);
    }

    public bool IsBusy
    {
        get => _isBusy;
        set => SetProperty(ref _isBusy, value);
    }

    public string BusyMessage
    {
        get => _busyMessage;
        set => SetProperty(ref _busyMessage, value);
    }

    public bool IsCommandPaletteOpen
    {
        get => _isCommandPaletteOpen;
        set => SetProperty(ref _isCommandPaletteOpen, value);
    }

    public string CommandQuery
    {
        get => _commandQuery;
        set
        {
            if (SetProperty(ref _commandQuery, value))
            {
                OnPropertyChanged(nameof(CommandPaletteItems));
            }
        }
    }

    public IEnumerable<LauncherItemViewModel> CommandPaletteItems
    {
        get
        {
            var query = CommandQuery.Trim();
            var source = string.IsNullOrWhiteSpace(query)
                ? Items.OrderByDescending(item => item.Item.LastOpened ?? DateTime.MinValue)
                : Items.Where(item => item.Name.Contains(query, StringComparison.OrdinalIgnoreCase)
                    || item.Description.Contains(query, StringComparison.OrdinalIgnoreCase)
                    || item.Path.Contains(query, StringComparison.OrdinalIgnoreCase)
                    || item.Category.Contains(query, StringComparison.OrdinalIgnoreCase));

            return source.Take(10);
        }
    }

    public string ThemeName
    {
        get => _theme.Name;
        set
        {
            if (_theme.Name == value)
            {
                return;
            }

            _theme.Name = value;
            OnPropertyChanged();
        }
    }

    public string ThemeBackground
    {
        get => _theme.Background;
        set { _theme.Background = value; OnPropertyChanged(); }
    }

    public string ThemeSurface
    {
        get => _theme.Surface;
        set { _theme.Surface = value; OnPropertyChanged(); }
    }

    public string ThemeAccent
    {
        get => _theme.Accent;
        set { _theme.Accent = value; OnPropertyChanged(); }
    }

    public string ThemeAccent2
    {
        get => _theme.Accent2;
        set { _theme.Accent2 = value; OnPropertyChanged(); }
    }

    public string ThemeText
    {
        get => _theme.Text;
        set { _theme.Text = value; OnPropertyChanged(); }
    }

    public string ThemeMuted
    {
        get => _theme.Muted;
        set { _theme.Muted = value; OnPropertyChanged(); }
    }

    public string ThemeDensity
    {
        get => _theme.Density;
        set { _theme.Density = value; OnPropertyChanged(); }
    }

    public bool ThemeAnimations
    {
        get => _theme.Animations;
        set { _theme.Animations = value; OnPropertyChanged(); }
    }

    public IReadOnlyList<string> ThemeDensities { get; } = ["Compact", "Comfortable", "Spacious"];

    public void ClearSearch()
    {
        SearchText = "";
    }

    public void NavigateTo(string view)
    {
        CurrentView = view;
    }

    public void OpenCommandPalette()
    {
        CommandQuery = "";
        IsCommandPaletteOpen = true;
    }

    public void CloseCommandPalette()
    {
        IsCommandPaletteOpen = false;
    }

    public async Task InitializeAsync()
    {
        await RunBusyAsync("Cargando biblioteca", async () =>
        {
            _theme = await _themeService.LoadAsync();
            NotifyThemeChanged();
            await _launcherService.LoadAsync();
            Items.Clear();
            foreach (var item in _launcherService.Data.Items)
            {
                Items.Add(new LauncherItemViewModel(item));
            }

            OnPropertyChanged(nameof(FeaturedItem));
            OnPropertyChanged(nameof(FavoriteItems));
            OnPropertyChanged(nameof(RecentItems));
            OnPropertyChanged(nameof(ToolItems));
            OnPropertyChanged(nameof(GamingModeItems));
            OnPropertyChanged(nameof(FavoriteCount));
            OnPropertyChanged(nameof(GameCount));
            OnPropertyChanged(nameof(InvalidCount));
            OnPropertyChanged(nameof(ProfileCount));
            OnPropertyChanged(nameof(ActivityItems));
            NotifyLibraryEngineChanged();
            SelectedItem = FeaturedItem;
        });
    }

    private async Task ApplyThemeAsync()
    {
        await _themeService.SaveAsync(_theme);
        _toastService.Success("Tema aplicado");
    }

    private async Task SetThemePresetAsync(ThemeSettings settings)
    {
        _theme = settings;
        NotifyThemeChanged();
        await ApplyThemeAsync();
    }

    private void NotifyThemeChanged()
    {
        OnPropertyChanged(nameof(ThemeName));
        OnPropertyChanged(nameof(ThemeBackground));
        OnPropertyChanged(nameof(ThemeSurface));
        OnPropertyChanged(nameof(ThemeAccent));
        OnPropertyChanged(nameof(ThemeAccent2));
        OnPropertyChanged(nameof(ThemeText));
        OnPropertyChanged(nameof(ThemeMuted));
        OnPropertyChanged(nameof(ThemeDensity));
        OnPropertyChanged(nameof(ThemeAnimations));
    }

    private bool FilterItem(object obj)
    {
        if (obj is not LauncherItemViewModel item)
        {
            return false;
        }

        if (CurrentView == "Favoritos" && !item.IsFavorite)
        {
            return false;
        }

        if (CurrentView == "Recientes" && item.Item.LastOpened is null)
        {
            return false;
        }

        if (CurrentView == "Herramientas" && item.Item.Category is not (LauncherCategory.Programacion or LauncherCategory.Utilidades or LauncherCategory.IA))
        {
            return false;
        }

        if (CurrentView == "Revision" && item.IsLaunchTargetValid)
        {
            return false;
        }

        if (CurrentView != "Revision" && SelectedCategory != "Todos" && item.Category != SelectedCategory)
        {
            return false;
        }

        if (string.IsNullOrWhiteSpace(SearchText))
        {
            return true;
        }

        var query = SearchText.Trim();
        return item.Name.Contains(query, StringComparison.OrdinalIgnoreCase)
            || item.Description.Contains(query, StringComparison.OrdinalIgnoreCase)
            || item.Path.Contains(query, StringComparison.OrdinalIgnoreCase)
            || item.Category.Contains(query, StringComparison.OrdinalIgnoreCase);
    }

    private async Task OpenAsync(LauncherItemViewModel? item)
    {
        if (item is null)
        {
            return;
        }

        await _launcherService.OpenAsync(item.Item);
        IsCommandPaletteOpen = false;
        OnPropertyChanged(nameof(RecentItems));
        OnPropertyChanged(nameof(ActivityItems));
        OnPropertyChanged(nameof(SelectedItemStatus));
        NotifyLibraryEngineChanged(refreshView: false);
    }

    private void SelectItem(LauncherItemViewModel? item)
    {
        if (item is not null)
        {
            SelectedItem = item;
        }
    }

    private void ToggleCardInfo(LauncherItemViewModel? item)
    {
        if (item is null)
        {
            return;
        }

        foreach (var other in Items.Where(candidate => candidate != item && candidate.IsInfoOpen))
        {
            other.IsInfoOpen = false;
        }

        item.IsInfoOpen = !item.IsInfoOpen;
        SelectedItem = item;
        OnPropertyChanged(nameof(IsInspectorVisible));
    }

    private void OpenCategory(string category)
    {
        if (category == "Revision")
        {
            CurrentView = "Revision";
            return;
        }

        if (category == "Favoritos")
        {
            SelectedCategory = "Todos";
            CurrentView = "Favoritos";
            return;
        }

        SelectedCategory = category;
        CurrentView = "Biblioteca";
    }

    private IEnumerable<LauncherItemViewModel> CurrentLibraryItems()
    {
        return Items.Where(FilterForLibraryEngine);
    }

    private bool FilterForLibraryEngine(LauncherItemViewModel item)
    {
        if (CurrentView == "Favoritos" && !item.IsFavorite)
        {
            return false;
        }

        if (CurrentView == "Herramientas" && item.Item.Category is not (LauncherCategory.Programacion or LauncherCategory.Utilidades or LauncherCategory.IA))
        {
            return false;
        }

        if (CurrentView == "Revision" && item.IsLaunchTargetValid)
        {
            return false;
        }

        if (SelectedCategory != "Todos" && item.Category != SelectedCategory)
        {
            return false;
        }

        if (string.IsNullOrWhiteSpace(SearchText))
        {
            return true;
        }

        var query = SearchText.Trim();
        return item.Name.Contains(query, StringComparison.OrdinalIgnoreCase)
            || item.Description.Contains(query, StringComparison.OrdinalIgnoreCase)
            || item.Path.Contains(query, StringComparison.OrdinalIgnoreCase)
            || item.Category.Contains(query, StringComparison.OrdinalIgnoreCase);
    }

    private void MovePage(int direction)
    {
        _currentPage = Math.Clamp(_currentPage + direction, 0, TotalPages - 1);
        NotifyLibraryEngineChanged(refreshView: false);
    }

    private void NotifyLibraryEngineChanged(bool refreshView = false)
    {
        _filteredItems = CurrentLibraryItems().ToList();
        _totalPages = Math.Max(1, (int)Math.Ceiling(_filteredItems.Count / (double)PageSize));

        if (_currentPage >= _totalPages)
        {
            _currentPage = _totalPages - 1;
        }

        _pagedItems = _filteredItems.Skip(_currentPage * PageSize).Take(PageSize).ToList();
        OnPropertyChanged(nameof(PagedItems));
        OnPropertyChanged(nameof(LibraryRailItems));
        OnPropertyChanged(nameof(TotalPages));
        OnPropertyChanged(nameof(CurrentPageDisplay));
        OnPropertyChanged(nameof(PageSummary));
        OnPropertyChanged(nameof(FeaturedItem));
        OnPropertyChanged(nameof(FavoriteItems));
        OnPropertyChanged(nameof(RecentItems));
        OnPropertyChanged(nameof(ToolItems));
        OnPropertyChanged(nameof(InvalidItems));
        OnPropertyChanged(nameof(FavoriteCount));
    }

    private async Task DuplicateAsync(LauncherItemViewModel? item)
    {
        if (item is null)
        {
            return;
        }

        var copy = _launcherService.Duplicate(item.Item);
        var viewModel = new LauncherItemViewModel(copy);
        Items.Add(viewModel);
        SelectedItem = viewModel;
        await _launcherService.SaveAsync();
        NotifyLibraryStatsChanged();
        OnPropertyChanged(nameof(ActivityItems));
    }

    private void OpenLocation(LauncherItemViewModel? item)
    {
        if (item is null)
        {
            return;
        }

        _launcherService.OpenContainingLocation(item.Item);
        OnPropertyChanged(nameof(ActivityItems));
    }

    private void ValidateLibrary()
    {
        var invalid = _launcherService.GetInvalidItems();
        foreach (var item in Items)
        {
            item.RefreshValidation();
        }

        NotifyLibraryStatsChanged();
        OnPropertyChanged(nameof(ActivityItems));
        if (invalid.Count == 0)
        {
            _toastService.Success("Biblioteca validada: todas las rutas lucen bien");
            CurrentView = "Biblioteca";
            return;
        }

        CurrentView = "Revision";
        SelectedItem = Items.FirstOrDefault(item => !item.IsLaunchTargetValid);
        _toastService.Error($"{invalid.Count} accesos necesitan revision");
    }

    private async Task ToggleFavoriteAsync(LauncherItemViewModel? item)
    {
        if (item is null)
        {
            return;
        }

        item.IsFavorite = !item.IsFavorite;
        await _launcherService.SaveAsync();
        OnPropertyChanged(nameof(FavoriteItems));
        OnPropertyChanged(nameof(FeaturedItem));
        OnPropertyChanged(nameof(FavoriteCount));
        NotifyLibraryStatsChanged();
    }

    private async Task DeleteAsync(LauncherItemViewModel? item)
    {
        if (item is null)
        {
            return;
        }

        var confirm = System.Windows.MessageBox.Show(
            $"Eliminar \"{item.Name}\" del launcher?",
            "Nexus Launcher",
            MessageBoxButton.YesNo,
            MessageBoxImage.Warning);

        if (confirm != MessageBoxResult.Yes)
        {
            return;
        }

        await _launcherService.DeleteAsync(item.Item);
        Items.Remove(item);
        SelectedItem = FeaturedItem;
        OnPropertyChanged(nameof(FavoriteItems));
        OnPropertyChanged(nameof(RecentItems));
        OnPropertyChanged(nameof(FavoriteCount));
        NotifyLibraryStatsChanged();
        OnPropertyChanged(nameof(ActivityItems));
    }

    public bool IsInGamingMode(LauncherItem item)
    {
        return _launcherService.IsInGamingMode(item);
    }

    public async Task AddItemAsync(LauncherItem item, bool includeInGamingMode)
    {
        _launcherService.Data.Items.Add(item);
        _launcherService.SetGamingMode(item, includeInGamingMode);
        var viewModel = new LauncherItemViewModel(item);
        Items.Add(viewModel);
        SelectedItem = viewModel;
        await _launcherService.SaveAsync();
        _toastService.Success("Acceso agregado");
        OnPropertyChanged(nameof(ActivityItems));
        OnPropertyChanged(nameof(FeaturedItem));
        OnPropertyChanged(nameof(FavoriteItems));
        OnPropertyChanged(nameof(GamingModeItems));
        OnPropertyChanged(nameof(FavoriteCount));
        NotifyLibraryStatsChanged();
    }

    public async Task UpdateItemAsync(LauncherItemViewModel viewModel, bool includeInGamingMode)
    {
        _launcherService.SetGamingMode(viewModel.Item, includeInGamingMode);
        await _launcherService.SaveAsync();
        viewModel.OnPropertyChanged(nameof(LauncherItemViewModel.Name));
        viewModel.OnPropertyChanged(nameof(LauncherItemViewModel.Description));
        viewModel.OnPropertyChanged(nameof(LauncherItemViewModel.Path));
        viewModel.OnPropertyChanged(nameof(LauncherItemViewModel.Category));
        viewModel.OnPropertyChanged(nameof(LauncherItemViewModel.Type));
        viewModel.OnPropertyChanged(nameof(LauncherItemViewModel.Initials));
        viewModel.OnPropertyChanged(nameof(LauncherItemViewModel.CategoryGlyph));
        viewModel.OnPropertyChanged(nameof(LauncherItemViewModel.CoverStart));
        viewModel.OnPropertyChanged(nameof(LauncherItemViewModel.CoverEnd));
        viewModel.OnPropertyChanged(nameof(LauncherItemViewModel.PathStatus));
        viewModel.OnPropertyChanged(nameof(LauncherItemViewModel.LaunchMeta));
        viewModel.OnPropertyChanged(nameof(LauncherItemViewModel.Item));
        viewModel.RefreshValidation();
        OnPropertyChanged(nameof(GamingModeItems));
        _toastService.Success("Acceso actualizado");
        NotifyLibraryStatsChanged();
        OnPropertyChanged(nameof(ActivityItems));
    }

    private async Task SaveAsync()
    {
        await RunBusyAsync("Guardando biblioteca", async () =>
        {
            await _launcherService.SaveAsync();
            _toastService.Success("Configuracion guardada");
        });
    }

    private async Task ExportAsync()
    {
        await RunBusyAsync("Exportando biblioteca", async () =>
        {
            await _launcherService.ExportAsync();
            OnPropertyChanged(nameof(ActivityItems));
        });
    }

    private async Task ImportAsync()
    {
        var dialog = new Microsoft.Win32.OpenFileDialog
        {
            Title = "Importar biblioteca de Nexus Launcher",
            Filter = "Biblioteca Nexus|*.json|Todos los archivos|*.*"
        };

        if (dialog.ShowDialog() != true)
        {
            return;
        }

        try
        {
            await RunBusyAsync("Importando biblioteca", async () =>
            {
                await _launcherService.ImportAsync(dialog.FileName);
                await InitializeAsync();
                OnPropertyChanged(nameof(ActivityItems));
            });
        }
        catch (Exception ex)
        {
            _toastService.Error($"No se pudo importar: {ex.Message}");
        }
    }

    private async Task DiscoverAppsAsync()
    {
        await RunBusyAsync("Detectando apps de Windows", async () =>
        {
            var imported = await _launcherService.DiscoverWindowsShortcutsAsync();
            LauncherItemViewModel? last = null;
            foreach (var item in imported)
            {
                last = new LauncherItemViewModel(item);
                Items.Add(last);
            }

            if (last is not null)
            {
                SelectedItem = last;
                CurrentView = "Biblioteca";
            }

            NotifyLibraryStatsChanged();
            OnPropertyChanged(nameof(FeaturedItem));
            OnPropertyChanged(nameof(ActivityItems));
        });
    }

    private async Task RunBusyAsync(string message, Func<Task> operation)
    {
        BusyMessage = message;
        IsBusy = true;
        try
        {
            await operation();
        }
        finally
        {
            IsBusy = false;
        }
    }

    private void NotifyLibraryStatsChanged()
    {
        NotifyLibraryEngineChanged();
        OnPropertyChanged(nameof(FavoriteItems));
        OnPropertyChanged(nameof(RecentItems));
        OnPropertyChanged(nameof(ToolItems));
        OnPropertyChanged(nameof(GamingModeItems));
        OnPropertyChanged(nameof(InvalidItems));
        OnPropertyChanged(nameof(ActivityItems));
        OnPropertyChanged(nameof(FavoriteCount));
        OnPropertyChanged(nameof(GameCount));
        OnPropertyChanged(nameof(InvalidCount));
        OnPropertyChanged(nameof(ProfileCount));
        OnPropertyChanged(nameof(SelectedItemStatus));
    }

    private async void OnToastRequested(string message, bool isError)
    {
        ToastMessage = message;
        IsErrorToast = isError;
        IsToastVisible = true;
        await Task.Delay(2600);
        IsToastVisible = false;
    }
}
