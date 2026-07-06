using System.Globalization;
using System.Windows.Data;
using MediaColor = System.Windows.Media.Color;
using MediaColorConverter = System.Windows.Media.ColorConverter;

namespace NexusLauncherWpf.Helpers;

public sealed class ColorStringToColorConverter : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
    {
        if (value is string color && !string.IsNullOrWhiteSpace(color))
        {
            try
            {
                return (MediaColor)MediaColorConverter.ConvertFromString(color);
            }
            catch (FormatException)
            {
                return MediaColor.FromRgb(42, 48, 59);
            }
        }

        return MediaColor.FromRgb(42, 48, 59);
    }

    public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
    {
        throw new NotSupportedException();
    }
}
