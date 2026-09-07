$ErrorActionPreference = "Stop"
& node (Join-Path $PSScriptRoot "workspace.mjs") setup @args
exit $LASTEXITCODE
