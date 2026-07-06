param(
  [string]$BaseUrl = "http://127.0.0.1:1234/v1",
  [string]$Model = "auto"
)

$ErrorActionPreference = "Stop"

$settingsDir = Join-Path $env:APPDATA "Nexus Launcher"
$settingsPath = Join-Path $settingsDir "ai-settings.json"
New-Item -ItemType Directory -Force -Path $settingsDir | Out-Null

$existing = $null
if (Test-Path $settingsPath) {
  try {
    $raw = [System.IO.File]::ReadAllText($settingsPath).TrimStart([char]0xFEFF)
    $existing = $raw | ConvertFrom-Json
  }
  catch {
    $existing = $null
  }
}

function Get-ExistingValue {
  param(
    [string]$Name,
    [object]$Default
  )

  if ($null -ne $existing -and $existing.PSObject.Properties.Name -contains $Name) {
    return $existing.$Name
  }
  return $Default
}

$settings = [ordered]@{
  provider = "lmstudio"
  apiKey = Get-ExistingValue "apiKey" ""
  model = Get-ExistingValue "model" "gpt-5.5"
  openAiModel = Get-ExistingValue "openAiModel" "gpt-5.5"
  ollamaModel = Get-ExistingValue "ollamaModel" "llama3.2:3b"
  ollamaBaseUrl = Get-ExistingValue "ollamaBaseUrl" "http://127.0.0.1:11434"
  lmStudioModel = $Model
  lmStudioBaseUrl = $BaseUrl.TrimEnd("/")
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($settingsPath, ($settings | ConvertTo-Json), $utf8NoBom)

Write-Output "Nexus Copilot ahora usa LM Studio: $($settings.lmStudioBaseUrl)"
