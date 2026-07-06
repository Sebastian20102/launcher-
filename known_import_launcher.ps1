$ErrorActionPreference='SilentlyContinue'
$dataPath=Join-Path $env:APPDATA 'NexusLauncher\launcher-data.json'
$old=Get-Content -Raw $dataPath | ConvertFrom-Json
Copy-Item $dataPath ($dataPath+'.bak-known-'+(Get-Date -Format 'yyyyMMdd-HHmmss')) -Force
$items=New-Object System.Collections.Generic.List[object]
$existing=@{}
function Cat($c){ @{Juegos=0;Programacion=1;IA=2;Diseno=3;Utilidades=4;Carpetas=5;Web=6}[$c] }
function Typ($t){ @{Exe=0;Folder=1;Url=2;Command=3}[$t] }
function Add($n,$d,$p,$t,$c,$f=$false){ if(!$n -or !$p){return}; $k=$p.ToLowerInvariant(); if($existing[$k]){return}; $items.Add([pscustomobject]@{Id=[guid]::NewGuid().ToString('N');Name=$n;Description=$d;Path=$p;Arguments='';Type=(Typ $t);Category=(Cat $c);IconPath='';CoverImagePath='';IsFavorite=[bool]$f;LastOpened=$null;OpenCount=0}); $existing[$k]=$true }
foreach($it in @($old.Items)){ $items.Add($it); $existing[$it.Path.ToLowerInvariant()]=$true }
$known=@(
@('Cursor','Editor AI para programar','C:\Program Files\cursor\Cursor.exe','Exe','Programacion',$true),
@('Visual Studio Code','Editor de codigo',(Join-Path $env:LOCALAPPDATA 'Programs\Microsoft VS Code\Code.exe'),'Exe','Programacion',$true),
@('Windows Terminal','Terminal moderna',(Join-Path $env:LOCALAPPDATA 'Microsoft\WindowsApps\wt.exe'),'Exe','Programacion',$true),
@('PowerShell','Shell para desarrollo','powershell.exe','Command','Programacion',$false),
@('GitHub','Repositorios y proyectos','https://github.com','Url','Programacion',$true),
@('ChatGPT','Asistente de IA','https://chatgpt.com','Url','IA',$true),
@('Steam','Launcher de Steam','C:\Program Files (x86)\Steam\steam.exe','Exe','Juegos',$true),
@('Epic Games Launcher','Launcher de Epic Games','C:\Program Files (x86)\Epic Games\Launcher\Portal\Binaries\Win64\EpicGamesLauncher.exe','Exe','Juegos',$false),
@('Battly Launcher','Launcher de juegos','C:\Program Files\Battly Launcher\Battly Launcher.exe','Exe','Juegos',$false),
@('Documentos','Carpeta Documentos',[Environment]::GetFolderPath('MyDocuments'),'Folder','Carpetas',$false),
@('Descargas','Carpeta Descargas',(Join-Path $HOME 'Downloads'),'Folder','Carpetas',$false),
@('Escritorio','Carpeta Escritorio',[Environment]::GetFolderPath('Desktop'),'Folder','Carpetas',$false),
@('New project 2','Proyecto actual','C:\Users\Jonathan\Documents\New project 2','Folder','Programacion',$false),
@('NexusLauncherWpf','Proyecto WPF del launcher','C:\Users\Jonathan\Documents\New project 2\NexusLauncherWpf','Folder','Programacion',$true)
)
foreach($k in $known){ if($k[3] -eq 'Command' -or $k[2] -match '^https?://' -or (Test-Path -LiteralPath $k[2])){ Add $k[0] $k[1] $k[2] $k[3] $k[4] $k[5] } }
# Steam games only, no recursive search.
$sa='C:\Program Files (x86)\Steam\steamapps'
if(Test-Path $sa){ Get-ChildItem -LiteralPath $sa -Filter 'appmanifest_*.acf' -File | ForEach-Object { $acf=Get-Content -Raw $_.FullName; $nm=[regex]::Match($acf,'"name"\s+"([^"]+)"'); $id=[regex]::Match($_.Name,'appmanifest_(\d+)\.acf'); if($nm.Success -and $id.Success){ Add $nm.Groups[1].Value 'Juego detectado en Steam' ('steam://rungameid/'+$id.Groups[1].Value) 'Url' 'Juegos' $false } } }
# Proyectos inmediatos de Documents.
Get-ChildItem -LiteralPath ([Environment]::GetFolderPath('MyDocuments')) -Directory | ForEach-Object { $d=$_.FullName; if((Test-Path (Join-Path $d '.git')) -or (Test-Path (Join-Path $d 'package.json')) -or (Test-Path (Join-Path $d '*.sln'))){ Add $_.Name 'Carpeta de proyecto detectada' $d 'Folder' 'Programacion' $false } }
$new=[ordered]@{Settings=$old.Settings;GamingMode=$old.GamingMode;Items=@($items|Sort-Object Category,Name)}
$new|ConvertTo-Json -Depth 8|Set-Content $dataPath -Encoding UTF8
$new.Items|Group-Object Category|%{[pscustomobject]@{Category=@('Juegos','Programacion','IA','Diseno','Utilidades','Carpetas','Web')[[int]$_.Name];Count=$_.Count}}|Format-Table -AutoSize
'TOTAL: '+$new.Items.Count
