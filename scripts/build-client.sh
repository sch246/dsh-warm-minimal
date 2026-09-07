#!/usr/bin/env bash
# Build the external browser contribution against one Harness checkout.
set -euo pipefail

WORKSPACE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ROOT="$WORKSPACE_ROOT/packages/dsh-warm-minimal"
CHECKOUT="${DSH_CHECKOUT:?set DSH_CHECKOUT explicitly}"

if [ ! -d "$CHECKOUT/packages" ]; then
  echo "build-client: cannot locate Harness checkout at $CHECKOUT" >&2
  exit 1
fi
if [ ! -f "$WORKSPACE_ROOT/node_modules/typescript/bin/tsc" ] || [ ! -f "$WORKSPACE_ROOT/node_modules/tsdown/dist/run.mjs" ]; then
  echo "build-client: Harness TypeScript build tools are unavailable" >&2
  exit 1
fi

ensure_link() {
  local link="$1"
  local target="$2"
  if [ -L "$link" ]; then
    rm "$link"
  elif [ -e "$link" ]; then
    echo "build-client: refusing to replace non-symlink $link" >&2
    exit 1
  fi
  ln -s "$target" "$link"
}

ensure_link "$ROOT/harness" "$CHECKOUT"
mkdir -p "$ROOT/node_modules/@types" "$ROOT/node_modules/@deepseek-ai"
ensure_link "$ROOT/node_modules/react" "$CHECKOUT/packages/client/ui-renderer/node_modules/react"
ensure_link "$ROOT/node_modules/react-dom" "$CHECKOUT/packages/client/ui-renderer/node_modules/react-dom"
ensure_link "$ROOT/node_modules/@types/react" "$CHECKOUT/packages/client/ui-renderer/node_modules/@types/react"
ensure_link "$ROOT/node_modules/@types/react-dom" "$CHECKOUT/packages/client/ui-renderer/node_modules/@types/react-dom"
ensure_link "$ROOT/node_modules/zod" "$CHECKOUT/packages/api/gateway/node_modules/zod"
ensure_link "$ROOT/node_modules/@deepseek-ai/dsh-api-remotes" "$CHECKOUT/packages/api/remotes"
ensure_link "$ROOT/node_modules/@deepseek-ai/dsh-client-locale" "$CHECKOUT/packages/client/locale"
ensure_link "$ROOT/node_modules/@deepseek-ai/dsh-client-ui-renderer" "$CHECKOUT/packages/client/ui-renderer"
ensure_link "$ROOT/node_modules/@deepseek-ai/dsh-client-ui-settings" "$CHECKOUT/packages/client/ui-settings"
ensure_link "$ROOT/node_modules/@deepseek-ai/dsh-client-ui-settings-plugins" "$CHECKOUT/packages/client/ui-settings-plugins"
ensure_link "$ROOT/node_modules/@deepseek-ai/dsh-client-ui-slots" "$CHECKOUT/packages/client/ui-slots"
ensure_link "$ROOT/node_modules/@deepseek-ai/dsh-client-ui-primitives" "$ROOT/tests/fixtures/ui-primitives"

node "$WORKSPACE_ROOT/node_modules/typescript/bin/tsc" -p "$ROOT/tsconfig.client.json"
(cd "$ROOT" && node "$WORKSPACE_ROOT/node_modules/tsdown/dist/run.mjs" --config tsdown.client.config.ts)
