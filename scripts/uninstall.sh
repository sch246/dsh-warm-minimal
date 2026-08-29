#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DSH_HOME_DIR="${DSH_HOME:-$HOME/.dsh}"
PROFILE="${DSH_PROFILE:-web}"
CHECKOUT_INPUT="${DSH_CHECKOUT:-/root/deepseek-harness}"
PATCH="$REPO_DIR/patches/deepseek-harness.patch"
SRC="$REPO_DIR/presets/warm-minimal"
DEST="$DSH_HOME_DIR/.agent-presets/warm-minimal"

if ! CHECKOUT="$(git -C "$CHECKOUT_INPUT" rev-parse --show-toplevel 2>/dev/null)"; then
  echo "uninstall: DSH_CHECKOUT is not a Git repository: $CHECKOUT_INPUT" >&2
  echo "set DSH_CHECKOUT to the DeepSeek Harness repository root" >&2
  exit 1
fi
if [ ! -f "$CHECKOUT/package.json" ] \
  || ! grep -Fq '"name": "@deepseek-ai/dsh-root"' "$CHECKOUT/package.json"; then
  echo "uninstall: DSH_CHECKOUT is not a DeepSeek Harness repository: $CHECKOUT" >&2
  exit 1
fi
if [ ! -f "$PATCH" ]; then
  echo "uninstall: package-owned Harness patch not found: $PATCH" >&2
  exit 1
fi

PATCH_PRESENT=false
if git -C "$CHECKOUT" apply --check --reverse "$PATCH" >/dev/null 2>&1; then
  PATCH_PRESENT=true
elif git -C "$CHECKOUT" apply --check "$PATCH" >/dev/null 2>&1; then
  echo "uninstall: package-owned Harness patch is not present; skipping source removal"
else
  echo "uninstall: package-owned Harness regions have drifted; refusing a partial uninstall" >&2
  exit 1
fi

if [ ! -f "$DEST/.dsh-warm-minimal-owned" ]; then
  echo "uninstall: refusing to remove an unowned preset: $DEST" >&2
  exit 1
fi
if ! diff -qr "$SRC" "$DEST" >/dev/null; then
  echo "uninstall: package-owned preset has drifted; refusing to remove later edits: $DEST" >&2
  exit 1
fi
if command -v dsh >/dev/null 2>&1; then
  dsh plugin --profile "$PROFILE" remove dsh-warm-minimal
else
  echo "dsh CLI not found; refusing a partial uninstall" >&2
  exit 1
fi

if [ "$PATCH_PRESENT" = true ]; then
  git -C "$CHECKOUT" apply --reverse "$PATCH"
  echo "uninstall: removed exact package-owned Harness patch"
fi
rm -rf "$DEST"
echo "dsh-warm-minimal uninstalled; no build or service restart was performed"
