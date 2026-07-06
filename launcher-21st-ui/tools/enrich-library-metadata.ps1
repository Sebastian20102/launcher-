$ErrorActionPreference = "SilentlyContinue"

function Format-Bytes([Nullable[Int64]]$bytes) {
  if (-not $bytes -or $bytes -le 0) { return "" }
  if ($bytes -ge 1GB) { return ("{0:N1} GB" -f ($bytes / 1GB)) }
  if ($bytes -ge 1MB) { return ("{0:N1} MB" -f ($bytes / 1MB)) }
  if ($bytes -ge 1KB) { return ("{0:N1} KB" -f ($bytes / 1KB)) }
  return "$bytes B"
}

function Resolve-ShortcutTarget([string]$path) {
  if (-not ($path -match '\.lnk$') -or -not (Test-Path -LiteralPath $path)) { return "" }
  $shell = New-Object -ComObject WScript.Shell
  $shortcut = $shell.CreateShortcut($path)
  return $shortcut.TargetPath
}

function Get-FolderSizeFast([string]$path) {
  if (-not (Test-Path -LiteralPath $path -PathType Container)) { return 0 }
  $sum = 0L
  Get-ChildItem -LiteralPath $path -File -Recurse -ErrorAction SilentlyContinue |
    Select-Object -First 5000 |
    ForEach-Object { $sum += $_.Length }
  return $sum
}

function Read-UrlTarget([string]$path) {
  if (-not ($path -match '\.url$') -or -not (Test-Path -LiteralPath $path)) { return "" }
  $line = Get-Content -LiteralPath $path | Where-Object { $_ -like 'URL=*' } | Select-Object -First 1
  if ($line) { return $line.Substring(4) }
  return ""
}

function Set-JsonProperty($object, [string]$name, $value) {
  if ($object.PSObject.Properties[$name]) {
    $object.$name = $value
  } else {
    $object | Add-Member -NotePropertyName $name -NotePropertyValue $value
  }
}

$libraryPath = Join-Path $env:APPDATA "Nexus Launcher\library.json"
if (-not (Test-Path -LiteralPath $libraryPath)) {
  throw "No existe library.json. Ejecuta primero tools/import-local-library.ps1"
}

$registry = @{}
$registryRoots = @(
  'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*',
  'HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*',
  'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*'
)

foreach ($root in $registryRoots) {
  Get-ItemProperty $root |
    Where-Object { $_.DisplayName } |
    ForEach-Object {
      $key = $_.DisplayName.ToLowerInvariant()
      if (-not $registry.ContainsKey($key)) {
        $registry[$key] = $_
      }
    }
}

$items = Get-Content -LiteralPath $libraryPath -Raw | ConvertFrom-Json
$enriched = foreach ($item in $items) {
  $location = [string]$item.location
  $realPath = $location
  $source = "Archivo local"
  $version = ""
  $publisher = [string]$item.vendor
  $size = ""
  $modified = ""
  $installDate = ""
  $appId = ""

  if ($location -match '^steam://rungameid/(\d+)') {
    $source = "Steam protocol"
    $appId = $Matches[1]
    $realPath = $location
  } elseif ($location -match '^[a-z][a-z0-9+.-]*://') {
    $source = "Protocolo"
  } elseif ($location -match '\.lnk$') {
    $target = Resolve-ShortcutTarget $location
    if ($target) {
      $realPath = $target
      $source = "Acceso directo"
    }
  } elseif ($location -match '\.url$') {
    $target = Read-UrlTarget $location
    if ($target) {
      $realPath = $target
      $source = "URL"
      if ($target -match 'rungameid/(\d+)') { $appId = $Matches[1] }
    }
  }

  $metadataPath = $realPath
  if ($metadataPath -and (Test-Path -LiteralPath $metadataPath)) {
    $file = Get-Item -LiteralPath $metadataPath
    $modified = $file.LastWriteTime.ToString("yyyy-MM-dd")
    if ($file.PSIsContainer) {
      $size = Format-Bytes (Get-FolderSizeFast $metadataPath)
    } else {
      $size = Format-Bytes $file.Length
      if ($file.Extension -eq ".exe") {
        $info = $file.VersionInfo
        $version = if ($info.ProductVersion) { $info.ProductVersion } elseif ($info.FileVersion) { $info.FileVersion } else { "" }
        if ($info.CompanyName) { $publisher = $info.CompanyName }
      }
    }
  }

  $reg = $registry[[string]$item.name.ToLowerInvariant()]
  if ($reg) {
    if ($reg.Publisher) { $publisher = [string]$reg.Publisher }
    if ($reg.DisplayVersion -and -not $version) { $version = [string]$reg.DisplayVersion }
    if ($reg.InstallDate -match '^\d{8}$') {
      $installDate = "$($reg.InstallDate.Substring(0,4))-$($reg.InstallDate.Substring(4,2))-$($reg.InstallDate.Substring(6,2))"
    }
    if ($reg.EstimatedSize -and -not $size) {
      $size = Format-Bytes ([int64]$reg.EstimatedSize * 1KB)
    }
  }

  $facts = @()
  if ($publisher -and $publisher -ne "Local") { $facts += "Editor: $publisher" }
  if ($version) { $facts += "Version: $version" }
  if ($size) { $facts += "Tamano: $size" }
  if ($modified) { $facts += "Modificado: $modified" }
  if ($appId) { $facts += "Steam AppID: $appId" }

  $item.vendor = if ($publisher) { $publisher } else { $item.vendor }
  Set-JsonProperty $item "version" $version
  Set-JsonProperty $item "realPath" $realPath.Replace('\', '/')
  Set-JsonProperty $item "installDate" $installDate
  Set-JsonProperty $item "size" $size
  Set-JsonProperty $item "source" $source
  Set-JsonProperty $item "appId" $appId
  Set-JsonProperty $item "fileModified" $modified
  if ($facts.Count -gt 0) {
    $item.description = ($facts -join " | ")
  }
  $item.playtime = if ($size) { $size } else { $item.playtime }
  $item.lastUsed = if ($modified) { $modified } elseif ($installDate) { $installDate } else { $item.lastUsed }
  $item
}

$enriched | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $libraryPath -Encoding UTF8

[ordered]@{
  libraryPath = $libraryPath
  total = @($enriched).Count
  withVersion = @($enriched | Where-Object { $_.version }).Count
  withSize = @($enriched | Where-Object { $_.size }).Count
  withRealPath = @($enriched | Where-Object { $_.realPath }).Count
  sample = @($enriched | Select-Object -First 12 name,type,vendor,version,size,source,realPath)
} | ConvertTo-Json -Depth 6
