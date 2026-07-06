$ErrorActionPreference = 'SilentlyContinue'
$dataDir = Join-Path $env:APPDATA 'NexusLauncher'
$dataPath = Join-Path $dataDir 'launcher-data.json'
New-Item -ItemType Directory -Force -Path $dataDir | Out-Null
$old = if(Test-Path $dataPath){ Get-Content -Raw -LiteralPath $dataPath | ConvertFrom-Json } else { $null }
if(Test-Path $dataPath){ Copy-Item -LiteralPath $dataPath -Destination ($dataPath + '.bak-curated-' + (Get-Date -Format 'yyyyMMdd-HHmmss')) -Force }
$items = New-Object System.Collections.Generic.List[object]
$existing = @{}
function New-Id { [Guid]::NewGuid().ToString('N') }
function CatNum($cat){ @{Juegos=0;Programacion=1;IA=2;Diseno=3;Utilidades=4;Carpetas=5;Web=6}[$cat] }
function TypeNum($type){ @{Exe=0;Folder=1;Url=2;Command=3}[$type] }
function AddItem($name,$desc,$path,$type,$cat,$fav=$false,$openCount=0,$lastOpened=$null,$id=$null){
  if([string]::IsNullOrWhiteSpace($name) -or [string]::IsNullOrWhiteSpace($path)){ return $false }
  $key=$path.ToLowerInvariant()
  if($existing.ContainsKey($key)){ return $false }
  if(!$id){ $id=New-Id }
  $items.Add([pscustomobject]@{ Id=$id; Name=$name; Description=$desc; Path=$path; Arguments=''; Type=(TypeNum $type); Category=(CatNum $cat); IconPath=''; CoverImagePath=''; IsFavorite=[bool]$fav; LastOpened=$lastOpened; OpenCount=[int]$openCount })
  $existing[$key]=$true
  return $true
}

# Conservar items existentes.
if($old -and $old.Items){ foreach($it in @($old.Items)){ 
  $catName = @('Juegos','Programacion','IA','Diseno','Utilidades','Carpetas','Web')[[int]$it.Category]
  $typeName = @('Exe','Folder','Url','Command')[[int]$it.Type]
  AddItem $it.Name $it.Description $it.Path $typeName $catName $it.IsFavorite $it.OpenCount $it.LastOpened $it.Id | Out-Null
}}

# Apps/programas conocidos.
$known = @(
  @{N='Cursor';P='C:\Program Files\cursor\Cursor.exe';C='Programacion';D='Editor AI para programar';F=$true},
  @{N='Visual Studio Code';P=(Join-Path $env:LOCALAPPDATA 'Programs\Microsoft VS Code\Code.exe');C='Programacion';D='Editor de codigo';F=$true},
  @{N='Windows Terminal';P=(Join-Path $env:LOCALAPPDATA 'Microsoft\WindowsApps\wt.exe');C='Programacion';D='Terminal moderna de Windows';F=$true},
  @{N='PowerShell';P='powershell.exe';C='Programacion';D='Shell para desarrollo y scripts';F=$false;T='Command'},
  @{N='GitHub';P='https://github.com';C='Programacion';D='Repositorios y proyectos';F=$true;T='Url'},
  @{N='ChatGPT';P='https://chatgpt.com';C='IA';D='Asistente de IA';F=$true;T='Url'},
  @{N='Steam';P='C:\Program Files (x86)\Steam\steam.exe';C='Juegos';D='Launcher de Steam';F=$true},
  @{N='Epic Games Launcher';P='C:\Program Files (x86)\Epic Games\Launcher\Portal\Binaries\Win64\EpicGamesLauncher.exe';C='Juegos';D='Launcher de Epic Games';F=$false},
  @{N='Battly Launcher';P='C:\Program Files\Battly Launcher\Battly Launcher.exe';C='Juegos';D='Launcher de juegos';F=$false},
  @{N='Documentos';P=[Environment]::GetFolderPath('MyDocuments');C='Carpetas';D='Carpeta Documentos';F=$false;T='Folder'},
  @{N='Descargas';P=(Join-Path $HOME 'Downloads');C='Carpetas';D='Carpeta Descargas';F=$false;T='Folder'},
  @{N='Escritorio';P=[Environment]::GetFolderPath('Desktop');C='Carpetas';D='Carpeta Escritorio';F=$false;T='Folder'}
)
foreach($k in $known){ if(($k.P -match '^https?://') -or ($k.T -eq 'Command') -or (Test-Path -LiteralPath $k.P)){ $t=if($k.T){$k.T}elseif(Test-Path -LiteralPath $k.P -PathType Container){'Folder'}else{'Exe'}; AddItem $k.N $k.D $k.P $t $k.C $k.F | Out-Null } }

