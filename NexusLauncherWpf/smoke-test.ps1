$ErrorActionPreference = "Stop"

$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectPath = Join-Path $projectDir "NexusLauncherWpf.csproj"
$releaseExe = Join-Path $projectDir "dist\NexusLauncher-win-x64\NexusLauncher.exe"
$releaseZip = Join-Path $projectDir "dist\NexusLauncher-win-x64.zip"
$dataDir = Join-Path $env:APPDATA "NexusLauncher"
$dataPath = Join-Path $dataDir "launcher-data.json"
$backupDir = Join-Path $dataDir "backups"
$exportDir = Join-Path $dataDir "exports"

function Assert-PathExists {
    param(
        [string] $Path,
        [string] $Label
    )

    if (!(Test-Path -LiteralPath $Path)) {
        throw "$Label no existe: $Path"
    }
}

function Assert-JsonFile {
    param(
        [string] $Path,
        [string] $Label
    )

    if (Test-Path -LiteralPath $Path) {
        try {
            Get-Content -Raw -LiteralPath $Path | ConvertFrom-Json | Out-Null
        }
        catch {
            throw "$Label no es JSON valido: $Path"
        }
    }
}

Write-Host "Nexus Launcher smoke test" -ForegroundColor Cyan

Write-Host "1/5 Build Debug"
dotnet build $projectPath
if ($LASTEXITCODE -ne 0) {
    throw "dotnet build fallo con codigo $LASTEXITCODE"
}

Write-Host "2/5 Archivos clave"
Assert-PathExists (Join-Path $projectDir "Views\MainWindow.xaml") "MainWindow.xaml"
Assert-PathExists (Join-Path $projectDir "Views\ItemEditorWindow.xaml") "ItemEditorWindow.xaml"
Assert-PathExists (Join-Path $projectDir "Services\JsonStorageService.cs") "JsonStorageService.cs"
Assert-PathExists (Join-Path $projectDir "README.md") "README.md"

Write-Host "3/5 Datos locales"
Assert-JsonFile $dataPath "launcher-data.json"
if (Test-Path -LiteralPath $backupDir) {
    Get-ChildItem -LiteralPath $backupDir -Filter *.json -ErrorAction SilentlyContinue | ForEach-Object {
        Assert-JsonFile $_.FullName "backup"
    }
}
if (Test-Path -LiteralPath $exportDir) {
    Get-ChildItem -LiteralPath $exportDir -Filter *.json -ErrorAction SilentlyContinue | ForEach-Object {
        Assert-JsonFile $_.FullName "export"
    }
}

Write-Host "4/5 Release"
powershell -ExecutionPolicy Bypass -File (Join-Path $projectDir "build-release.ps1")
Assert-PathExists $releaseExe "NexusLauncher.exe"
Assert-PathExists $releaseZip "ZIP release"

Write-Host "5/5 Arranque rapido"
Get-Process -Name "NexusLauncher" -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process -Name "NexusLauncherWpf" -ErrorAction SilentlyContinue | Stop-Process -Force
$process = Start-Process -FilePath $releaseExe -PassThru
$running = $null
for ($attempt = 0; $attempt -lt 12; $attempt++) {
    Start-Sleep -Seconds 1
    $running = Get-Process -Id $process.Id -ErrorAction SilentlyContinue
    if ($null -ne $running -and $running.Responding) {
        break
    }
}

if ($null -eq $running -or !$running.Responding) {
    throw "El release no quedo respondiendo al arrancar."
}
$running | Stop-Process -Force

Write-Host ""
Write-Host "Smoke test correcto." -ForegroundColor Green
