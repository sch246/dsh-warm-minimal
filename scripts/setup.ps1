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
$OwnerMarker = ".dsh-warm-minimal-owned"
$CurrentOwner = "dsh-warm-minimal@0.2.0"
$LegacyOwner = "dsh-warm-minimal@0.1.0"
$LegacyAgentSha256 = "c952e72ff87cb09e6d2700dcf806c6584a67cf867adcd103ec822a6c538d4f87"
$LegacyPresetSha256 = "745b32e24aeb8d7c0f51ed729c82238addcae703eed76d7790fd745f9e323909"

function Get-PresetOwner([string]$Path) {
    $Lines = @(Get-Content -LiteralPath $Path)
    if ($Lines.Count -ne 1) { return $null }
    return $Lines[0]
}

function Test-PlainFile([string]$Path) {
    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { return $false }
    $Attributes = (Get-Item -Force -LiteralPath $Path).Attributes
    return ($Attributes -band [System.IO.FileAttributes]::ReparsePoint) -eq 0
}

function Test-ExactLegacyPreset([string]$Path) {
    $ExpectedEntries = @($OwnerMarker, "agent.cordis.yml", "preset.yml") | Sort-Object
    $ActualEntries = @((Get-ChildItem -Force -LiteralPath $Path).Name | Sort-Object)
    if (@(Compare-Object -ReferenceObject $ExpectedEntries -DifferenceObject $ActualEntries).Count -ne 0) { return $false }

    $AgentPath = Join-Path $Path "agent.cordis.yml"
    $PresetPath = Join-Path $Path "preset.yml"
    if (-not (Test-PlainFile $AgentPath) -or -not (Test-PlainFile $PresetPath)) {
        return $false
    }
    $AgentHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $AgentPath).Hash.ToLowerInvariant()
    $PresetHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $PresetPath).Hash.ToLowerInvariant()
    return $AgentHash -ceq $LegacyAgentSha256 -and $PresetHash -ceq $LegacyPresetSha256
}

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
if (-not (Test-Path (Join-Path $Src "agent.cordis.yml")) -or -not (Test-Path (Join-Path $Src "preset.yml")) -or -not (Test-Path (Join-Path $Src $OwnerMarker))) {
    throw "setup: preset source not found: $Src"
}
$SourceOwner = Get-PresetOwner (Join-Path $Src $OwnerMarker)
if ($SourceOwner -cne $CurrentOwner) {
    throw "setup: preset source ownership marker is not ${CurrentOwner}: $(Join-Path $Src $OwnerMarker)"
}
if ($Dest -notlike "*.agent-presets*") {
    throw "setup: refusing to install outside an .agent-presets directory: $Dest"
}

if (Test-Path $Dest) {
    $InstalledMarker = Join-Path $Dest $OwnerMarker
    if (-not (Test-PlainFile $InstalledMarker)) {
        if ($env:DSH_WARM_ADOPT_PRESET -ne "1") {
            throw "setup: refusing to replace an unowned preset: $Dest; set DSH_WARM_ADOPT_PRESET=1 only after verification"
        }
    } else {
        $InstalledOwner = Get-PresetOwner $InstalledMarker
        switch -CaseSensitive ($InstalledOwner) {
            $CurrentOwner {
                if ($env:DSH_WARM_REPLACE_DRIFTED_PRESET -ne "1") {
                    & git diff --no-index --quiet -- $Src $Dest
                    if ($LASTEXITCODE -ne 0) {
                        throw "setup: package-owned preset has drifted; refusing to overwrite later edits: $Dest; set DSH_WARM_REPLACE_DRIFTED_PRESET=1 only after reviewing the diff"
                    }
                }
            }
            $LegacyOwner {
                if (Test-ExactLegacyPreset $Dest) {
                    Write-Host "setup: upgrading exact package-owned preset from $LegacyOwner to $CurrentOwner"
                } elseif ($env:DSH_WARM_REPLACE_DRIFTED_PRESET -ne "1") {
                    throw "setup: legacy package-owned preset has drifted; refusing to overwrite later edits: $Dest; set DSH_WARM_REPLACE_DRIFTED_PRESET=1 only after reviewing the diff"
                }
            }
            default {
                throw "setup: refusing preset with unknown owner '$InstalledOwner': $Dest"
            }
        }
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
