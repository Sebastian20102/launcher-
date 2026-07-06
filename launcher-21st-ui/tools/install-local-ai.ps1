param(
  [string]$Model = "llama3.2:3b",
  [string]$BaseUrl = "http://127.0.0.1:11434"
)

$ErrorActionPreference = "Stop"

function Test-OllamaServer {
  try {
    Invoke-WebRequest -Uri "$BaseUrl/api/tags" -UseBasicParsing -TimeoutSec 3 | Out-Null
    return $true
  }
  catch {
    return $false
  }
}

if (-not (Get-Command ollama -ErrorAction SilentlyContinue)) {
  if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
    throw "No encontre winget para instalar Ollama automaticamente. Instala Ollama manualmente desde https://ollama.com/download"
  }

  Write-Output "Instalando Ollama..."
  winget install --id Ollama.Ollama --source winget --accept-package-agreements --accept-source-agreements
}

if (-not (Test-OllamaServer)) {
  Write-Output "Arrancando Ollama..."
  Start-Process -FilePath "ollama" -ArgumentList "serve" -WindowStyle Hidden
  Start-Sleep -Seconds 6
}

if (-not (Test-OllamaServer)) {
  throw "Ollama no respondio en $BaseUrl. Abre Ollama manualmente y vuelve a ejecutar este script."
}

Write-Output "Descargando/verificando modelo local $Model..."
ollama pull $Model

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
  provider = "ollama"
  apiKey = Get-ExistingValue "apiKey" ""
  model = Get-ExistingValue "model" "gpt-5.5"
  openAiModel = Get-ExistingValue "openAiModel" "gpt-5.5"
  ollamaModel = $Model
  ollamaBaseUrl = $BaseUrl
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($settingsPath, ($settings | ConvertTo-Json), $utf8NoBom)

Write-Output "IA local lista. Configuracion: $settingsPath"
