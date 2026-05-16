# Downloads yt-dlp and ffmpeg into src-tauri/binaries/ (Windows x64).
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$BinDir = Join-Path $Root "src-tauri\binaries"
$Triple = "x86_64-pc-windows-msvc"

New-Item -ItemType Directory -Force -Path $BinDir | Out-Null

$ytdlpUrl = "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe"
$ytdlpNamed = Join-Path $BinDir "yt-dlp-$Triple.exe"
Write-Host "Downloading yt-dlp..."
Invoke-WebRequest -Uri $ytdlpUrl -OutFile $ytdlpNamed -UseBasicParsing
$ffmpegZipUrl = "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip"
$zipPath = Join-Path $env:TEMP "ffmpeg-essentials.zip"
$extractDir = Join-Path $env:TEMP "ffmpeg-essentials-extract"
Write-Host "Downloading ffmpeg essentials..."
$ProgressPreference = "SilentlyContinue"
Invoke-WebRequest -Uri $ffmpegZipUrl -OutFile $zipPath -UseBasicParsing
if (Test-Path $extractDir) { Remove-Item $extractDir -Recurse -Force }
Expand-Archive -Path $zipPath -DestinationPath $extractDir -Force
$ffmpegSrc = Get-ChildItem -Path $extractDir -Recurse -Filter "ffmpeg.exe" | Select-Object -First 1
if (-not $ffmpegSrc) { throw "ffmpeg.exe not found in archive" }
$ffmpegNamed = Join-Path $BinDir "ffmpeg-$Triple.exe"
Copy-Item $ffmpegSrc.FullName $ffmpegNamed -Force

Write-Host "Done:"
Get-ChildItem $BinDir -Filter "*.exe" | Format-Table Name, Length
