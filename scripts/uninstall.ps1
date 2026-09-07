$ErrorActionPreference = "Stop"
& node (Join-Path $PSScriptRoot "workspace.mjs") remove @args
exit $LASTEXITCODE
