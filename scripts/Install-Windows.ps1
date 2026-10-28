[CmdletBinding()]
param([string]$Destination, [switch]$Build, [switch]$NoShortcuts)
$ErrorActionPreference = 'Stop'
$repository = Split-Path $PSScriptRoot -Parent
$windows = Join-Path $repository 'windows'
if (-not $Destination) { $Destination = Join-Path (Split-Path $repository -Parent) 'ClipBoardLine-Windows' }
$Destination = [IO.Path]::GetFullPath($Destination)
if ($Destination.TrimEnd('\') -eq [IO.Path]::GetFullPath($repository).TrimEnd('\')) { throw 'The application folder must be separate from the source repository (Windows ignores letter case).' }
if ($Build) {
    $npm = Get-Command npm.cmd -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source -First 1
    if (-not $npm) {
        $tools = Join-Path $env:LOCALAPPDATA 'ZarlofDevTools'
        $runtime = Get-ChildItem -LiteralPath $tools -Directory -ErrorAction SilentlyContinue |
            Where-Object { $_.Name -match '^node-v24\.[0-9]+\.[0-9]+-win-x64$' } |
            Sort-Object { [version]($_.Name -replace '^node-v|-win-x64$','') } -Descending | Select-Object -First 1
        if ($runtime) { $npm = Join-Path $runtime.FullName 'npm.cmd' }
    }
    if (-not $npm) { throw 'Install Node.js 24 with npm before building.' }
    $previousPath = $env:PATH
    $env:PATH = (Split-Path $npm -Parent) + ';' + $env:PATH
    Push-Location $windows
    try {
        & $npm ci --no-fund
        if ($LASTEXITCODE -ne 0) { throw 'Dependency installation failed.' }
        & python (Join-Path $PSScriptRoot 'prepare-windows-search-models.py')
        if ($LASTEXITCODE -ne 0) { throw 'Offline search model verification failed.' }
        & $npm run dist
        if ($LASTEXITCODE -ne 0) { throw 'Windows package build failed.' }
    } finally { Pop-Location; $env:PATH = $previousPath }
}
$source = Join-Path $windows 'dist\win-unpacked'
if (-not (Test-Path -LiteralPath (Join-Path $source 'ClipBoardLine.exe') -PathType Leaf)) { throw 'Build ClipBoardLine first, or run this script with -Build using Node 24 and Python 3.' }
if ($Destination -eq [IO.Path]::GetFullPath($source)) { throw 'Choose a destination outside the package staging folder.' }
$executable = Join-Path $Destination 'ClipBoardLine.exe'
$running = Get-Process -Name 'ClipBoardLine' -ErrorAction SilentlyContinue | Where-Object { $_.Path -eq $executable }
if ($running) { throw 'Quit the installed ClipBoardLine from its tray menu before updating.' }
New-Item -ItemType Directory -Force -Path $Destination | Out-Null
Get-ChildItem -LiteralPath $source -Force | Copy-Item -Destination $Destination -Recurse -Force
if (-not $NoShortcuts) {
    $shell = New-Object -ComObject WScript.Shell
    $programs = Join-Path ([Environment]::GetFolderPath('Programs')) 'Zarlof'
    New-Item -ItemType Directory -Path $programs -Force | Out-Null
    foreach ($link in @((Join-Path ([Environment]::GetFolderPath('Desktop')) 'ClipBoardLine.lnk'), (Join-Path $programs 'ClipBoardLine.lnk'))) {
        $shortcut = $shell.CreateShortcut($link)
        $shortcut.TargetPath = $executable
        $shortcut.WorkingDirectory = $Destination
        $shortcut.Description = 'ClipBoardLine — Windows pano askıları ve yerel kütüphane'
        $shortcut.Save()
    }
}
Write-Output "ClipBoardLine hazır: $executable"
