#!/usr/bin/env bash
# Build the external Host Remote and generate its Typert faces against one Harness checkout.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CHECKOUT="${DSH_CHECKOUT:-/root/deepseek-harness}"

if [ ! -d "$CHECKOUT/packages" ]; then
  echo "build-host: cannot locate Harness checkout at $CHECKOUT" >&2
  exit 1
fi
if [ ! -x "$CHECKOUT/node_modules/.bin/tsc" ] || [ ! -x "$CHECKOUT/node_modules/.bin/tsdown" ]; then
  echo "build-host: Harness TypeScript build tools are unavailable" >&2
  exit 1
fi
GENERATOR="$CHECKOUT/packages/typert/generator/lib/types/workspace.js"
if [ ! -f "$GENERATOR" ]; then
  echo "build-host: Harness Typert generator artifacts are unavailable" >&2
  exit 1
fi

ensure_link() {
  local link="$1"
  local target="$2"
  if [ -L "$link" ]; then
    rm "$link"
  elif [ -e "$link" ]; then
    echo "build-host: refusing to replace non-symlink $link" >&2
    exit 1
  fi
  ln -s "$target" "$link"
}

ensure_link "$ROOT/harness" "$CHECKOUT"
if [ -L "$ROOT/node_modules" ]; then
  rm "$ROOT/node_modules"
elif [ -e "$ROOT/node_modules" ] && [ ! -d "$ROOT/node_modules" ]; then
  echo "build-host: refusing to replace non-directory $ROOT/node_modules" >&2
  exit 1
fi
mkdir -p "$ROOT/node_modules/@deepseek-ai"
mkdir -p "$ROOT/node_modules/@types"
ensure_link "$ROOT/node_modules/tsdown" "$CHECKOUT/node_modules/tsdown"
ensure_link "$ROOT/node_modules/tsx" "$CHECKOUT/node_modules/tsx"
ensure_link "$ROOT/node_modules/typescript" "$CHECKOUT/node_modules/typescript"
ensure_link "$ROOT/node_modules/zod" "$CHECKOUT/packages/api/gateway/node_modules/zod"
ensure_link "$ROOT/node_modules/@types/node" "$CHECKOUT/node_modules/@types/node"
ensure_link "$ROOT/node_modules/@deepseek-ai/cordis" "$CHECKOUT/vendor/cordis"
ensure_link "$ROOT/node_modules/@deepseek-ai/schemastery" "$CHECKOUT/vendor/schemastery"
ensure_link "$ROOT/node_modules/@deepseek-ai/dsh-settings" "$CHECKOUT/packages/settings/settings"
ensure_link "$ROOT/node_modules/@deepseek-ai/dsh-system-prompt" "$CHECKOUT/packages/core/system-prompt"
ensure_link "$ROOT/node_modules/@deepseek-ai/dsh-typert-protocol" "$CHECKOUT/packages/typert/protocol"

echo "building Host declarations..."
"$CHECKOUT/node_modules/.bin/tsc" -p "$ROOT/tsconfig.host.json"

echo "bundling Host Remote..."
(cd "$ROOT" && "$CHECKOUT/node_modules/.bin/tsdown" --config tsdown.host.config.ts)

WORKSPACE="$(mktemp -d)"
trap 'rm -rf "$WORKSPACE"' EXIT
PACKAGE="$WORKSPACE/packages/dsh-warm-minimal"
PROTOCOL_PACKAGE="$WORKSPACE/packages/typert-protocol"
mkdir -p "$PACKAGE/src"
mkdir -p "$PROTOCOL_PACKAGE/src"
cp "$ROOT/package.json" "$ROOT/index.mjs" "$ROOT/host.mjs" "$ROOT/config.mjs" "$ROOT/runtime.mjs" \
  "$ROOT/projection-host.mjs" "$ROOT/projection.mjs" "$PACKAGE/"
cp "$ROOT/src/remote.ts" "$ROOT/src/types.ts" "$PACKAGE/src/"
cp "$CHECKOUT/packages/typert/protocol/package.json" "$PROTOCOL_PACKAGE/"
cp -R "$CHECKOUT/packages/typert/protocol/src/." "$PROTOCOL_PACKAGE/src/"
ln -s "$CHECKOUT" "$WORKSPACE/harness"
ln -s "$CHECKOUT/node_modules" "$WORKSPACE/node_modules"