# Accesos directos relevantes por nombre.
$patternsProgram = 'visual studio|vs code|cursor|windsurf|rider|webstorm|pycharm|intellij|datagrip|github|docker|postman|node|python|terminal|powershell|godot|unity|android studio'
$patternsGame = 'steam|epic games|riot|battle\.net|battly|minecraft|roblox|valorant|league of legends|fortnite|xbox|gog|ubisoft|ea app|rockstar'
$patternsDesign = 'figma|photoshop|illustrator|premiere|after effects|blender|canva|adobe|gimp|krita|inkscape|davinci'
$patternsAI = 'chatgpt|claude|gemini|ollama|lm studio|comfyui|stable diffusion|pinokio'
$roots = @((Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs'), (Join-Path $env:PROGRAMDATA 'Microsoft\Windows\Start Menu\Programs'), [Environment]::GetFolderPath('Desktop'), 'C:\Users\Public\Desktop') | Where-Object { Test-Path $_ }
$shell = New-Object -ComObject WScript.Shell
foreach($root in $roots){
  Get-ChildItem -LiteralPath $root -Recurse -Include *.lnk,*.url -File | ForEach-Object {
    $name=$_.BaseName; $lower=$name.ToLowerInvariant(); $cat=$null
    if($lower -match $patternsProgram){$cat='Programacion'} elseif($lower -match $patternsGame){$cat='Juegos'} elseif($lower -match $patternsAI){$cat='IA'} elseif($lower -match $patternsDesign){$cat='Diseno'}
    if(!$cat){ return }
    $path=$_.FullName
    if($_.Extension -eq '.lnk'){ $sc=$shell.CreateShortcut($_.FullName); if($sc.TargetPath){ $path=$sc.TargetPath } }
    if($path -and (($path -match '^https?://') -or (Test-Path -LiteralPath $path) -or ($path -match '\.(exe|bat|cmd)$'))){
      $type=if($path -match '^https?://'){'Url'}elseif(Test-Path -LiteralPath $path -PathType Container){'Folder'}else{'Exe'}
      AddItem $name 'Detectado desde accesos de Windows' $path $type $cat ($cat -eq 'Programacion') | Out-Null
    }
  }
}

# Steam games.
$steamApps=@('C:\Program Files (x86)\Steam\steamapps')
$libFile='C:\Program Files (x86)\Steam\steamapps\libraryfolders.vdf'
if(Test-Path $libFile){ $content=Get-Content -Raw -LiteralPath $libFile; foreach($m in [regex]::Matches($content,'"path"\s+"([^"]+)"')){ $steamApps += (Join-Path (($m.Groups[1].Value) -replace '\\\\','\') 'steamapps') } }
foreach($sa in ($steamApps|Select-Object -Unique)){ if(Test-Path $sa){ Get-ChildItem -LiteralPath $sa -Filter 'appmanifest_*.acf' -File | ForEach-Object { $acf=Get-Content -Raw -LiteralPath $_.FullName; $nm=[regex]::Match($acf,'"name"\s+"([^"]+)"'); $id=[regex]::Match($_.Name,'appmanifest_(\d+)\.acf'); if($nm.Success -and $id.Success){ AddItem $nm.Groups[1].Value 'Juego detectado en Steam' ('steam://rungameid/' + $id.Groups[1].Value) 'Url' 'Juegos' $false | Out-Null } } } }

# Proyectos: solo carpetas con marcador directo en ubicaciones comunes.
$projectCandidates = New-Object System.Collections.Generic.HashSet[string]
$projectRoots = @([Environment]::GetFolderPath('MyDocuments'), [Environment]::GetFolderPath('Desktop'), (Join-Path $HOME 'source'), (Join-Path $HOME 'repos'), (Join-Path $HOME 'Projects')) | Where-Object { Test-Path $_ } | Select-Object -Unique
foreach($root in $projectRoots){
  Get-ChildItem -LiteralPath $root -Directory -Recurse -Depth 3 | Where-Object { $_.FullName -notmatch '\\(node_modules|bin|obj|\.git|AppData)($|\\)' } | ForEach-Object {
    $d=$_.FullName
    if((Test-Path (Join-Path $d '.git')) -or (Test-Path (Join-Path $d 'package.json')) -or (Test-Path (Join-Path $d 'pyproject.toml')) -or (Test-Path (Join-Path $d 'Cargo.toml')) -or (Get-ChildItem -LiteralPath $d -File -Filter *.sln | Select-Object -First 1) -or (Get-ChildItem -LiteralPath $d -File -Filter *.csproj | Select-Object -First 1)){ [void]$projectCandidates.Add($d) }
  }
}
[void]$projectCandidates.Add('C:\Users\Jonathan\Documents\New project 2')
foreach($d in ($projectCandidates | Select-Object -First 35)){ AddItem (Split-Path $d -Leaf) 'Carpeta de proyecto detectada' $d 'Folder' 'Programacion' $false | Out-Null }

# Limitar exceso: conservar todos juegos, IA, diseno, carpetas; programacion max 70 ordenada por favoritos/nombre.
$program = @($items | Where-Object { $_.Category -eq (CatNum 'Programacion') } | Sort-Object @{Expression='IsFavorite';Descending=$true}, Name | Select-Object -First 70)
$others = @($items | Where-Object { $_.Category -ne (CatNum 'Programacion') })
$finalItems = @($program + $others | Sort-Object Category, Name)
$newData = [ordered]@{ Settings = if($old.Settings){$old.Settings}else{[ordered]@{Theme='Dark';AccentColor='#C8A96A';StartInGamingMode=$false;DataFileName='launcher-data.json'}}; GamingMode = if($old.GamingMode){$old.GamingMode}else{[ordered]@{Name='Perfil rapido';LauncherItemIds=@()}}; Items = $finalItems }
$newData | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $dataPath -Encoding UTF8
$finalItems | Group-Object Category | Sort-Object Name | ForEach-Object { [pscustomobject]@{ Category=@('Juegos','Programacion','IA','Diseno','Utilidades','Carpetas','Web')[[int]$_.Name]; Count=$_.Count } } | Format-Table -AutoSize
"TOTAL: $($finalItems.Count)"
