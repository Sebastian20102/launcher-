$ErrorActionPreference = "SilentlyContinue"

Add-Type -AssemblyName System.Drawing

function Set-JsonProperty($object, [string]$name, $value) {
  if ($object.PSObject.Properties[$name]) {
    $object.$name = $value
  } else {
    $object | Add-Member -NotePropertyName $name -NotePropertyValue $value
  }
}

function Resolve-ShortcutTarget([string]$path) {
  if (-not ($path -match '\.lnk$') -or -not (Test-Path -LiteralPath $path)) { return "" }
  $shell = New-Object -ComObject WScript.Shell
  $shortcut = $shell.CreateShortcut($path)
  return $shortcut.TargetPath
}

function Find-ExecutableCandidate([string]$path) {
  if ([string]::IsNullOrWhiteSpace($path)) { return "" }
  if ($path -match '^[a-z][a-z0-9+.-]*://') { return "" }
  if ($path -match '\.lnk$') {
    $target = Resolve-ShortcutTarget $path
    if ($target) { $path = $target }
  }
  if (Test-Path -LiteralPath $path -PathType Leaf) {
    if ([IO.Path]::GetExtension($path).ToLowerInvariant() -eq ".exe") { return $path }
    return ""
  }
  if (Test-Path -LiteralPath $path -PathType Container) {
    $exe = Get-ChildItem -LiteralPath $path -Filter *.exe -File -Recurse |
      Where-Object { $_.Name -notmatch '(unins|uninstall|setup|installer|crash|helper|update)' } |
      Sort-Object @{ Expression = { $_.DirectoryName.Length } }, Length -Descending |
      Select-Object -First 1
    if ($exe) { return $exe.FullName }
  }
  return ""
}

function Export-ExeIcon([string]$exePath, [string]$outputPath) {
  if (-not (Test-Path -LiteralPath $exePath)) { return $false }
  try {
    $icon = [System.Drawing.Icon]::ExtractAssociatedIcon($exePath)
    if (-not $icon) { return $false }
    $bitmap = $icon.ToBitmap()
    $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bitmap.Dispose()
    $icon.Dispose()
    return $true
  } catch {
    return $false
  }
}

$libraryPath = Join-Path $env:APPDATA "Nexus Launcher\library.json"
if (-not (Test-Path -LiteralPath $libraryPath)) {
  throw "No existe library.json"
}

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$publicIconDir = Join-Path $projectRoot "public\app-icons"
New-Item -ItemType Directory -Force -Path $publicIconDir | Out-Null

$items = Get-Content -LiteralPath $libraryPath -Raw | ConvertFrom-Json
$exported = 0

foreach ($item in $items) {
  $pathForIcon = [string]$item.realPath
  if ([string]::IsNullOrWhiteSpace($pathForIcon)) {
    $pathForIcon = [string]$item.location
  }
  $candidate = Find-ExecutableCandidate $pathForIcon
  if (-not $candidate) {
    Set-JsonProperty $item "iconUrl" ""
    continue
  }

  $safeId = ([string]$item.id) -replace '[^a-zA-Z0-9_-]', '-'
  $fileName = "$safeId.png"
  $outputPath = Join-Path $publicIconDir $fileName
  if (Export-ExeIcon $candidate $outputPath) {
    Set-JsonProperty $item "iconUrl" "/app-icons/$fileName"
    $exported += 1
  } else {
    Set-JsonProperty $item "iconUrl" ""
  }
}

$items | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $libraryPath -Encoding UTF8
Copy-Item $libraryPath (Join-Path $projectRoot "public\library.generated.json") -Force

[ordered]@{
  libraryPath = $libraryPath
  iconDir = $publicIconDir
  total = @($items).Count
  exportedIcons = $exported
} | ConvertTo-Json
