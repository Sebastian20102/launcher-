param(
  [string]$ApiKey,
  [string]$Model = "gpt-5.5"
)

$ErrorActionPreference = "Stop"

if (-not $ApiKey) {
  $secure = Read-Host "Pega tu OpenAI API key" -AsSecureString
  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try {
    $ApiKey = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
  }
  finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
  }
}

if (-not $ApiKey -or -not $ApiKey.Trim()) {
  throw "No se recibio ninguna API key."
}

$settingsDir = Join-Path $env:APPDATA "Nexus Launcher"
$settingsPath = Join-Path $settingsDir "ai-settings.json"
New-Item -ItemType Directory -Force -Path $settingsDir | Out-Null

$settings = [ordered]@{
  apiKey = $ApiKey.Trim()
  model = $Model
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($settingsPath, ($settings | ConvertTo-Json), $utf8NoBom)
Write-Output "IA configurada en $settingsPath"
