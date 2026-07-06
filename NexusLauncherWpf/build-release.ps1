$ErrorActionPreference = "Stop"

$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectPath = Join-Path $projectDir "NexusLauncherWpf.csproj"
$distRoot = Join-Path $projectDir "dist"
$publishDir = Join-Path $distRoot "NexusLauncher-win-x64"
$zipPath = Join-Path $distRoot "NexusLauncher-win-x64.zip"

Write-Host "Nexus Launcher release build" -ForegroundColor Cyan

Get-Process -Name "NexusLauncher" -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process -Name "NexusLauncherWpf" -ErrorAction SilentlyContinue | Stop-Process -Force

if (Test-Path $publishDir) {
    Remove-Item -LiteralPath $publishDir -Recurse -Force
}

New-Item -ItemType Directory -Force -Path $distRoot | Out-Null

dotnet publish $projectPath `
    -c Release `
    -r win-x64 `
    --self-contained false `
    /p:PublishDir="$publishDir\"

if ($LASTEXITCODE -ne 0) {
    throw "dotnet publish fallo con codigo $LASTEXITCODE"
}

$sourceExe = Join-Path $publishDir "NexusLauncherWpf.exe"
$targetExe = Join-Path $publishDir "NexusLauncher.exe"
if (Test-Path $sourceExe) {
    Move-Item -LiteralPath $sourceExe -Destination $targetExe -Force
}

if (!(Test-Path $targetExe)) {
    throw "No se encontro el ejecutable publicado: $targetExe"
}

Copy-Item -LiteralPath (Join-Path $projectDir "README.md") -Destination (Join-Path $publishDir "README.md") -Force

if (Test-Path $zipPath) {
    Remove-Item -LiteralPath $zipPath -Force
}

Compress-Archive -Path (Join-Path $publishDir "*") -DestinationPath $zipPath -Force

Write-Host ""
Write-Host "Release listo:" -ForegroundColor Green
Write-Host "  $publishDir"
Write-Host "  $zipPath"
