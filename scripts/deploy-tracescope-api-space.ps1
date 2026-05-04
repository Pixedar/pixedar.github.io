$ErrorActionPreference = "Stop"

$source = Resolve-Path "$PSScriptRoot\..\backend\tracescope-api"
$traceScopeRoot = "C:\Users\assas\PycharmProjects\TraceScope"
$repoId = "Pixedar/tracescope-api"
$spaceSdk = "docker"
$tmp = Join-Path $env:TEMP ("tracescope-api-space-" + [guid]::NewGuid().ToString("N"))

New-Item -ItemType Directory -Path $tmp | Out-Null
Copy-Item -Path (Join-Path $source "*") -Destination $tmp -Recurse -Force

# Reuse the real TraceScope package and a precomputed AnalysisResult cache.
Copy-Item -LiteralPath (Join-Path $traceScopeRoot "tracescope") -Destination (Join-Path $tmp "tracescope") -Recurse -Force
New-Item -ItemType Directory -Force -Path (Join-Path $tmp "cache") | Out-Null
$preferredCache = Join-Path $traceScopeRoot "cache\ai_papers_recent_rbf"
if (-not (Test-Path "$preferredCache.npz")) {
  $preferredCache = Join-Path $traceScopeRoot "cache\prm_demo_rbf"
}
Copy-Item -LiteralPath "$preferredCache.npz" -Destination (Join-Path $tmp "cache\latest.npz") -Force
Copy-Item -LiteralPath "$preferredCache.json" -Destination (Join-Path $tmp "cache\latest.json") -Force

Push-Location $tmp
try {
  $cert = python -c "import certifi; print(certifi.where())"
  $env:SSL_CERT_FILE = $cert

  hf repo create $repoId --type space --space-sdk $spaceSdk --private --exist-ok
  if ($LASTEXITCODE -ne 0) {
    Write-Warning "Private Space creation failed or already exists; trying public/existing Space path."
    hf repo create $repoId --type space --space-sdk $spaceSdk --exist-ok
  }

  git init
  git remote add origin "https://huggingface.co/spaces/$repoId"
  git add .
  git commit -m "Deploy TraceScope API"
  git push --force origin HEAD:main

  Write-Host "Deployed https://huggingface.co/spaces/$repoId"
  Write-Host "Set OPENAI_API_KEY as a Space secret if it is not already configured."
}
finally {
  Pop-Location
  Remove-Item -LiteralPath $tmp -Recurse -Force
}
