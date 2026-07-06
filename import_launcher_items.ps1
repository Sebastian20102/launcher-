$ErrorActionPreference = 'SilentlyContinue'
$dataDir = Join-Path $env:APPDATA 'NexusLauncher'
$dataPath = Join-Path $dataDir 'launcher-data.json'
New-Item -ItemType Directory -Force -Path $dataDir | Out-Null
if (!(Test-Path $dataPath)) {
  $data = [ordered]@{ Settings = @{ Theme='Dark'; AccentColor='#C8A96A'; StartInGamingMode=$false; DataFileName='launcher-data.json' }; GamingMode = @{ Name='Perfil rapido'; LauncherItemIds=@() }; Items=@() }
} else {
  Copy-Item -LiteralPath $dataPath -Destination ($dataPath + '.bak-' + (Get-Date -Format 'yyyyMMdd-HHmmss')) -Force
  $data = Get-Content -Raw -LiteralPath $dataPath | ConvertFrom-Json
  if ($null -eq $data.Items) { $data | Add-Member -NotePropertyName Items -NotePropertyValue @() }
  if ($null -eq $data.GamingMode) { $data | Add-Member -NotePropertyName GamingMode -NotePropertyValue ([pscustomobject]@{ Name='Perfil rapido'; LauncherItemIds=@() }) }
}

$items = New-Object System.Collections.Generic.List[object]
foreach ($item in @($data.Items)) { if ($null -ne $item -and $item.Path) { $items.Add($item) } }
$existing = @{}
foreach ($item in $items) { $existing[($item.Path.ToLowerInvariant())] = $true }

function New-Id { [Guid]::NewGuid().ToString('N') }
function Add-LauncherItem($name, $description, $path, $type, $category, $favorite=$false) {
  if ([string]::IsNullOrWhiteSpace($name) -or [string]::IsNullOrWhiteSpace($path)) { return $false }
  $key = $path.ToLowerInvariant()
  if ($existing.ContainsKey($key)) { return $false }
  $obj = [pscustomobject]@{
    Id = New-Id
    Name = $name.Trim()
    Description = $description.Trim()
    Path = $path.Trim()
    Arguments = ''
    Type = $type
    Category = $category
    IconPath = ''
    CoverImagePath = ''
    IsFavorite = [bool]$favorite
    LastOpened = $null
    OpenCount = 0
  }
  $items.Add($obj)
  $existing[$key] = $true
  return $true
}

function Classify($name, $path) {
  $s = (($name + ' ' + $path).ToLowerInvariant())
  if ($s -match 'steam|epic games|riot|battle\.net|battly|minecraft|roblox|valorant|league of legends|fortnite|xbox|gog galaxy|blizzard|ubisoft|ea app|rockstar|steamapps|games') { return 'Juegos' }
  if ($s -match 'visual studio|vs code|vscode|cursor|windsurf|rider|webstorm|pycharm|intellij|datagrip|jetbrains|github|git\b|docker|postman|nodejs|python|anaconda|terminal|powershell|cmd|godot|unity|android studio|xampp|wamp|mysql|mongodb|redis') { return 'Programacion' }
  if ($s -match 'chatgpt|claude|gemini|ollama|lm studio|comfyui|stable diffusion|pinokio') { return 'IA' }
  if ($s -match 'figma|photoshop|illustrator|premiere|after effects|blender|canva|adobe|gimp|krita|inkscape|davinci') { return 'Diseno' }
  if ($s -match 'documents|documentos|downloads|descargas|desktop|escritorio') { return 'Carpetas' }
  return 'Utilidades'
}

function TypeForPath($path, $category) {
  if ($path -match '^https?://|^steam://|^epicgames://|^battlenet://') { return 'Url' }
  if (Test-Path -LiteralPath $path -PathType Container) { return 'Folder' }
  if ($path -match '\.(exe|lnk|bat|cmd|url)$') { return 'Exe' }
  return 'Command'
}

$added = [ordered]@{ Programacion=0; Juegos=0; IA=0; Diseno=0; Utilidades=0; Carpetas=0; Web=0 }

