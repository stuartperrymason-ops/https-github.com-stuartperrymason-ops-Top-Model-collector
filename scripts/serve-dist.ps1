param(
    [int]$Port = 5000,
    [switch]$ForceBuild
)

# Serve the production build (dist) locally. If dist does not exist or --ForceBuild is specified, build first.
Write-Host "serve-dist.ps1 starting..."
$cwd = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $cwd

if ($ForceBuild.IsPresent) {
    Write-Host "--ForceBuild specified: running build..."
    npm run build
    if ($LASTEXITCODE -ne 0) { Write-Error "Build failed. Exiting."; exit $LASTEXITCODE }
}

if (-not (Test-Path -Path "./dist")) {
    Write-Host "Production build (./dist) not found. Running npm run build..."
    npm run build
    if ($LASTEXITCODE -ne 0) { Write-Error "Build failed. Exiting."; exit $LASTEXITCODE }
}

Write-Host "Serving ./dist on http://localhost:$Port"
Write-Host "Use Ctrl+C to stop the server."

# Use the project's http-server dependency (installed) via npx for portability
& npx http-server dist -p $Port
<#
Serves the production `dist` folder locally using `npx serve`.

Usage:
  # serve on default port 5000 (builds if dist missing)
  .\scripts\serve-dist.ps1

  # serve on a custom port and force rebuild
  .\scripts\serve-dist.ps1 -Port 8080 -Build

This script is PowerShell-friendly and intended to be run from the project root.
#>

param(
    [int]$Port = 5000,
    [switch]$Build
)

try {
    $repoRoot = Split-Path -Parent $PSScriptRoot
    if (-not $repoRoot) { $repoRoot = Get-Location }
    Set-Location $repoRoot

    if ($Build.IsPresent -or -not (Test-Path -Path "dist")) {
        Write-Host "Building production bundle..." -ForegroundColor Cyan
        npm run build
        if ($LASTEXITCODE -ne 0) {
            throw "Build failed (exit code $LASTEXITCODE). Aborting serve."
        }
    }

    Write-Host "Serving 'dist' on http://localhost:$Port" -ForegroundColor Green
    Write-Host "Press Ctrl+C to stop." -ForegroundColor Yellow

    # Use npx so the environment's package manager resolves 'serve'
    & npx serve -s dist -l $Port
} catch {
    Write-Error "Error: $_"
    exit 1
}
