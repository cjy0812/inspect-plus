param()

$ErrorActionPreference = "Stop"

function Resolve-FirstExistingPath {
  param([string[]]$Candidates)

  foreach ($candidate in $Candidates) {
    if ([string]::IsNullOrWhiteSpace($candidate)) {
      continue
    }
    if (Test-Path $candidate) {
      return (Resolve-Path $candidate).Path
    }
  }

  return $null
}

$pwshFromPath = (Get-Command pwsh -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty Source)
$pwshCandidates = @(
  $pwshFromPath,
  "C:\Program Files\PowerShell\7\pwsh.exe",
  "C:\Program Files\PowerShell\7-preview\pwsh.exe"
)

$chromeFromPath = (Get-Command chrome -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty Source)
$chromeCandidates = @(
  $env:CHROME_PATH,
  "D:\Chrome\Chrome.exe",
  $chromeFromPath,
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
  "$env:LocalAppData\Google\Chrome\Application\chrome.exe"
)

$result = [pscustomobject]@{
  pwsh7 = Resolve-FirstExistingPath -Candidates $pwshCandidates
  chrome = Resolve-FirstExistingPath -Candidates $chromeCandidates
}

$result | ConvertTo-Json -Depth 3
