param(
  [string]$ViteUrl = "http://127.0.0.1:8444/",
  [string]$ChromeUrl = "http://127.0.0.1:9222/json/version"
)

$ErrorActionPreference = "Stop"

function Test-Url {
  param([string]$Url)

  try {
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
    return [pscustomobject]@{
      url = $Url
      ok = $true
      status = [int]$response.StatusCode
    }
  } catch {
    return [pscustomobject]@{
      url = $Url
      ok = $false
      status = $null
      error = $_.Exception.Message
    }
  }
}

$result = [pscustomobject]@{
  vite = Test-Url -Url $ViteUrl
  chrome = Test-Url -Url $ChromeUrl
}

$result | ConvertTo-Json -Depth 4
