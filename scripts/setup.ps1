# Install the warm-minimal preset into the harness-home user preset root and,
# when the dsh CLI is available, register this package as a bundle in the web
# profile.
#
# Honors DSH_HOME and DSH_PROFILE; defaults are $env:USERPROFILE\.dsh and web.
$ErrorActionPreference = "Stop"

$RepoDir = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$DshHome = if ($env:DSH_HOME) { $env:DSH_HOME } else { Join-Path $env:USERPROFILE ".dsh" }
$Profile = if ($env:DSH_PROFILE) { $env:DSH_PROFILE } else { "web" }
$Src = Join-Path $RepoDir "presets\warm-minimal"
$Dest = Join-Path $DshHome ".agent-presets\warm-minimal"

if (-not (Test-Path (Join-Path $Src "agent.cordis.yml"))) {
    throw "preset source not found: $Src"
}
if ($Dest -notlike "*.agent-presets*") {
    throw "refusing to install outside an .agent-presets directory: $Dest"
}

New-Item -ItemType Directory -Force -Path (Split-Path -Parent $Dest) | Out-Null
# Upgrades replace the preset directory wholesale; user edits should live in a
# copied preset, not here.
Remove-Item -Recurse -Force $Dest -ErrorAction SilentlyContinue
Copy-Item -Recurse -Force $Src $Dest
Write-Host "preset installed -> $Dest"

$Dsh = Get-Command dsh -ErrorAction SilentlyContinue
if ($Dsh) {
    Write-Host "registering bundle into profile '$Profile'..."
    Push-Location $RepoDir
    try {
        dsh plugin --profile $Profile add .
    } finally {
        Pop-Location
    }
} else {
    Write-Host "dsh CLI not found; register the bundle manually from this repo:"
    Write-Host "  dsh plugin --profile $Profile add ."
}

Write-Host ""
Write-Host "Restart dsh web, then pick the warm-minimal preset in the preset picker."
