$ErrorActionPreference = 'SilentlyContinue'
$dataDir = Join-Path $env:APPDATA 'NexusLauncher'
$dataPath = Join-Path $dataDir 'launcher-data.json'
New-Item -ItemType Directory -Force -Path $dataDir | Out-Null
if (!(Test-Path $dataPath)) {
  $data = [ordered]@{ Settings = @{ Theme='Dark'; AccentColor='#C8A96A'; StartInGamingMode=$false; DataFileName='launcher-data.json' }; GamingMode = @{ Name='Perfil rapido'; LauncherItemIds=@() }; Items=@() }
} else {
  Copy-Item -LiteralPath $dataPath -Destination ($dataPath + '.bak-' + (Get-Date -Format 'yyyyMMdd-HHmmss')) -Force
  $data = Get-Content -Raw -LiteralPath $dataPath | ConvertFrom-Json
}
if ($null -eq $data.Items) { $data | Add-Member -NotePropertyName Items -NotePropertyValue @() }
if ($null -eq $data.GamingMode) { $data | Add-Member -NotePropertyName GamingMode -NotePropertyValue ([pscustomobject]@{ Name='Perfil rapido'; LauncherItemIds=@() }) }

$items = New-Object System.Collections.Generic.List[object]
foreach ($item in @($data.Items)) { if ($null -ne $item -and $item.Path) { $items.Add($item) } }
$existing = @{}
foreach ($item in $items) { $existing[($item.Path.ToLowerInvariant())] = $true }
$added = [ordered]@{ Programacion=0; Juegos=0; IA=0; Diseno=0; Utilidades=0; Carpetas=0; Web=0 }
function New-Id { [Guid]::NewGuid().ToString('N') }
function Add-ItemToLauncher($name,$desc,$path,$type,$cat,$fav=$false) {
  if ([string]::IsNullOrWhiteSpace($name) -or [string]::IsNullOrWhiteSpace($path)) { return }
  $key = $path.ToLowerInvariant()
  if ($existing.ContainsKey($key)) { return }
  $obj = [pscustomobject]@{ Id=New-Id; Name=$name.Trim(); Description=$desc.Trim(); Path=$path.Trim(); Arguments=''; Type=$type; Category=$cat; IconPath=''; CoverImagePath=''; IsFavorite=[bool]$fav; LastOpened=$null; OpenCount=0 }
  $items.Add($obj); $existing[$key]=$true; $added[$cat]++
}
function TypeFor($path) { if ($path -match '^https?://|^steam://') { 'Url' } elseif (Test-Path -LiteralPath $path -PathType Container) { 'Folder' } elseif ($path -match '\.(exe|lnk|bat|cmd|url)$') { 'Exe' } else { 'Command' } }
function Classify($name,$path) {
  $s = ($name + ' ' + $path).ToLowerInvariant()
  if ($s -match 'steam|epic|riot|battle\.net|battly|minecraft|roblox|valorant|league|fortnite|xbox|gog|ubisoft|ea app|rockstar|game|launcher') { return 'Juegos' }
  if ($s -match 'visual studio|vs code|vscode|cursor|windsurf|rider|webstorm|pycharm|intellij|datagrip|jetbrains|github|git\b|docker|postman|node|python|anaconda|terminal|powershell|godot|unity|android studio|xampp|mysql|mongodb') { return 'Programacion' }
  if ($s -match 'chatgpt|claude|gemini|ollama|lm studio|comfyui|stable diffusion|pinokio') { return 'IA' }
  if ($s -match 'figma|photoshop|illustrator|premiere|after effects|blender|canva|adobe|gimp|krita|inkscape|davinci') { return 'Diseno' }
  return 'Utilidades'
}

