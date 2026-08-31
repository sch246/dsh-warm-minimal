#!/usr/bin/env bash
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

read_owner_marker() {
  local marker="$1"
  local line_count owner
  line_count="$(awk 'END { print NR }' "$marker")"
  [ "$line_count" = "1" ] || return 1
  IFS= read -r owner < "$marker" || [ -n "$owner" ]
  owner="${owner%$'\r'}"
  printf '%s' "$owner"
}

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
ACTUAL_REVISION="$(git -C "$CHECKOUT" rev-parse HEAD)"
if [ "$ACTUAL_REVISION" != "$TARGET_REVISION" ]; then
  echo "uninstall: unsupported DeepSeek Harness revision: $ACTUAL_REVISION" >&2
  echo "uninstall: this package targets dsh-v0.1.2-alpha.2 at $TARGET_REVISION" >&2
  exit 1
fi
if [ ! -f "$PATCH" ]; then
  echo "uninstall: package-owned Harness patch not found: $PATCH" >&2
  exit 1
fi
if [ ! -f "$SRC/agent.cordis.yml" ] || [ ! -f "$SRC/preset.yml" ] || [ ! -f "$SRC/$OWNER_MARKER" ]; then
  echo "uninstall: preset source not found: $SRC" >&2
  exit 1
fi
if ! SOURCE_OWNER="$(read_owner_marker "$SRC/$OWNER_MARKER")" || [ "$SOURCE_OWNER" != "$CURRENT_OWNER" ]; then
  echo "uninstall: preset source ownership marker is not $CURRENT_OWNER: $SRC/$OWNER_MARKER" >&2
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

if [ ! -f "$DEST/$OWNER_MARKER" ] || [ -L "$DEST/$OWNER_MARKER" ]; then
  echo "uninstall: refusing to remove an unowned preset: $DEST" >&2
  exit 1
fi
if ! INSTALLED_OWNER="$(read_owner_marker "$DEST/$OWNER_MARKER")" \
  || [ "$INSTALLED_OWNER" != "$CURRENT_OWNER" ]; then
  echo "uninstall: refusing to remove a preset not owned by $CURRENT_OWNER: $DEST" >&2
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
