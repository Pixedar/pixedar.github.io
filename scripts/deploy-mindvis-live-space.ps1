$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$sourceRoot = Resolve-Path "C:\Users\assas\PycharmProjects\mindVisualizer"
$stageRoot = Join-Path ([System.IO.Path]::GetTempPath()) "mindvis-live-space"
$cloneRoot = Join-Path ([System.IO.Path]::GetTempPath()) "mindvisualizer-live-hf-repo"
$spaceId = "Pixedar/mindvisualizer-vtk"
$spaceName = "mindvisualizer-vtk"

function Assert-InTemp {
  param([Parameter(Mandatory = $true)][string] $Path)
  $resolvedPath = Resolve-Path -LiteralPath $Path -ErrorAction SilentlyContinue
  if (-not $resolvedPath) {
    return
  }
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

function Set-HfCertificate {
  $cert = python -c "import certifi; print(certifi.where())"
  if ($LASTEXITCODE -eq 0 -and $cert -and (Test-Path -LiteralPath $cert)) {
    $env:SSL_CERT_FILE = $cert
    $env:REQUESTS_CA_BUNDLE = $cert
  }
}

function Invoke-Checked {
  param(
    [Parameter(Mandatory = $true)][string] $Exe,
    [Parameter(Mandatory = $true)][string[]] $Arguments
  )
  & $Exe @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "$Exe $($Arguments -join ' ') failed with exit code $LASTEXITCODE"
  }
}

function Test-SpaceExists {
  try {
    & hf spaces info $spaceId 1>$null 2>$null
  } catch {
    return $false
  }
  return $LASTEXITCODE -eq 0
}

Write-Host "[mindvis-live] staging Python/VTK app from $sourceRoot"
Reset-Directory -Path $stageRoot

$excludeDirs = @(
  ".git",
  ".idea",
  ".venv",
  "assets",
  "__pycache__",
  ".mypy_cache",
  ".pytest_cache",
  "meshes"
)

$excludeFiles = @(
  ".env",
  "*.pyc",
  "*.pyo",
  "debug_*.py",
  "gifC.gif",
  "OBSERVATIONS.md"
)

$robocopyArgs = @(
  $sourceRoot.Path,
  $stageRoot,
  "/MIR",
  "/XD"
) + $excludeDirs + @(
  "/XF"
) + $excludeFiles + @(
  "/R:2",
  "/W:2",
  "/NFL",
  "/NDL",
  "/NJH",
  "/NJS",
  "/NP"
)

& robocopy @robocopyArgs | Out-Host
if ($LASTEXITCODE -gt 7) {
  throw "robocopy failed with exit code $LASTEXITCODE"
}

Copy-Item -LiteralPath (Join-Path $repoRoot "backend\mindvis-live\Dockerfile") -Destination (Join-Path $stageRoot "Dockerfile") -Force
Copy-Item -LiteralPath (Join-Path $repoRoot "backend\mindvis-live\start.sh") -Destination (Join-Path $stageRoot "start.sh") -Force
Copy-Item -LiteralPath (Join-Path $repoRoot "backend\mindvis-live\app.py") -Destination (Join-Path $stageRoot "app.py") -Force

Remove-Item -LiteralPath (Join-Path $stageRoot ".gitignore") -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath (Join-Path $stageRoot "data\meshes") -Recurse -Force -ErrorAction SilentlyContinue

@"
__pycache__/
*.pyc
*.pyo
.env
"@ | Set-Content -LiteralPath (Join-Path $stageRoot ".gitignore") -Encoding ascii

@"
.git
.idea
.venv
__pycache__
*.pyc
*.pyo
.env
data/meshes
"@ | Set-Content -LiteralPath (Join-Path $stageRoot ".dockerignore") -Encoding ascii

New-Item -ItemType Directory -Path (Join-Path $stageRoot "data\meshes") -Force | Out-Null
"placeholder so code paths that check data/meshes exist keep working; actual OBJ meshes are in data/meshes_obj." |
  Set-Content -LiteralPath (Join-Path $stageRoot "data\meshes\.keep") -Encoding ascii

@"
---
title: MindVisualizer Live
colorFrom: green
colorTo: blue
sdk: docker
pinned: false
---

# MindVisualizer Live

Runs the Python/VTK MindVisualizer runtime through a Trame web transport.
"@ | Set-Content -LiteralPath (Join-Path $stageRoot "README.md") -Encoding utf8

