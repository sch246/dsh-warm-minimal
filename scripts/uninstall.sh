#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DSH_HOME_DIR="${DSH_HOME:-$HOME/.dsh}"
PROFILE="${DSH_PROFILE:-web}"
DSH_REPO_DIR="${DSH_REPO:?set DSH_REPO to the DeepSeek Harness checkout}"
SRC="$REPO_DIR/presets/warm-minimal"
DEST="$DSH_HOME_DIR/.agent-presets/warm-minimal"

if [ ! -f "$DEST/.dsh-warm-minimal-owned" ]; then
  echo "refusing to remove an unowned preset: $DEST" >&2
  exit 1
fi
if ! diff -qr "$SRC" "$DEST" >/dev/null; then
  echo "package-owned preset has drifted; refusing to remove later edits: $DEST" >&2
  exit 1
fi
node "$REPO_DIR/scripts/host-patch.mjs" status --repo "$DSH_REPO_DIR" | grep -q '^installed:'

if command -v dsh >/dev/null 2>&1; then
  dsh plugin --profile "$PROFILE" remove dsh-warm-minimal
else
  echo "dsh CLI not found; refusing a partial uninstall" >&2
  exit 1
fi

node "$REPO_DIR/scripts/host-patch.mjs" uninstall --repo "$DSH_REPO_DIR"
rm -rf "$DEST"
echo "dsh-warm-minimal uninstalled; rebuild and restart dsh web"
