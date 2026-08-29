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
SRC="$REPO_DIR/presets/warm-minimal"
DEST="$DSH_HOME_DIR/.agent-presets/warm-minimal"

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
if [ ! -f "$PATCH" ]; then
  echo "setup: package-owned Harness patch not found: $PATCH" >&2
  exit 1
fi
if [ ! -f "$SRC/agent.cordis.yml" ]; then
  echo "setup: preset source not found: $SRC" >&2
  exit 1
fi

case "$DEST" in
  *".agent-presets"*) ;;
  *)
    echo "setup: refusing to install outside an .agent-presets directory: $DEST" >&2
    exit 1
    ;;
esac

if [ -e "$DEST" ] && [ ! -f "$DEST/.dsh-warm-minimal-owned" ] && [ "${DSH_WARM_ADOPT_PRESET:-0}" != "1" ]; then
  echo "setup: refusing to replace an unowned preset: $DEST" >&2
  echo "set DSH_WARM_ADOPT_PRESET=1 only after verifying it belongs to this package" >&2
  exit 1
fi
if [ -f "$DEST/.dsh-warm-minimal-owned" ] && ! diff -qr "$SRC" "$DEST" >/dev/null \
  && [ "${DSH_WARM_REPLACE_DRIFTED_PRESET:-0}" != "1" ]; then
  echo "setup: package-owned preset has drifted; refusing to overwrite later edits: $DEST" >&2
  echo "set DSH_WARM_REPLACE_DRIFTED_PRESET=1 only after reviewing the diff" >&2
  exit 1
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