# Accesos directos relevantes.
$roots = @((Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs'), (Join-Path $env:PROGRAMDATA 'Microsoft\Windows\Start Menu\Programs'), [Environment]::GetFolderPath('Desktop'), 'C:\Users\Public\Desktop') | Where-Object { Test-Path $_ }
$shell = New-Object -ComObject WScript.Shell
foreach($root in $roots){
  Get-ChildItem -LiteralPath $root -Recurse -Include *.lnk,*.url -File | Select-Object -First 600 | ForEach-Object {
    $name=$_.BaseName; $path=$_.FullName
    if($_.Extension -eq '.lnk'){ $sc=$shell.CreateShortcut($_.FullName); if($sc.TargetPath){ $path=$sc.TargetPath } }
    $cat=Classify $name $path
    if($cat -in @('Programacion','Juegos','IA','Diseno')){ Add-ItemToLauncher $name 'Detectado desde accesos de Windows' $path (TypeFor $path) $cat ($cat -eq 'Programacion') }
  }
}

# Rutas conocidas importantes.
$known = @(
  @{N='Cursor';P='C:\Program Files\cursor\Cursor.exe';C='Programacion'},
  @{N='Steam';P='C:\Program Files (x86)\Steam\steam.exe';C='Juegos'},
  @{N='Epic Games Launcher';P='C:\Program Files (x86)\Epic Games\Launcher\Portal\Binaries\Win64\EpicGamesLauncher.exe';C='Juegos'},
  @{N='Battly Launcher';P='C:\Program Files\Battly Launcher\Battly Launcher.exe';C='Juegos'},
  @{N='ChatGPT';P='https://chatgpt.com';C='IA'},
  @{N='GitHub';P='https://github.com';C='Programacion'},
  @{N='Documentos';P=[Environment]::GetFolderPath('MyDocuments');C='Carpetas'},
  @{N='Descargas';P=(Join-Path $HOME 'Downloads');C='Carpetas'},
  @{N='Escritorio';P=[Environment]::GetFolderPath('Desktop');C='Carpetas'}
)
foreach($k in $known){ if(($k.P -match '^https?://') -or (Test-Path -LiteralPath $k.P)){ Add-ItemToLauncher $k.N 'Acceso principal detectado' $k.P (TypeFor $k.P) $k.C ($k.C -in @('Programacion','IA')) } }

# Steam manifests.
$steamApps = @('C:\Program Files (x86)\Steam\steamapps')
$libFile = 'C:\Program Files (x86)\Steam\steamapps\libraryfolders.vdf'
if(Test-Path $libFile){
  $content = Get-Content -Raw -LiteralPath $libFile
  foreach($m in [regex]::Matches($content, '"path"\s+"([^"]+)"')){ $steamApps += (Join-Path (($m.Groups[1].Value) -replace '\\\\','\') 'steamapps') }
}
foreach($sa in ($steamApps | Select-Object -Unique)){ if(Test-Path $sa){ Get-ChildItem -LiteralPath $sa -Filter 'appmanifest_*.acf' -File | ForEach-Object { $acf=Get-Content -Raw -LiteralPath $_.FullName; $nm=[regex]::Match($acf,'"name"\s+"([^"]+)"'); $id=[regex]::Match($_.Name,'appmanifest_(\d+)\.acf'); if($nm.Success -and $id.Success){ Add-ItemToLauncher $nm.Groups[1].Value 'Juego detectado en Steam' ('steam://rungameid/' + $id.Groups[1].Value) 'Url' 'Juegos' $false } } } }

# Proyectos: profundidad limitada y carpetas tipicas.
$projectRoots = @([Environment]::GetFolderPath('MyDocuments'), (Join-Path $HOME 'Desktop'), (Join-Path $HOME 'source'), (Join-Path $HOME 'repos'), (Join-Path $HOME 'Projects')) | Where-Object { Test-Path $_ } | Select-Object -Unique
$projectDirs = New-Object System.Collections.Generic.HashSet[string]
foreach($root in $projectRoots){
  Get-ChildItem -LiteralPath $root -Directory -Recurse -Depth 3 | Where-Object { $_.FullName -notmatch '\\(node_modules|bin|obj|\.git|AppData|OneDriveTemp)($|\\)' } | ForEach-Object {
    $d=$_.FullName
    $has = (Test-Path -LiteralPath (Join-Path $d '.git')) -or (Test-Path -LiteralPath (Join-Path $d 'package.json')) -or (Test-Path -LiteralPath (Join-Path $d 'pyproject.toml')) -or (Test-Path -LiteralPath (Join-Path $d 'Cargo.toml')) -or (Get-ChildItem -LiteralPath $d -File -Filter *.sln | Select-Object -First 1) -or (Get-ChildItem -LiteralPath $d -File -Filter *.csproj | Select-Object -First 1)
    if($has){ [void]$projectDirs.Add($d) }
  }
}
[void]$projectDirs.Add('C:\Users\Jonathan\Documents\New project 2')
foreach($d in ($projectDirs | Select-Object -First 60)){ Add-ItemToLauncher (Split-Path $d -Leaf) 'Carpeta de proyecto detectada' $d 'Folder' 'Programacion' $false }

$data.Items = @($items)
$data | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $dataPath -Encoding UTF8
[pscustomobject]@{ DataPath=$dataPath; Total=$items.Count; Programacion=$added.Programacion; Juegos=$added.Juegos; IA=$added.IA; Diseno=$added.Diseno; Carpetas=$added.Carpetas; Utilidades=$added.Utilidades } | Format-List
