#!/usr/bin/env bash
# Build the external browser contribution against one Harness checkout.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CHECKOUT="${DSH_CHECKOUT:-/root/deepseek-harness}"

if [ ! -d "$CHECKOUT/packages" ]; then
  echo "build-client: cannot locate Harness checkout at $CHECKOUT" >&2
  exit 1
fi
if [ ! -x "$CHECKOUT/node_modules/.bin/tsc" ] || [ ! -x "$CHECKOUT/node_modules/.bin/tsdown" ]; then
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
ensure_link "$ROOT/node_modules/@deepseek-ai/dsh-client-ui-primitives" "$ROOT/tests/fixtures/ui-primitives"

"$CHECKOUT/node_modules/.bin/tsc" -p "$ROOT/tsconfig.client.json"
(cd "$ROOT" && "$CHECKOUT/node_modules/.bin/tsdown" --config tsdown.client.config.ts)
