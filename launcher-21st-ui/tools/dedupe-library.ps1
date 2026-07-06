$ErrorActionPreference = "SilentlyContinue"

function Normalize-Name([string]$name) {
  if ([string]::IsNullOrWhiteSpace($name)) { return "" }
  $value = $name.ToLowerInvariant()
  $value = $value -replace '\s+', ' '
  $value = $value -replace '\s*-\s*shortcut$', ''
  $value = $value -replace '\.lnk$|\.url$|\.exe$', ''
  $value.Trim()
}

function Get-OpenPriority($item) {
  $location = [string]$item.location
  $realPath = [string]$item.realPath
  $source = [string]$item.source
  if ($location -match '^steam://rungameid/\d+' -or $realPath -match '^steam://rungameid/\d+') { return 100 }
  if ($location -match '\.lnk$') { return 88 }
  if ($location -match '\.exe$' -or $realPath -match '\.exe$') { return 82 }
  if ($location -match '\.url$') { return 75 }
  if ($source -eq "Archivo local" -and (Test-Path -LiteralPath $location -PathType Container)) { return 62 }
  if ($location -match '^[a-z][a-z0-9+.-]*://') { return 58 }
  return 40
}

function Get-MetadataScore($item) {
  $score = 0
  foreach ($field in @("version", "size", "iconUrl", "realPath", "fileModified", "appId", "installDate")) {
    if ($item.PSObject.Properties[$field] -and -not [string]::IsNullOrWhiteSpace([string]$item.$field)) {
      $score += 1
    }
  }
  return $score
}

function Set-JsonProperty($object, [string]$name, $value) {
  if ($object.PSObject.Properties[$name]) {
    $object.$name = $value
  } else {
    $object | Add-Member -NotePropertyName $name -NotePropertyValue $value
  }
}

function Merge-Group($groupItems) {
  $preferredOpen = $groupItems | Sort-Object @{ Expression = { Get-OpenPriority $_ }; Descending = $true }, @{ Expression = { Get-MetadataScore $_ }; Descending = $true } | Select-Object -First 1
  $bestMeta = $groupItems | Sort-Object @{ Expression = { Get-MetadataScore $_ }; Descending = $true }, @{ Expression = { Get-OpenPriority $_ }; Descending = $true } | Select-Object -First 1

  $merged = $preferredOpen.PSObject.Copy()

  foreach ($field in @("vendor", "version", "size", "iconUrl", "realPath", "fileModified", "installDate", "appId", "description")) {
    $current = if ($merged.PSObject.Properties[$field]) { [string]$merged.$field } else { "" }
    if (-not [string]::IsNullOrWhiteSpace($current)) { continue }
    foreach ($candidate in @($bestMeta) + $groupItems) {
      if ($candidate.PSObject.Properties[$field] -and -not [string]::IsNullOrWhiteSpace([string]$candidate.$field)) {
        Set-JsonProperty $merged $field $candidate.$field
        break
      }
    }
  }

  $types = @($groupItems | ForEach-Object { $_.type })
  if ($types -contains "Juego") { $merged.type = "Juego" }
  if (($groupItems | Where-Object { $_.favorite }).Count -gt 0) { $merged.favorite = $true }

  $sources = @($groupItems | ForEach-Object { $_.source } | Where-Object { $_ } | Select-Object -Unique)
  if ($sources.Count -gt 1) {
    Set-JsonProperty $merged "source" ($sources -join " + ")
  }

  if ($merged.realPath -match '^steam://rungameid/\d+') {
    $merged.location = $merged.realPath
  }

  if ($groupItems.Count -gt 1) {
    Set-JsonProperty $merged "description" (([string]$merged.description).Trim() + " | Consolidado desde $($groupItems.Count) fuentes reales.").Trim(" |")
  }

  return $merged
}

$libraryPath = Join-Path $env:APPDATA "Nexus Launcher\library.json"
$items = Get-Content -LiteralPath $libraryPath -Raw | ConvertFrom-Json

$groups = $items | Group-Object { Normalize-Name $_.name }
$mergedItems = New-Object System.Collections.Generic.List[object]
$duplicates = New-Object System.Collections.Generic.List[object]

foreach ($group in $groups) {
  if ($group.Count -gt 1) {
    $duplicates.Add([pscustomobject]@{ name = $group.Name; count = $group.Count })
  }
  $mergedItems.Add((Merge-Group @($group.Group)))
}

$ranked = $mergedItems | Sort-Object `
  @{ Expression = { if ($_.favorite) { 0 } else { 1 } } }, `
  @{ Expression = { switch ($_.type) { "Juego" { 0 } "Proyecto" { 1 } "Programa" { 2 } "Sistema" { 3 } default { 4 } } } }, `
  name

$ranked | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $libraryPath -Encoding UTF8
Copy-Item $libraryPath (Resolve-Path ".\public\library.generated.json") -Force

[ordered]@{
  before = @($items).Count
  after = @($ranked).Count
  removed = @($items).Count - @($ranked).Count
  duplicateGroups = @($duplicates).Count
  sample = @($duplicates | Sort-Object count -Descending | Select-Object -First 20)
} | ConvertTo-Json -Depth 5
