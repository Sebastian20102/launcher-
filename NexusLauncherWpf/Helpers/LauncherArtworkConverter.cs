using System.Drawing;
using System.Globalization;
using System.IO;
using System.Runtime.InteropServices;
using System.Collections.Concurrent;
using System.Windows.Data;
using System.Windows.Interop;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using NexusLauncherWpf.Models;

namespace NexusLauncherWpf.Helpers;

public sealed class LauncherArtworkConverter : IValueConverter
{
    private static readonly ConcurrentDictionary<string, ImageSource?> Cache = new();

    public object? Convert(object value, Type targetType, object parameter, CultureInfo culture)
    {
        if (value is not LauncherItem item)
        {
            return null;
        }

        var mode = parameter?.ToString() == "Icon" ? "icon" : "cover";
        var cacheKey = string.Join("|", mode, item.CoverImagePath, item.IconPath, item.Path);
        return Cache.GetOrAdd(cacheKey, _ => ResolveArtwork(item, mode));
    }

    private static ImageSource? ResolveArtwork(LauncherItem item, string mode)
    {
        var preferredImage = mode == "icon" ? item.IconPath : item.CoverImagePath;
        var image = LoadImage(preferredImage);
        if (image is not null)
        {
            return image;
        }

        image = LoadImage(item.IconPath);
        if (image is not null)
        {
            return image;
        }

        return ExtractAssociatedIcon(item.Path);
    }

    public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
    {
        throw new NotSupportedException();
    }

    private static ImageSource? LoadImage(string path)
    {
        if (string.IsNullOrWhiteSpace(path) || !File.Exists(path))
        {
            return null;
        }

        try
        {
            var bitmap = new BitmapImage();
            bitmap.BeginInit();
            bitmap.CacheOption = BitmapCacheOption.OnLoad;
            bitmap.UriSource = new Uri(path, UriKind.Absolute);
            bitmap.EndInit();
            bitmap.Freeze();
            return bitmap;
        }
        catch
        {
            return null;
        }
    }

    private static ImageSource? ExtractAssociatedIcon(string path)
    {
        if (string.IsNullOrWhiteSpace(path) || !File.Exists(path))
        {
            return null;
        }

        try
        {
            using var icon = Icon.ExtractAssociatedIcon(path);
            if (icon is null)
            {
                return null;
            }

            var handle = icon.Handle;
            var source = Imaging.CreateBitmapSourceFromHIcon(
                handle,
                System.Windows.Int32Rect.Empty,
                BitmapSizeOptions.FromWidthAndHeight(96, 96));
            source.Freeze();
            return source;
        }
        catch
        {
            return null;
        }
    }
}