# Accesos directos del menu inicio y escritorio.
$shortcutRoots = @(
  (Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs'),
  (Join-Path $env:PROGRAMDATA 'Microsoft\Windows\Start Menu\Programs'),
  [Environment]::GetFolderPath('Desktop'),
  'C:\Users\Public\Desktop'
) | Where-Object { Test-Path $_ }
$shell = New-Object -ComObject WScript.Shell
foreach ($root in $shortcutRoots) {
  Get-ChildItem -LiteralPath $root -Recurse -Include *.lnk,*.url -File | ForEach-Object {
    $name = $_.BaseName
    $path = $_.FullName
    if ($_.Extension -eq '.lnk') {
      $shortcut = $shell.CreateShortcut($_.FullName)
      if (![string]::IsNullOrWhiteSpace($shortcut.TargetPath)) { $path = $shortcut.TargetPath }
    }
    $category = Classify $name $path
    if ($category -in @('Programacion','Juegos','IA','Diseno')) {
      $type = TypeForPath $path $category
      if (Add-LauncherItem $name "Importado desde acceso directo" $path $type $category ($category -eq 'Programacion' -and $name -match 'Cursor|Code|Visual Studio')) { $added[$category]++ }
    }
  }
}

# Apps conocidas por ruta directa.
$known = @(
  @{Name='Cursor'; Path='C:\Program Files\cursor\Cursor.exe'; Cat='Programacion'},
  @{Name='Steam'; Path='C:\Program Files (x86)\Steam\steam.exe'; Cat='Juegos'},
  @{Name='Epic Games Launcher'; Path='C:\Program Files (x86)\Epic Games\Launcher\Portal\Binaries\Win64\EpicGamesLauncher.exe'; Cat='Juegos'},
  @{Name='Battly Launcher'; Path='C:\Program Files\Battly Launcher\Battly Launcher.exe'; Cat='Juegos'},
  @{Name='Windows Terminal'; Path=(Join-Path $env:LOCALAPPDATA 'Microsoft\WindowsApps\wt.exe'); Cat='Programacion'},
  @{Name='ChatGPT'; Path='https://chatgpt.com'; Cat='IA'},
  @{Name='GitHub'; Path='https://github.com'; Cat='Programacion'}
)
foreach ($app in $known) {
  if (($app.Path -match '^https?://') -or (Test-Path -LiteralPath $app.Path)) {
    $type = TypeForPath $app.Path $app.Cat
    if (Add-LauncherItem $app.Name 'Acceso detectado automaticamente' $app.Path $type $app.Cat ($app.Cat -in @('Programacion','IA'))) { $added[$app.Cat]++ }
  }
}

# Juegos de Steam por manifests.
$steamRoots = @('C:\Program Files (x86)\Steam\steamapps')
$libFile = 'C:\Program Files (x86)\Steam\steamapps\libraryfolders.vdf'
if (Test-Path $libFile) {
  $content = Get-Content -Raw -LiteralPath $libFile
  [regex]::Matches($content, '"path"\s+"([^"]+)"') | ForEach-Object { $steamRoots += (Join-Path ($_.Groups[1].Value -replace '\\\\','\') 'steamapps') }
}
foreach ($steamRoot in ($steamRoots | Select-Object -Unique)) {
  if (!(Test-Path $steamRoot)) { continue }
  Get-ChildItem -LiteralPath $steamRoot -Filter 'appmanifest_*.acf' -File | ForEach-Object {
    $acf = Get-Content -Raw -LiteralPath $_.FullName
    $nameMatch = [regex]::Match($acf, '"name"\s+"([^"]+)"')
    $idMatch = [regex]::Match($_.Name, 'appmanifest_(\d+)\.acf')
    if ($nameMatch.Success -and $idMatch.Success) {
      $name = $nameMatch.Groups[1].Value
      $appid = $idMatch.Groups[1].Value
      if (Add-LauncherItem $name 'Juego detectado en Steam' "steam://rungameid/$appid" 'Url' 'Juegos' $false) { $added['Juegos']++ }
    }
  }
}

# Carpetas de proyectos.
$projectRoots = @(
  [Environment]::GetFolderPath('MyDocuments'),
  [Environment]::GetFolderPath('Desktop'),
  (Join-Path $HOME 'source'),
  (Join-Path $HOME 'repos'),
  (Join-Path $HOME 'Projects')
) | Where-Object { Test-Path $_ } | Select-Object -Unique
$projectDirs = New-Object System.Collections.Generic.HashSet[string]
foreach ($root in $projectRoots) {
  Get-ChildItem -LiteralPath $root -Directory -Recurse -Depth 4 | Where-Object {
    $_.FullName -notmatch '\\(node_modules|bin|obj|\.git|AppData)($|\\)'
  } | ForEach-Object {
    $dir = $_.FullName
    $hasProject = (Test-Path -LiteralPath (Join-Path $dir '.git')) -or (Test-Path -LiteralPath (Join-Path $dir 'package.json')) -or (Test-Path -LiteralPath (Join-Path $dir 'pyproject.toml')) -or (Test-Path -LiteralPath (Join-Path $dir 'Cargo.toml')) -or (Test-Path -LiteralPath (Join-Path $dir 'composer.json')) -or (Get-ChildItem -LiteralPath $dir -File -Include *.sln,*.csproj,*.vbproj,*.fsproj,*.uproject -ErrorAction SilentlyContinue | Select-Object -First 1)
    if ($hasProject) { [void]$projectDirs.Add($dir) }
  }
}
foreach ($dir in ($projectDirs | Select-Object -First 80)) {
  $name = Split-Path $dir -Leaf
  if (Add-LauncherItem $name 'Carpeta de proyecto detectada' $dir 'Folder' 'Programacion' $false) { $added['Programacion']++ }
}

$data.Items = @($items)
$json = $data | ConvertTo-Json -Depth 8
Set-Content -LiteralPath $dataPath -Value $json -Encoding UTF8

[pscustomobject]@{ DataPath=$dataPath; TotalItems=$items.Count; AddedProgramacion=$added.Programacion; AddedJuegos=$added.Juegos; AddedIA=$added.IA; AddedDiseno=$added.Diseno; AddedUtilidades=$added.Utilidades; AddedCarpetas=$added.Carpetas; AddedWeb=$added.Web } | Format-List
