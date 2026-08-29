# Apply the package-owned Harness patch, install the warm-minimal preset, and
# register this package as a bundle when the dsh CLI is available.
#
# Honors DSH_CHECKOUT, DSH_HOME, and DSH_PROFILE. The Harness checkout defaults
# to /root/deepseek-harness; set DSH_CHECKOUT on other hosts.
$ErrorActionPreference = "Stop"

$RepoDir = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$DshHome = if ($env:DSH_HOME) { $env:DSH_HOME } else { Join-Path $env:USERPROFILE ".dsh" }
$Profile = if ($env:DSH_PROFILE) { $env:DSH_PROFILE } else { "web" }
$CheckoutInput = if ($env:DSH_CHECKOUT) { $env:DSH_CHECKOUT } else { "/root/deepseek-harness" }
$Patch = Join-Path $RepoDir "patches\deepseek-harness.patch"
$Src = Join-Path $RepoDir "presets\warm-minimal"
$Dest = Join-Path $DshHome ".agent-presets\warm-minimal"

$Checkout = (& git -C $CheckoutInput rev-parse --show-toplevel 2>$null)
if ($LASTEXITCODE -ne 0 -or -not $Checkout) {
    throw "setup: DSH_CHECKOUT is not a Git repository: $CheckoutInput; set DSH_CHECKOUT to the DeepSeek Harness repository root"
}
$Checkout = $Checkout.Trim()
$HarnessPackage = Join-Path $Checkout "package.json"
if (-not (Test-Path $HarnessPackage) -or -not (Select-String -Quiet -SimpleMatch '"name": "@deepseek-ai/dsh-root"' $HarnessPackage)) {
    throw "setup: DSH_CHECKOUT is not a DeepSeek Harness repository: $Checkout"
}
if (-not (Test-Path $Patch)) {
    throw "setup: package-owned Harness patch not found: $Patch"
}
if (-not (Test-Path (Join-Path $Src "agent.cordis.yml"))) {
    throw "setup: preset source not found: $Src"
}
if ($Dest -notlike "*.agent-presets*") {
    throw "setup: refusing to install outside an .agent-presets directory: $Dest"
}

if ((Test-Path $Dest) -and -not (Test-Path (Join-Path $Dest ".dsh-warm-minimal-owned")) -and $env:DSH_WARM_ADOPT_PRESET -ne "1") {
    throw "setup: refusing to replace an unowned preset: $Dest; set DSH_WARM_ADOPT_PRESET=1 only after verification"
}
if ((Test-Path (Join-Path $Dest ".dsh-warm-minimal-owned")) -and $env:DSH_WARM_REPLACE_DRIFTED_PRESET -ne "1") {
    & git diff --no-index --quiet -- $Src $Dest
    if ($LASTEXITCODE -ne 0) {
        throw "setup: package-owned preset has drifted; refusing to overwrite later edits: $Dest; set DSH_WARM_REPLACE_DRIFTED_PRESET=1 only after reviewing the diff"
    }
}

& git -C $Checkout apply --check --reverse $Patch 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "setup: exact package-owned Harness patch already present"
} else {
    & git -C $Checkout apply --check $Patch 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "setup: Harness source differs from both the unpatched and exact patched states: $Checkout; review the package-owned regions or select a compatible checkout with DSH_CHECKOUT"
    }
    & git -C $Checkout apply $Patch
    if ($LASTEXITCODE -ne 0) { throw "setup: failed to apply package-owned Harness patch: $Patch" }
    Write-Host "setup: applied package-owned Harness patch -> $Checkout"
}

# Package-owned upgrades replace only the marked preset directory.
New-Item -ItemType Directory -Force -Path (Split-Path -Parent $Dest) | Out-Null
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
Write-Host "No dependencies, artifacts, or services were changed automatically."
Write-Host "Build and restart dsh web when appropriate, then pick the warm-minimal preset in the preset picker."
