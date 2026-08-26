#!/usr/bin/env bash
# Install the warm-minimal preset into the harness-home user preset root and,
# when the dsh CLI is available, register this package as a bundle in the web
# profile.
#
# Honors DSH_HOME and DSH_PROFILE; defaults are ~/.dsh and web.
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DSH_HOME_DIR="${DSH_HOME:-$HOME/.dsh}"
PROFILE="${DSH_PROFILE:-web}"
SRC="$REPO_DIR/presets/warm-minimal"
DEST="$DSH_HOME_DIR/.agent-presets/warm-minimal"

if [ ! -f "$SRC/agent.cordis.yml" ]; then
  echo "preset source not found: $SRC" >&2
  exit 1
fi

case "$DEST" in
  *".agent-presets"*) ;;
  *)
    echo "refusing to install outside an .agent-presets directory: $DEST" >&2
    exit 1
    ;;
esac

mkdir -p "$(dirname "$DEST")"
if [ -e "$DEST" ] && [ ! -f "$DEST/.dsh-warm-minimal-owned" ] && [ "${DSH_WARM_ADOPT_PRESET:-0}" != "1" ]; then
  echo "refusing to replace an unowned preset: $DEST" >&2
  echo "set DSH_WARM_ADOPT_PRESET=1 only after verifying it belongs to this package" >&2
  exit 1
fi
if [ -f "$DEST/.dsh-warm-minimal-owned" ] && ! diff -qr "$SRC" "$DEST" >/dev/null \
  && [ "${DSH_WARM_REPLACE_DRIFTED_PRESET:-0}" != "1" ]; then
  echo "package-owned preset has drifted; refusing to overwrite later edits: $DEST" >&2
  echo "set DSH_WARM_REPLACE_DRIFTED_PRESET=1 only after reviewing the diff" >&2
  exit 1
fi

# Package-owned upgrades replace only the marked preset directory.
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
echo "Restart dsh web, then pick '温暖极简模式' in the preset picker."