$payloadBytes = (Get-ChildItem -LiteralPath $stageRoot -Recurse -File | Measure-Object -Property Length -Sum).Sum
$payloadMb = [Math]::Round($payloadBytes / 1MB, 2)
Write-Host "[mindvis-live] staged payload: $payloadMb MB"

Set-HfCertificate

if (-not (Test-SpaceExists)) {
  Write-Host "[mindvis-live] creating HF Space: $spaceId"
  Invoke-Checked -Exe "huggingface-cli" -Arguments @("repo", "create", $spaceName, "--type", "space", "--space_sdk", "docker", "-y")
}

$secretFile = Join-Path $sourceRoot.Path ".env"
if (Test-Path -LiteralPath $secretFile) {
  Write-Host "[mindvis-live] setting OPENAI_API_KEY as a Space secret"
  $secretScript = @"
from pathlib import Path
from huggingface_hub import HfApi

values = {}
for line in Path(r"$secretFile").read_text(encoding="utf-8").splitlines():
    line = line.strip()
    if not line or line.startswith("#") or "=" not in line:
        continue
    key, value = line.split("=", 1)
    values[key.strip()] = value.strip().strip('"').strip("'")

api_key = values.get("OPENAI_API_KEY")
if api_key:
    HfApi().add_space_secret(repo_id="$spaceId", key="OPENAI_API_KEY", value=api_key)
"@
  $secretScript | python -
  if ($LASTEXITCODE -ne 0) {
    throw "failed to set HF Space secret"
  }
}

Write-Host "[mindvis-live] cloning Space repo for Git LFS push"
Reset-Directory -Path $cloneRoot
Remove-Item -LiteralPath $cloneRoot -Recurse -Force
Invoke-Checked -Exe "git" -Arguments @("clone", "https://huggingface.co/spaces/$spaceId", $cloneRoot)

Get-ChildItem -LiteralPath $cloneRoot -Force |
  Where-Object { $_.Name -ne ".git" } |
  Remove-Item -Recurse -Force

& robocopy $stageRoot $cloneRoot /E /R:2 /W:2 /NFL /NDL /NJH /NJS /NP | Out-Host
if ($LASTEXITCODE -gt 7) {
  throw "robocopy to clone failed with exit code $LASTEXITCODE"
}

Invoke-Checked -Exe "git" -Arguments @("-C", $cloneRoot, "lfs", "install")
Invoke-Checked -Exe "git" -Arguments @("-C", $cloneRoot, "lfs", "track", "*.obj")
Invoke-Checked -Exe "git" -Arguments @("-C", $cloneRoot, "lfs", "track", "*.bin")
Invoke-Checked -Exe "git" -Arguments @("-C", $cloneRoot, "lfs", "track", "*.npy")
Invoke-Checked -Exe "git" -Arguments @("-C", $cloneRoot, "lfs", "track", "*.npz")
Invoke-Checked -Exe "git" -Arguments @("-C", $cloneRoot, "lfs", "track", "*.gz")
Invoke-Checked -Exe "git" -Arguments @("-C", $cloneRoot, "lfs", "track", "*.ply")
Invoke-Checked -Exe "git" -Arguments @("-C", $cloneRoot, "config", "lfs.concurrenttransfers", "1")
Invoke-Checked -Exe "git" -Arguments @("-C", $cloneRoot, "config", "lfs.basictransfersonly", "true")
Invoke-Checked -Exe "git" -Arguments @("-C", $cloneRoot, "config", "http.version", "HTTP/1.1")
Invoke-Checked -Exe "git" -Arguments @("-C", $cloneRoot, "add", ".")

& git -C $cloneRoot diff --cached --quiet
if ($LASTEXITCODE -eq 0) {
  Write-Host "[mindvis-live] no changes to push"
} else {
  Invoke-Checked -Exe "git" -Arguments @("-C", $cloneRoot, "commit", "-m", "Deploy MindVisualizer live runtime")
  Invoke-Checked -Exe "git" -Arguments @("-C", $cloneRoot, "push", "origin", "main")
}

Write-Host "[mindvis-live] done: https://huggingface.co/spaces/$spaceId"
Write-Host "[mindvis-live] app URL: https://pixedar-mindvisualizer-vtk.hf.space/"
