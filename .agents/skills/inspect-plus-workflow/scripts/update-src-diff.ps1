param(
  [string]$From = "offical",
  [string]$To = "main",
  [string]$Scope = "src/",
  [string]$OutputPath = "src.diff"
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  throw "git is required"
}

$repoRoot = (git rev-parse --show-toplevel).Trim()
if (-not $repoRoot) {
  throw "Not inside a git repository"
}

Set-Location $repoRoot

$content = git diff "$From..$To" -- $Scope
[System.IO.File]::WriteAllText((Join-Path $repoRoot $OutputPath), $content, [System.Text.Encoding]::UTF8)

Write-Host "Wrote diff to $OutputPath"
