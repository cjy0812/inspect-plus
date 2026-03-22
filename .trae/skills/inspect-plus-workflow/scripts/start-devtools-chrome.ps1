param(
  [string]$ChromePath,
  [int]$Port = 9222,
  [string]$UserDataDir = "D:\Chrome\UserData",
  [string]$ProfileDirectory = "Default"
)

$ErrorActionPreference = "Stop"

if (-not $ChromePath) {
  $resolved = & "$PSScriptRoot\resolve-tooling.ps1" | ConvertFrom-Json
  $ChromePath = $resolved.chrome
}

if (-not $ChromePath -or -not (Test-Path $ChromePath)) {
  throw "Chrome executable not found"
}

$debugUrl = "http://127.0.0.1:$Port/json/version"
try {
  $existing = Invoke-WebRequest -Uri $debugUrl -UseBasicParsing -TimeoutSec 3
  if ($existing.StatusCode -eq 200) {
    Write-Host "Chrome remote debugging already available at $debugUrl"
    exit 0
  }
} catch {
}

Start-Process -FilePath $ChromePath -ArgumentList @(
  "--remote-debugging-port=$Port",
  "--user-data-dir=$UserDataDir",
  "--profile-directory=$ProfileDirectory"
)

Write-Host "Started Chrome with remote debugging on port $Port"
