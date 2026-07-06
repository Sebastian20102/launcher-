using System.ComponentModel;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Threading;
using NexusLauncherWpf.Services;
using NexusLauncherWpf.ViewModels;

namespace NexusLauncherWpf.Views;

public partial class MainWindow : Window
{
    private readonly MainViewModel _viewModel;
    private long _lastHoverFrameTicks;

    public MainWindow()
    {
        InitializeComponent();
        var toastService = new ToastService();
        var storage = new JsonStorageService();
        var processLauncher = new ProcessLauncherService();
        var launcherService = new LauncherService(storage, processLauncher, toastService);
        var themeService = new ThemeService();
        _viewModel = new MainViewModel(launcherService, toastService, themeService);
        DataContext = _viewModel;
        _viewModel.AddRequested += OnAddRequested;
        _viewModel.EditRequested += OnEditRequested;
        _viewModel.PropertyChanged += OnViewModelPropertyChanged;
        Loaded += OnLoaded;
        KeyDown += OnKeyDown;
    }

    private async void OnLoaded(object sender, RoutedEventArgs e)
    {
        await _viewModel.InitializeAsync();
    }

    private void OnKeyDown(object sender, System.Windows.Input.KeyEventArgs e)
    {
        if (Keyboard.Modifiers == ModifierKeys.Control && e.Key == Key.K)
        {
            _viewModel.OpenCommandPalette();
            e.Handled = true;
            return;
        }

        if (e.Key == Key.Escape && _viewModel.IsCommandPaletteOpen)
        {
            _viewModel.CloseCommandPalette();
            Focus();
            e.Handled = true;
            return;
        }

        if (Keyboard.Modifiers == ModifierKeys.Control && e.Key == Key.F)
        {
            SearchBox.Focus();
            SearchBox.SelectAll();
            e.Handled = true;
            return;
        }

        if (Keyboard.Modifiers == ModifierKeys.Control && e.Key == Key.N)
        {
            _viewModel.AddCommand.Execute(null);
            e.Handled = true;
            return;
        }

        if (Keyboard.Modifiers == ModifierKeys.Control && e.Key == Key.E)
        {
            _viewModel.EditCommand.Execute(_viewModel.SelectedItem);
            e.Handled = true;
            return;
        }

        if (e.Key == Key.F5)
        {
            _viewModel.ValidateLibraryCommand.Execute(null);
            e.Handled = true;
            return;
        }

        if (e.Key == Key.Enter && !SearchBox.IsKeyboardFocusWithin)
        {
            _viewModel.OpenCommand.Execute(_viewModel.SelectedItem);
            e.Handled = true;
            return;
        }

        if (e.Key == Key.Delete && !SearchBox.IsKeyboardFocusWithin)
        {
            _viewModel.DeleteCommand.Execute(_viewModel.SelectedItem);
            e.Handled = true;
            return;
        }

        if (e.Key == Key.Escape && (SearchBox.IsKeyboardFocusWithin || !string.IsNullOrWhiteSpace(_viewModel.SearchText)))
        {
            _viewModel.ClearSearch();
            Focus();
            e.Handled = true;
        }
    }

    private void LauncherCard_MouseEnter(object sender, System.Windows.Input.MouseEventArgs e)
    {
        if (!_viewModel.ThemeAnimations || sender is not Border card)
        {
            return;
        }

        var transforms = EnsureMutableCardTransforms(card);
        System.Windows.Controls.Panel.SetZIndex(card, 10);
        if (GetTransform<ScaleTransform>(transforms) is { } scale)
        {
            scale.ScaleX = 1.012;
            scale.ScaleY = 1.012;
        }
    }

    private void OnViewModelPropertyChanged(object? sender, PropertyChangedEventArgs e)
    {
        if (e.PropertyName == nameof(MainViewModel.IsCommandPaletteOpen) && _viewModel.IsCommandPaletteOpen)
        {
            Dispatcher.BeginInvoke(() =>
            {
                CommandPaletteBox.Focus();
                CommandPaletteBox.SelectAll();
            }, DispatcherPriority.Input);
        }
    }

    private void LauncherCard_MouseMove(object sender, System.Windows.Input.MouseEventArgs e)
    {
        if (!_viewModel.ThemeAnimations || sender is not Border card || card.ActualWidth <= 0 || card.ActualHeight <= 0)
        {
            return;
        }

        var now = Environment.TickCount64;
        if (now - _lastHoverFrameTicks < 16)
        {
            return;
        }

        _lastHoverFrameTicks = now;
        var position = e.GetPosition(card);
        var x = (position.X / card.ActualWidth - 0.5) * 2;
        var y = (position.Y / card.ActualHeight - 0.5) * 2;
        var transforms = EnsureMutableCardTransforms(card);

        if (GetTransform<TranslateTransform>(transforms) is { } translate)
        {
            translate.X = 0;
            translate.Y = -2;
        }

        if (GetTransform<RotateTransform>(transforms) is { } rotate)
        {
            rotate.Angle = x * .35 + y * .12;
        }
    }

    private void LauncherCard_MouseLeave(object sender, System.Windows.Input.MouseEventArgs e)
    {
        if (sender is not Border card)
        {
            return;
        }

        System.Windows.Controls.Panel.SetZIndex(card, 0);
        var transforms = EnsureMutableCardTransforms(card);
        if (GetTransform<TranslateTransform>(transforms) is { } translate)
        {
            translate.X = 0;
            translate.Y = 0;
        }

        if (GetTransform<RotateTransform>(transforms) is { } rotate)
        {
            rotate.Angle = 0;
        }

        if (GetTransform<ScaleTransform>(transforms) is { } scale)
        {
            scale.ScaleX = 1;
            scale.ScaleY = 1;
        }
    }

    private static TransformGroup EnsureMutableCardTransforms(Border card)
    {
        if (card.RenderTransform is TransformGroup group
            && !group.IsFrozen
            && group.Children.OfType<ScaleTransform>().Any(transform => !transform.IsFrozen)
            && group.Children.OfType<RotateTransform>().Any(transform => !transform.IsFrozen)
            && group.Children.OfType<TranslateTransform>().Any(transform => !transform.IsFrozen))
        {
            return group;
        }

        var mutableGroup = new TransformGroup();
        mutableGroup.Children.Add(new ScaleTransform());
        mutableGroup.Children.Add(new RotateTransform());
        mutableGroup.Children.Add(new TranslateTransform());
        card.RenderTransform = mutableGroup;
        return mutableGroup;
    }

    private static T? GetTransform<T>(TransformGroup group) where T : Transform
    {
        return group.Children.OfType<T>().FirstOrDefault();
    }

    private async void OnAddRequested()
    {
        var editor = new ItemEditorWindow { Owner = this };
        if (editor.ShowDialog() == true)
        {
            await _viewModel.AddItemAsync(editor.Item, editor.IncludeInGamingMode);
        }
    }

    private async void OnEditRequested(LauncherItemViewModel? item)
    {
        if (item is null)
        {
            return;
        }

        var editor = new ItemEditorWindow(item.Item, _viewModel.IsInGamingMode(item.Item)) { Owner = this };
        if (editor.ShowDialog() == true)
        {
            await _viewModel.UpdateItemAsync(item, editor.IncludeInGamingMode);
        }
    }
}
