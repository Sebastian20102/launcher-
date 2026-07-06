namespace NexusLauncherWpf.Services;

public sealed class ToastService
{
    public event Action<string, bool>? ToastRequested;

    public void Success(string message) => ToastRequested?.Invoke(message, false);

    public void Error(string message) => ToastRequested?.Invoke(message, true);
}
