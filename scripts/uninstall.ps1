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
    throw "uninstall: DSH_CHECKOUT is not a Git repository: $CheckoutInput; set DSH_CHECKOUT to the DeepSeek Harness repository root"
}
$Checkout = $Checkout.Trim()
$HarnessPackage = Join-Path $Checkout "package.json"
if (-not (Test-Path $HarnessPackage) -or -not (Select-String -Quiet -SimpleMatch '"name": "@deepseek-ai/dsh-root"' $HarnessPackage)) {
    throw "uninstall: DSH_CHECKOUT is not a DeepSeek Harness repository: $Checkout"
}
if (-not (Test-Path $Patch)) {
    throw "uninstall: package-owned Harness patch not found: $Patch"
}

$PatchPresent = $false
& git -C $Checkout apply --check --reverse $Patch 2>$null
if ($LASTEXITCODE -eq 0) {
    $PatchPresent = $true
} else {
    & git -C $Checkout apply --check $Patch 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "uninstall: package-owned Harness patch is not present; skipping source removal"
    } else {
        throw "uninstall: package-owned Harness regions have drifted; refusing a partial uninstall"
    }
}

if (-not (Test-Path (Join-Path $Dest ".dsh-warm-minimal-owned"))) {
    throw "uninstall: refusing to remove an unowned preset: $Dest"
}
$Diff = & git diff --no-index --quiet -- $Src $Dest
if ($LASTEXITCODE -ne 0) { throw "uninstall: package-owned preset has drifted; refusing to remove later edits: $Dest" }

if (-not (Get-Command dsh -ErrorAction SilentlyContinue)) { throw "dsh CLI not found; refusing a partial uninstall" }

dsh plugin --profile $Profile remove dsh-warm-minimal
if ($LASTEXITCODE -ne 0) { throw "uninstall: dsh failed to remove the bundle from profile $Profile" }
if ($PatchPresent) {
    & git -C $Checkout apply --reverse $Patch
    if ($LASTEXITCODE -ne 0) { throw "uninstall: failed to remove the exact package-owned Harness patch" }
    Write-Host "uninstall: removed exact package-owned Harness patch"
}
Remove-Item -Recurse -Force $Dest
Write-Host "dsh-warm-minimal uninstalled; no build or service restart was performed"
