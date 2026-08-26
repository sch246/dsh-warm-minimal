$ErrorActionPreference = "Stop"

$RepoDir = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$DshHome = if ($env:DSH_HOME) { $env:DSH_HOME } else { Join-Path $env:USERPROFILE ".dsh" }
$Profile = if ($env:DSH_PROFILE) { $env:DSH_PROFILE } else { "web" }
$Src = Join-Path $RepoDir "presets\warm-minimal"
$Dest = Join-Path $DshHome ".agent-presets\warm-minimal"

if (-not (Test-Path (Join-Path $Dest ".dsh-warm-minimal-owned"))) {
    throw "refusing to remove an unowned preset: $Dest"
}
$Diff = & git diff --no-index --quiet -- $Src $Dest
if ($LASTEXITCODE -ne 0) { throw "package-owned preset has drifted; refusing to remove later edits: $Dest" }

if (-not (Get-Command dsh -ErrorAction SilentlyContinue)) { throw "dsh CLI not found; refusing a partial uninstall" }

dsh plugin --profile $Profile remove dsh-warm-minimal
Remove-Item -Recurse -Force $Dest
Write-Host "dsh-warm-minimal uninstalled; restart dsh web"
