param(
  [int]$MaxShortcuts = 180,
  [int]$MaxProjects = 60
)

$ErrorActionPreference = "SilentlyContinue"

function New-Slug([string]$value) {
  $slug = ($value.ToLowerInvariant() -replace '[^a-z0-9]+', '-').Trim('-')
  if ([string]::IsNullOrWhiteSpace($slug)) { return "item" }
  return $slug
}

function Normalize-PathValue([string]$value) {
  if ([string]::IsNullOrWhiteSpace($value)) { return "" }
  return $value.Trim('"').Replace('\', '/')
}

function Test-LauncherNoise([string]$name, [string]$path) {
  $text = "$name $path".ToLowerInvariant()
  $noise = @(
    'uninstall', 'desinstalar', 'readme', 'help', 'manual', 'license',
    'documentation', 'release notes', 'privacy policy', 'eula',
    'website', 'support', 'update helper', 'crash reporter',
    'crashreport', 'crash report', 'prereq', 'prerequisite',
    'installer', 'setup', 'bootstrapper'
  )
  foreach ($word in $noise) {
    if ($text.Contains($word)) { return $true }
  }
  return $false
}

function Get-ItemKind([string]$name, [string]$target, [bool]$isDirectory) {
  $text = "$name $target".ToLowerInvariant()
  if ($isDirectory) { return "Proyecto" }

  $gameWords = @(
    'steam', 'epic games', 'gog', 'battle.net', 'battlenet', 'riot',
    'valorant', 'league of legends', 'minecraft', 'roblox', 'fortnite',
    'left 4 dead', 'l4d', 'game', 'juego', 'ubisoft',
    'ea app', 'xbox', 'unity hub'
  )
  foreach ($word in $gameWords) {
    if ($text.Contains($word)) { return "Juego" }
  }

  $systemWords = @(
    'powershell', 'terminal', 'cmd', 'control panel', 'task manager',
    'registry editor', 'services', 'event viewer', 'device manager',
    'windows security', 'defender', 'disk cleanup', 'system information'
  )
  foreach ($word in $systemWords) {
    if ($text.Contains($word)) { return "Sistema" }
  }

  return "Programa"
}

function Get-IconName([string]$kind, [string]$name, [string]$target) {
  $text = "$name $target".ToLowerInvariant()
  if ($kind -eq "Proyecto") { return "folder" }
  if ($kind -eq "Sistema") { return "terminal" }
  if ($text -match 'code|visual studio|cursor|trae|git|node|python|docker|unreal|unity|blender') { return "code" }
  if ($kind -eq "Juego") { return "gamepad" }
  return "monitor"
}

function Get-Accent([string]$kind, [string]$icon) {
  if ($kind -eq "Juego") { return "bg-sky-200 text-sky-950" }
  if ($kind -eq "Proyecto") { return "bg-amber-100 text-amber-950" }
  if ($kind -eq "Sistema") { return "bg-zinc-200 text-zinc-950" }
  if ($icon -eq "code") { return "bg-blue-200 text-blue-950" }
  return "bg-slate-200 text-slate-950"
}

function New-LibraryItem([string]$name, [string]$location, [string]$vendor, [bool]$isDirectory = $false, [bool]$favorite = $false) {
  $kind = Get-ItemKind $name $location $isDirectory
  $icon = Get-IconName $kind $name $location
  $exists = if ($location -match '^[a-z][a-z0-9+.-]*://') { $true } elseif ($location -match '^[a-zA-Z]+\.exe$') { $true } else { Test-Path -LiteralPath $location }
  [pscustomobject][ordered]@{
    id = "$(New-Slug $name)-$([Math]::Abs($location.GetHashCode()))"
    name = $name
    type = $kind
    vendor = if ([string]::IsNullOrWhiteSpace($vendor)) { "Local" } else { $vendor }
    status = if ($exists) { "Listo" } else { "Sin revisar" }
    location = Normalize-PathValue $location
    lastUsed = "Importado"
    playtime = "0 h"
    description = if ($isDirectory) { "Carpeta o proyecto detectado en este PC." } else { "Acceso detectado automaticamente en este PC." }
    accent = Get-Accent $kind $icon
    icon = $icon
    favorite = $favorite
  }
}

$items = New-Object System.Collections.Generic.List[object]
$shell = New-Object -ComObject WScript.Shell

$shortcutRoots = @(
  "$env:ProgramData\Microsoft\Windows\Start Menu\Programs",
  "$env:APPDATA\Microsoft\Windows\Start Menu\Programs",
  "$env:USERPROFILE\Desktop",
  "$env:PUBLIC\Desktop"
)

$shortcuts = foreach ($root in $shortcutRoots) {
  if (Test-Path $root) {
    Get-ChildItem -LiteralPath $root -Recurse -Include *.lnk -File
  }
}

$shortcuts |
  Sort-Object LastWriteTime -Descending |
  ForEach-Object {
    if ($items.Count -ge $MaxShortcuts) { return }
    $shortcut = $shell.CreateShortcut($_.FullName)
    $target = $shortcut.TargetPath
    $name = [IO.Path]::GetFileNameWithoutExtension($_.Name)
    if ([string]::IsNullOrWhiteSpace($target)) { $target = $_.FullName }
    if (Test-LauncherNoise $name $target) { return }
    $items.Add((New-LibraryItem $name $_.FullName ([IO.Path]::GetFileName((Split-Path $_.DirectoryName -Parent)))))
  }

$registryRoots = @(
  'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*',
  'HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*',
  'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*'
)

foreach ($root in $registryRoots) {
  Get-ItemProperty $root |
    Where-Object { $_.DisplayName -and -not (Test-LauncherNoise $_.DisplayName $_.DisplayIcon) } |
    Sort-Object DisplayName |
    ForEach-Object {
      $displayIcon = [string]$_.DisplayIcon
      $candidate = $displayIcon -replace ',\d+$', ''
      $candidate = $candidate.Trim('"')
      if ($candidate -match '\.ico$') {
        $candidate = ""
      }
      if (([string]::IsNullOrWhiteSpace($candidate) -or -not (Test-Path -LiteralPath $candidate)) -and $_.InstallLocation) {
        $candidate = [string]$_.InstallLocation
        if (Test-Path -LiteralPath $candidate -PathType Container) {
          $displaySlug = New-Slug $_.DisplayName
          $exe = Get-ChildItem -LiteralPath $candidate -Recurse -Filter *.exe -File |
            Where-Object { -not (Test-LauncherNoise $_.Name $_.FullName) } |
            Sort-Object @{ Expression = { if ((New-Slug $_.BaseName) -like "*$displaySlug*") { 0 } else { 1 } } }, Length |
            Select-Object -First 1
          if ($exe) { $candidate = $exe.FullName }
        }
      }
      if ([string]::IsNullOrWhiteSpace($candidate)) { return }
      $items.Add((New-LibraryItem $_.DisplayName $candidate $_.Publisher))
    }
}

$steamLibraryRoots = New-Object System.Collections.Generic.HashSet[string]
$steamCandidates = @(
  "${env:ProgramFiles(x86)}\Steam",
  "$env:ProgramFiles\Steam",
  "D:\SteamLibrary",
  "E:\SteamLibrary",
  "F:\SteamLibrary"
)

foreach ($candidate in $steamCandidates) {
  if (Test-Path -LiteralPath (Join-Path $candidate "steamapps")) {
    [void]$steamLibraryRoots.Add($candidate)
  }
}

$libraryVdfCandidates = @(
  "${env:ProgramFiles(x86)}\Steam\steamapps\libraryfolders.vdf",
  "${env:ProgramFiles(x86)}\Steam\config\libraryfolders.vdf"
)

foreach ($vdf in $libraryVdfCandidates) {
  if (-not (Test-Path -LiteralPath $vdf)) { continue }
  Get-Content -LiteralPath $vdf |
    ForEach-Object {
      if ($_ -match '"path"\s+"([^"]+)"') {
        [void]$steamLibraryRoots.Add(($Matches[1] -replace '\\\\', '\'))
      }
    }
}

foreach ($steamRoot in $steamLibraryRoots) {
  $steamApps = Join-Path $steamRoot "steamapps"
  if (-not (Test-Path -LiteralPath $steamApps)) { continue }
  Get-ChildItem -LiteralPath $steamApps -Filter "appmanifest_*.acf" -File |
    ForEach-Object {
      $raw = Get-Content -LiteralPath $_.FullName -Raw
      $appid = if ($raw -match '"appid"\s+"([^"]+)"') { $Matches[1] } else { "" }
      $name = if ($raw -match '"name"\s+"([^"]+)"') { $Matches[1] } else { "" }
      if ([string]::IsNullOrWhiteSpace($appid) -or [string]::IsNullOrWhiteSpace($name)) { return }
      if (Test-LauncherNoise $name "") { return }
      $items.Add((New-LibraryItem $name "steam://rungameid/$appid" "Steam"))
    }
}

$projectRoots = @(
  "$env:USERPROFILE\Documents",
  "$env:USERPROFILE\Desktop",
  "$env:USERPROFILE\source",
  "$env:USERPROFILE\repos"
)

$projectNameWords = 'project|proyecto|projects|codex|react|vue|vite|next|node|python|unreal|unity|game|juego|launcher|app|web|pagina|curso|roblox|terminal|gpt'

foreach ($root in $projectRoots) {
  if (-not (Test-Path $root)) { continue }
  Get-ChildItem -LiteralPath $root -Directory |
    Where-Object { $_.Name.ToLowerInvariant() -match $projectNameWords } |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First $MaxProjects |
    ForEach-Object {
      $items.Add((New-LibraryItem $_.Name $_.FullName "Local" $true ($_.Name -match 'New project 2|Codex|Unreal Projects')))
    }
}

$deduped = New-Object System.Collections.Generic.List[object]
$seen = @{}
foreach ($item in $items) {
  $key = if ($item.location) { $item.location.ToLowerInvariant() } else { $item.name.ToLowerInvariant() }
  if ($seen.ContainsKey($key)) { continue }
  $seen[$key] = $true
  $deduped.Add($item)
}

$ranked = $deduped | Sort-Object `
  @{ Expression = { if ($_.favorite) { 0 } else { 1 } } }, `
  @{ Expression = { switch ($_.type) { "Juego" { 0 } "Proyecto" { 1 } "Programa" { 2 } "Sistema" { 3 } default { 4 } } } }, `
  name

$libraryDir = Join-Path $env:APPDATA "Nexus Launcher"
$libraryPath = Join-Path $libraryDir "library.json"
New-Item -ItemType Directory -Force -Path $libraryDir | Out-Null
$ranked | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $libraryPath -Encoding UTF8

$summary = $ranked | Group-Object type | Sort-Object Name | ForEach-Object {
  [ordered]@{ type = $_.Name; count = $_.Count }
}

[ordered]@{
  libraryPath = $libraryPath
  total = @($ranked).Count
  summary = $summary
  sample = @($ranked | Select-Object -First 20 name,type,location)
} | ConvertTo-Json -Depth 6
