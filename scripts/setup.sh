#!/usr/bin/env bash
# Install the warm-minimal preset into the harness-home user preset root and,
# when the dsh CLI is available, register this package as a bundle in the web
# profile.
#
# DSH_REPO identifies the source checkout that receives the realization patch.
# Honors DSH_HOME and DSH_PROFILE; defaults are ~/.dsh and web.
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DSH_HOME_DIR="${DSH_HOME:-$HOME/.dsh}"
PROFILE="${DSH_PROFILE:-web}"
DSH_REPO_DIR="${DSH_REPO:?set DSH_REPO to the DeepSeek Harness checkout}"
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

HOST_PATCH_ARGS=(install --repo "$DSH_REPO_DIR")
if [ "${DSH_WARM_ADOPT_HOST_PATCH:-0}" = "1" ]; then
  HOST_PATCH_ARGS+=(--adopt)
fi
node "$REPO_DIR/scripts/host-patch.mjs" "${HOST_PATCH_ARGS[@]}"

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
echo "Build and restart dsh web, then pick '温暖极简模式' in the preset picker."
