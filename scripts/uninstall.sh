#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DSH_HOME_DIR="${DSH_HOME:-$HOME/.dsh}"
PROFILE="${DSH_PROFILE:-web}"
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
if command -v dsh >/dev/null 2>&1; then
  dsh plugin --profile "$PROFILE" remove dsh-warm-minimal
else
  echo "dsh CLI not found; refusing a partial uninstall" >&2
  exit 1
fi

rm -rf "$DEST"
echo "dsh-warm-minimal uninstalled; restart dsh web"
