#!/usr/bin/env bash
# Apply the package-owned Harness patch, install the warm-minimal preset, and
# register this package as a bundle when the dsh CLI is available.
#
# Honors DSH_CHECKOUT, DSH_HOME, and DSH_PROFILE. The Harness checkout defaults
# to /root/deepseek-harness; set DSH_CHECKOUT on other hosts.
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DSH_HOME_DIR="${DSH_HOME:-$HOME/.dsh}"
PROFILE="${DSH_PROFILE:-web}"
CHECKOUT_INPUT="${DSH_CHECKOUT:-/root/deepseek-harness}"
PATCH="$REPO_DIR/patches/deepseek-harness.patch"
TARGET_REVISION="0a53fb55bea101816fa226bb964ae2bed71c343b"
SRC="$REPO_DIR/presets/warm-minimal"
DEST="$DSH_HOME_DIR/.agent-presets/warm-minimal"
OWNER_MARKER=".dsh-warm-minimal-owned"
CURRENT_OWNER="dsh-warm-minimal@0.2.0"
LEGACY_OWNER="dsh-warm-minimal@0.1.0"
LEGACY_AGENT_SHA256="c952e72ff87cb09e6d2700dcf806c6584a67cf867adcd103ec822a6c538d4f87"
LEGACY_PRESET_SHA256="745b32e24aeb8d7c0f51ed729c82238addcae703eed76d7790fd745f9e323909"

read_owner_marker() {
  local marker="$1"
  local line_count owner
  line_count="$(awk 'END { print NR }' "$marker")"
  [ "$line_count" = "1" ] || return 1
  IFS= read -r owner < "$marker" || [ -n "$owner" ]
  owner="${owner%$'\r'}"
  printf '%s' "$owner"
}

sha256_file() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | awk '{ print $1 }'
  elif command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "$1" | awk '{ print $1 }'
  else
    echo "setup: SHA-256 tool not found; cannot verify a legacy preset" >&2
    return 1
  fi
}

is_exact_legacy_preset() {
  local actual_entries agent_hash preset_hash
  actual_entries="$(find "$DEST" -mindepth 1 -maxdepth 1 -exec basename {} \; | LC_ALL=C sort)"
  [ "$actual_entries" = ".dsh-warm-minimal-owned
agent.cordis.yml
preset.yml" ] || return 1
  [ -f "$DEST/agent.cordis.yml" ] && [ ! -L "$DEST/agent.cordis.yml" ] || return 1
  [ -f "$DEST/preset.yml" ] && [ ! -L "$DEST/preset.yml" ] || return 1
  agent_hash="$(sha256_file "$DEST/agent.cordis.yml")" || return 1
  preset_hash="$(sha256_file "$DEST/preset.yml")" || return 1
  [ "$agent_hash" = "$LEGACY_AGENT_SHA256" ] && [ "$preset_hash" = "$LEGACY_PRESET_SHA256" ]
}

if ! CHECKOUT="$(git -C "$CHECKOUT_INPUT" rev-parse --show-toplevel 2>/dev/null)"; then
  echo "setup: DSH_CHECKOUT is not a Git repository: $CHECKOUT_INPUT" >&2
  echo "set DSH_CHECKOUT to the DeepSeek Harness repository root" >&2
  exit 1
fi
if [ ! -f "$CHECKOUT/package.json" ] \
  || ! grep -Fq '"name": "@deepseek-ai/dsh-root"' "$CHECKOUT/package.json"; then
  echo "setup: DSH_CHECKOUT is not a DeepSeek Harness repository: $CHECKOUT" >&2
  exit 1
fi
ACTUAL_REVISION="$(git -C "$CHECKOUT" rev-parse HEAD)"
if [ "$ACTUAL_REVISION" != "$TARGET_REVISION" ]; then
  echo "setup: unsupported DeepSeek Harness revision: $ACTUAL_REVISION" >&2
  echo "setup: this package targets dsh-v0.1.2-alpha.2 at $TARGET_REVISION" >&2
  exit 1
fi
if [ ! -f "$PATCH" ]; then
  echo "setup: package-owned Harness patch not found: $PATCH" >&2
  exit 1
fi
if [ ! -f "$SRC/agent.cordis.yml" ] || [ ! -f "$SRC/preset.yml" ] || [ ! -f "$SRC/$OWNER_MARKER" ]; then
  echo "setup: preset source not found: $SRC" >&2
  exit 1
fi
if ! SOURCE_OWNER="$(read_owner_marker "$SRC/$OWNER_MARKER")" || [ "$SOURCE_OWNER" != "$CURRENT_OWNER" ]; then
  echo "setup: preset source ownership marker is not $CURRENT_OWNER: $SRC/$OWNER_MARKER" >&2
  exit 1
fi

case "$DEST" in
  *".agent-presets"*) ;;
  *)
    echo "setup: refusing to install outside an .agent-presets directory: $DEST" >&2
    exit 1
    ;;
