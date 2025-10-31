param(
    [Parameter(Position=0)]
    [int]$Port = 5000,
    [switch]$ForceBuild
)

try {
    Write-Host "serve-dist.ps1 starting..."
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
    if ($scriptDir) { Set-Location $scriptDir }

    # If requested or dist missing, run build
    if ($ForceBuild.IsPresent -or -not (Test-Path -Path "dist")) {
        Write-Host "Building production bundle..." -ForegroundColor Cyan
        npm run build
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Build failed (exit code $LASTEXITCODE). Aborting serve."
            exit $LASTEXITCODE
        }
    }

    Write-Host "Serving 'dist' on http://localhost:$Port" -ForegroundColor Green
    Write-Host "Press Ctrl+C to stop." -ForegroundColor Yellow

    # Run the bundled Node static server to avoid external npx dependency
    $nodeScript = Join-Path $scriptDir 'serve-dist-node.js'
    if (-not (Test-Path $nodeScript)) {
        Write-Error "Node serve script not found: $nodeScript"
        exit 1
    }
    & node $nodeScript $Port

} catch {
    Write-Error "Error: $_"
    exit 1
}
