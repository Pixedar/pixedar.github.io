$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$sourceRoot = Resolve-Path "C:\Users\assas\PycharmProjects\mindVisualizer"
$stageRoot = Join-Path ([System.IO.Path]::GetTempPath()) "mindvis-api-space"
$cloneRoot = Join-Path ([System.IO.Path]::GetTempPath()) "mindvisualizer-api-hf-repo"
$spaceId = "Pixedar/mindvisualizer-api"
$spaceName = "mindvisualizer-api"

function Assert-InTemp {
  param([Parameter(Mandatory = $true)][string] $Path)
  $resolvedPath = Resolve-Path -LiteralPath $Path -ErrorAction SilentlyContinue
  if (-not $resolvedPath) { return }
  $resolvedTemp = Resolve-Path -LiteralPath ([System.IO.Path]::GetTempPath())
  if (-not $resolvedPath.Path.StartsWith($resolvedTemp.Path, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to remove path outside temp directory: $($resolvedPath.Path)"
  }
}

function Reset-Directory {
  param([Parameter(Mandatory = $true)][string] $Path)
  if (Test-Path -LiteralPath $Path) {
    Assert-InTemp -Path $Path
    Remove-Item -LiteralPath $Path -Recurse -Force
  }
  New-Item -ItemType Directory -Path $Path | Out-Null
}

function Invoke-Checked {
  param([Parameter(Mandatory = $true)][string] $Exe, [Parameter(Mandatory = $true)][string[]] $Arguments)
  & $Exe @Arguments
  if ($LASTEXITCODE -ne 0) { throw "$Exe $($Arguments -join ' ') failed with exit code $LASTEXITCODE" }
}

function Set-HfCertificate {
  $cert = python -c "import certifi; print(certifi.where())"
  if ($LASTEXITCODE -eq 0 -and $cert -and (Test-Path -LiteralPath $cert)) {
    $env:SSL_CERT_FILE = $cert
    $env:REQUESTS_CA_BUNDLE = $cert
  }
}

function Test-SpaceExists {
  & hf spaces info $spaceId 1>$null 2>$null
  return $LASTEXITCODE -eq 0
}

Write-Host "[mindvis-api] staging API Space"
Reset-Directory -Path $stageRoot
New-Item -ItemType Directory -Path (Join-Path $stageRoot "mindVisualizer") | Out-Null

Copy-Item -LiteralPath (Join-Path $sourceRoot "src") -Destination (Join-Path $stageRoot "mindVisualizer\src") -Recurse -Force
Copy-Item -LiteralPath (Join-Path $sourceRoot "data") -Destination (Join-Path $stageRoot "mindVisualizer\data") -Recurse -Force
Remove-Item -LiteralPath (Join-Path $stageRoot "mindVisualizer\data\meshes") -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath (Join-Path $stageRoot "mindVisualizer\data\roi_flow") -Recurse -Force -ErrorAction SilentlyContinue

Copy-Item -LiteralPath (Join-Path $repoRoot "backend\mindvis-api\app.py") -Destination (Join-Path $stageRoot "app.py") -Force
Copy-Item -LiteralPath (Join-Path $repoRoot "backend\mindvis-api\requirements.txt") -Destination (Join-Path $stageRoot "requirements.txt") -Force
Copy-Item -LiteralPath (Join-Path $repoRoot "backend\mindvis-api\Dockerfile") -Destination (Join-Path $stageRoot "Dockerfile") -Force

@"
---
title: MindVisualizer API
sdk: docker
app_port: 7860
pinned: false
---

# MindVisualizer API

Python-backed probe trajectory and explanation service.
"@ | Set-Content -LiteralPath (Join-Path $stageRoot "README.md") -Encoding utf8

@"
.git
__pycache__
*.pyc
.env
"@ | Set-Content -LiteralPath (Join-Path $stageRoot ".gitignore") -Encoding ascii

@"
*.bin filter=lfs diff=lfs merge=lfs -text
*.npy filter=lfs diff=lfs merge=lfs -text
*.npz filter=lfs diff=lfs merge=lfs -text
*.obj filter=lfs diff=lfs merge=lfs -text
*.nii filter=lfs diff=lfs merge=lfs -text
*.gz filter=lfs diff=lfs merge=lfs -text
"@ | Set-Content -LiteralPath (Join-Path $stageRoot ".gitattributes") -Encoding ascii

Set-HfCertificate
if (-not (Test-SpaceExists)) {
  Invoke-Checked -Exe "huggingface-cli" -Arguments @("repo", "create", $spaceName, "--type", "space", "--space_sdk", "docker", "-y")
}

$secretFile = Join-Path $sourceRoot.Path ".env"
if (Test-Path -LiteralPath $secretFile) {
  $secretScript = @"
from pathlib import Path
from huggingface_hub import HfApi
values = {}
for line in Path(r"$secretFile").read_text(encoding="utf-8").splitlines():
    line = line.strip()
    if not line or line.startswith("#") or "=" not in line:
        continue
    k, v = line.split("=", 1)
    values[k.strip()] = v.strip().strip('"').strip("'")
api_key = values.get("OPENAI_API_KEY")
if api_key:
    HfApi().add_space_secret(repo_id="$spaceId", key="OPENAI_API_KEY", value=api_key)
"@
  $secretScript | python -
}

Reset-Directory -Path $cloneRoot
Remove-Item -LiteralPath $cloneRoot -Recurse -Force
$env:GIT_LFS_SKIP_SMUDGE = "1"
Invoke-Checked -Exe "git" -Arguments @("clone", "https://huggingface.co/spaces/$spaceId", $cloneRoot)
Remove-Item Env:\GIT_LFS_SKIP_SMUDGE -ErrorAction SilentlyContinue
Invoke-Checked -Exe "git" -Arguments @("-C", $cloneRoot, "lfs", "install", "--local")
Invoke-Checked -Exe "git" -Arguments @("-C", $cloneRoot, "rm", "-r", "--cached", "--ignore-unmatch", ".")
Get-ChildItem -LiteralPath $cloneRoot -Force | Where-Object { $_.Name -ne ".git" } | Remove-Item -Recurse -Force
& robocopy $stageRoot $cloneRoot /E /R:2 /W:2 /NFL /NDL /NJH /NJS /NP | Out-Host
if ($LASTEXITCODE -gt 7) { throw "robocopy to clone failed with exit code $LASTEXITCODE" }

Invoke-Checked -Exe "git" -Arguments @("-C", $cloneRoot, "config", "lfs.concurrenttransfers", "1")
Invoke-Checked -Exe "git" -Arguments @("-C", $cloneRoot, "add", ".")
& git -C $cloneRoot diff --cached --quiet
if ($LASTEXITCODE -ne 0) {
  Invoke-Checked -Exe "git" -Arguments @("-C", $cloneRoot, "commit", "-m", "Deploy Python probe API")
  Invoke-Checked -Exe "git" -Arguments @("-C", $cloneRoot, "push", "origin", "main")
}

Write-Host "[mindvis-api] done: https://pixedar-mindvisualizer-api.hf.space"