esac

if [ -e "$DEST" ]; then
  if [ ! -f "$DEST/$OWNER_MARKER" ] || [ -L "$DEST/$OWNER_MARKER" ]; then
    if [ "${DSH_WARM_ADOPT_PRESET:-0}" != "1" ]; then
      echo "setup: refusing to replace an unowned preset: $DEST" >&2
      echo "set DSH_WARM_ADOPT_PRESET=1 only after verifying it belongs to this package" >&2
      exit 1
    fi
  elif ! INSTALLED_OWNER="$(read_owner_marker "$DEST/$OWNER_MARKER")"; then
    echo "setup: refusing preset with an unknown ownership marker: $DEST/$OWNER_MARKER" >&2
    exit 1
  else
    case "$INSTALLED_OWNER" in
      "$CURRENT_OWNER")
        if ! diff -qr "$SRC" "$DEST" >/dev/null \
          && [ "${DSH_WARM_REPLACE_DRIFTED_PRESET:-0}" != "1" ]; then
          echo "setup: package-owned preset has drifted; refusing to overwrite later edits: $DEST" >&2
          echo "set DSH_WARM_REPLACE_DRIFTED_PRESET=1 only after reviewing the diff" >&2
          exit 1
        fi
        ;;
      "$LEGACY_OWNER")
        if is_exact_legacy_preset; then
          echo "setup: upgrading exact package-owned preset from $LEGACY_OWNER to $CURRENT_OWNER"
        elif [ "${DSH_WARM_REPLACE_DRIFTED_PRESET:-0}" != "1" ]; then
          echo "setup: legacy package-owned preset has drifted; refusing to overwrite later edits: $DEST" >&2
          echo "set DSH_WARM_REPLACE_DRIFTED_PRESET=1 only after reviewing the diff" >&2
          exit 1
        fi
        ;;
      *)
        echo "setup: refusing preset with unknown owner '$INSTALLED_OWNER': $DEST" >&2
        exit 1
        ;;
    esac
  fi
fi

if git -C "$CHECKOUT" apply --check --reverse "$PATCH" >/dev/null 2>&1; then
  echo "setup: exact package-owned Harness patch already present"
elif git -C "$CHECKOUT" apply --check "$PATCH" >/dev/null 2>&1; then
  git -C "$CHECKOUT" apply "$PATCH"
  echo "setup: applied package-owned Harness patch -> $CHECKOUT"
else
  echo "setup: Harness source differs from both the unpatched and exact patched states: $CHECKOUT" >&2
  echo "review the package-owned regions or select a compatible checkout with DSH_CHECKOUT" >&2
  exit 1
fi

# Package-owned upgrades replace only the marked preset directory.
mkdir -p "$(dirname "$DEST")"
rm -rf "$DEST"
cp -R "$SRC" "$DEST"
echo "preset installed -> $DEST"

if command -v dsh >/dev/null 2>&1; then
  echo "registering bundle into profile '$PROFILE'..."
  (cd "$REPO_DIR" && dsh plugin --profile "$PROFILE" add .)
else
  echo "dsh CLI not found; register the bundle manually from this repo:"
  echo "  dsh plugin --profile $PROFILE add ."
fi

echo
echo "No dependencies, artifacts, or services were changed automatically."
echo "Build and restart dsh web when appropriate, then pick '温暖极简模式' in the preset picker."