node --input-type=module - "$WORKSPACE" "$CHECKOUT" <<'NODE'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

const [workspace, checkout] = process.argv.slice(2)
writeFileSync(join(workspace, 'tsconfig.host.json'), `${JSON.stringify({
  extends: './harness/tsconfig.base.json',
  compilerOptions: {
    allowJs: true,
    checkJs: false,
    baseUrl: '.',
    paths: {
      '@deepseek-ai/cordis': ['./harness/vendor/cordis/src/index.ts'],
      '@deepseek-ai/dsh-typert-protocol': ['./packages/typert-protocol/src/index.ts'],
    },
  },
  files: [],
  references: [
    { path: './packages/dsh-warm-minimal' },
    { path: './packages/typert-protocol' },
  ],
}, null, 2)}\n`)
writeFileSync(join(workspace, 'packages/dsh-warm-minimal/tsconfig.json'), `${JSON.stringify({
  extends: '../../harness/tsconfig.base.json',
  compilerOptions: {
    allowJs: true,
    checkJs: false,
    noEmit: true,
    baseUrl: '../..',
    paths: {
      '@deepseek-ai/cordis': ['./harness/vendor/cordis/src/index.ts'],
      '@deepseek-ai/dsh-typert-protocol': ['./packages/typert-protocol/src/index.ts'],
    },
  },
  include: ['*.mjs', 'src/**/*.ts'],
  references: [
    { path: '../../harness/vendor/cordis' },
    { path: '../../harness/packages/settings/settings' },
    { path: '../../harness/packages/core/system-prompt' },
    { path: '../../harness/packages/typert/protocol' },
  ],
}, null, 2)}\n`)
writeFileSync(join(workspace, 'packages/typert-protocol/tsconfig.json'), `${JSON.stringify({
  extends: '../../harness/tsconfig.base.json',
  compilerOptions: { rootDir: 'src', noEmit: true },
  include: ['src/**/*.ts'],
  references: [
    { path: '../../harness/vendor/cordis' },
  ],
}, null, 2)}\n`)
NODE

echo "generating Typert Host and Remote artifacts..."
node --input-type=module - "$WORKSPACE" "$ROOT" "$GENERATOR" <<'NODE'
import { mkdirSync, writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'

const [workspace, outputRoot, generatorPath] = process.argv.slice(2)
const { WorkspaceTypertGenerator } = await import(pathToFileURL(generatorPath))
const generator = new WorkspaceTypertGenerator(workspace)
const discovered = generator.discover(['host'])
const artifacts = generator.generate(['dsh-warm-minimal'], ['host'])
if (artifacts.length !== 1 || artifacts[0].remote === undefined) {
  const { WorkspaceAnalyzer } = await import(pathToFileURL(join(dirname(generatorPath), 'analyzer.js')))
  const model = new WorkspaceAnalyzer({ root: workspace, packages: ['dsh-warm-minimal'], faces: ['host'] }).analyze()
  throw new Error(`build-host: expected one Host artifact with a Remote projection; received ${JSON.stringify(artifacts.map(artifact => ({
    package: artifact.package,
    face: artifact.face,
    remote: artifact.remote !== undefined,
  })))}; discovered ${JSON.stringify(discovered)}; model ${JSON.stringify(model.faces.map(face => face.packages))}`)
}
const [artifact] = artifacts
const output = join(outputRoot, 'lib')
mkdirSync(output, { recursive: true })
writeFileSync(join(output, 'typert.host.js'), artifact.js)
writeFileSync(join(output, 'typert.host.d.ts'), artifact.dts)
writeFileSync(join(output, 'typert.remote-client.js'), artifact.remote.js)
writeFileSync(join(output, 'typert.remote-client.d.ts'), artifact.remote.dts)
writeFileSync(join(output, 'typert.remote-client.d.ts.map'), artifact.remote.dtsMap)
NODE

echo "build-host: complete"
