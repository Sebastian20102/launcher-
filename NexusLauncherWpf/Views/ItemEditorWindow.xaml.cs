using System.Windows;
using Microsoft.Win32;
using NexusLauncherWpf.Models;

namespace NexusLauncherWpf.Views;

public partial class ItemEditorWindow : Window
{
    public ItemEditorWindow(LauncherItem? item = null, bool includeInGamingMode = false)
    {
        InitializeComponent();
        Item = item is null ? new LauncherItem() : item;
        IncludeInGamingMode = includeInGamingMode;
        TitleText = item is null ? "Nuevo acceso" : "Editar acceso";
        DataContext = this;
        TypeBox.ItemsSource = Enum.GetValues<LauncherItemType>();
        CategoryBox.ItemsSource = Enum.GetValues<LauncherCategory>();
        LoadItem();
    }

    public LauncherItem Item { get; }
    public string TitleText { get; }
    public bool IncludeInGamingMode { get; private set; }

    private void LoadItem()
    {
        NameBox.Text = Item.Name;
        DescriptionBox.Text = Item.Description;
        IconPathBox.Text = Item.IconPath;
        CoverPathBox.Text = Item.CoverImagePath;
        PathBox.Text = Item.Path;
        ArgumentsBox.Text = Item.Arguments;
        TypeBox.SelectedItem = Item.Type;
        CategoryBox.SelectedItem = Item.Category;
        FavoriteBox.IsChecked = Item.IsFavorite;
        GamingModeBox.IsChecked = IncludeInGamingMode;
    }

    private void BrowseFile_Click(object sender, RoutedEventArgs e)
    {
        var dialog = new Microsoft.Win32.OpenFileDialog
        {
            Title = "Selecciona un programa, juego o acceso directo",
            Filter = "Programas y accesos|*.exe;*.lnk;*.bat;*.cmd;*.url|Todos los archivos|*.*"
        };

        if (dialog.ShowDialog(this) != true)
        {
            return;
        }

        PathBox.Text = dialog.FileName;
        TypeBox.SelectedItem = LauncherItemType.Exe;
        if (string.IsNullOrWhiteSpace(NameBox.Text))
        {
            NameBox.Text = System.IO.Path.GetFileNameWithoutExtension(dialog.FileName);
        }

        if (CategoryBox.SelectedItem is null or LauncherCategory.Utilidades)
        {
            CategoryBox.SelectedItem = LauncherCategory.Juegos;
        }
    }

    private void BrowseFolder_Click(object sender, RoutedEventArgs e)
    {
        using var dialog = new System.Windows.Forms.FolderBrowserDialog
        {
            Description = "Selecciona una carpeta para agregar al launcher",
            UseDescriptionForTitle = true
        };

        if (dialog.ShowDialog() != System.Windows.Forms.DialogResult.OK)
        {
            return;
        }

        PathBox.Text = dialog.SelectedPath;
        TypeBox.SelectedItem = LauncherItemType.Folder;
        CategoryBox.SelectedItem = LauncherCategory.Carpetas;
        if (string.IsNullOrWhiteSpace(NameBox.Text))
        {
            NameBox.Text = System.IO.Path.GetFileName(dialog.SelectedPath);
        }
    }

    private void UseUrl_Click(object sender, RoutedEventArgs e)
    {
        PathBox.Text = "https://";
        TypeBox.SelectedItem = LauncherItemType.Url;
        CategoryBox.SelectedItem = LauncherCategory.Web;
        PathBox.Focus();
        PathBox.CaretIndex = PathBox.Text.Length;
    }

    private void BrowseIcon_Click(object sender, RoutedEventArgs e)
    {
        var path = PickImage("Selecciona un icono o imagen cuadrada");
        if (!string.IsNullOrWhiteSpace(path))
        {
            IconPathBox.Text = path;
        }
    }

    private void BrowseCover_Click(object sender, RoutedEventArgs e)
    {
        var path = PickImage("Selecciona una portada para la tarjeta");
        if (!string.IsNullOrWhiteSpace(path))
        {
            CoverPathBox.Text = path;
        }
    }

    private void ClearVisuals_Click(object sender, RoutedEventArgs e)
    {
        IconPathBox.Text = "";
        CoverPathBox.Text = "";
    }

    private string? PickImage(string title)
    {
        var dialog = new Microsoft.Win32.OpenFileDialog
        {
            Title = title,
            Filter = "Imagenes|*.png;*.jpg;*.jpeg;*.bmp;*.ico|Todos los archivos|*.*"
        };

        return dialog.ShowDialog(this) == true ? dialog.FileName : null;
    }

    private void Save_Click(object sender, RoutedEventArgs e)
    {
        if (string.IsNullOrWhiteSpace(NameBox.Text) || string.IsNullOrWhiteSpace(PathBox.Text))
        {
            System.Windows.MessageBox.Show(this, "Nombre y ruta son obligatorios.", "Nexus Launcher", MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        Item.Name = NameBox.Text.Trim();
        Item.Description = DescriptionBox.Text.Trim();
        Item.IconPath = IconPathBox.Text.Trim();
        Item.CoverImagePath = CoverPathBox.Text.Trim();
        Item.Path = PathBox.Text.Trim();
        Item.Arguments = ArgumentsBox.Text.Trim();
        Item.Type = TypeBox.SelectedItem is LauncherItemType type ? type : LauncherItemType.Exe;
        Item.Category = CategoryBox.SelectedItem is LauncherCategory category ? category : LauncherCategory.Utilidades;
        Item.IsFavorite = FavoriteBox.IsChecked == true;
        IncludeInGamingMode = GamingModeBox.IsChecked == true;
        DialogResult = true;
    }
}
