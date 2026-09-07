/** Repository maintenance entry; profile mutations require an explicit operation flag. */
import { existsSync, readFileSync } from 'node:fs'
import { isAbsolute, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const root = fileURLToPath(new URL('..', import.meta.url))
const packageDir = join(root, 'packages/dsh-warm-minimal')
const targetRevision = readFileSync(join(root, 'scripts/host-revision'), 'utf8').trim()
const [command, ...flags] = process.argv.slice(2)
const allowed = { build: [], typecheck: [], setup: ['--install'], inspect: [], remove: ['--remove'] }

function run(program, args, options = {}) {
  const result = spawnSync(program, args, { cwd: root, stdio: 'inherit', ...options })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(`${program} exited ${result.status}`)
  return result.stdout?.trim()
}

try {
  if (!Object.hasOwn(allowed, command) || flags.length > 1 || flags.some(flag => !allowed[command].includes(flag))) {
    throw new Error('Usage: node scripts/workspace.mjs build|typecheck|inspect|setup [--install]|remove [--remove]')
  }
  const checkout = process.env.DSH_CHECKOUT
  if (!checkout || !isAbsolute(checkout)) throw new Error('Set DSH_CHECKOUT to an absolute Harness checkout path')
  if (JSON.parse(readFileSync(join(checkout, 'package.json'), 'utf8')).name !== '@deepseek-ai/dsh-root') {
    throw new Error('DSH_CHECKOUT is not a Harness checkout')
  }
  if (command === 'build' || command === 'typecheck') {
    const pins = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).devDependencies
    for (const tool of ['typescript', 'tsdown']) {
      const actual = JSON.parse(readFileSync(join(root, 'node_modules', tool, 'package.json'), 'utf8')).version
      if (actual !== pins[tool]) throw new Error(`${tool}: expected ${pins[tool]}, found ${actual}`)
    }
    if (command === 'build') {
      for (const face of ['host', 'client']) run('bash', [join(root, `scripts/build-${face}.sh`)])
    } else {
      for (const face of ['host', 'client']) {
        run(process.execPath, [join(root, 'node_modules/typescript/bin/tsc'), '-p', join(packageDir, `tsconfig.${face}.json`), '--noEmit'])
      }
    }
  } else {
    if (!process.env.DSH_HOME || !isAbsolute(process.env.DSH_HOME)) throw new Error('Set DSH_HOME to an absolute Home path')
    if (!process.env.DSH_PROFILE || /[/\\]|^\.{1,2}$/.test(process.env.DSH_PROFILE)) throw new Error('Set DSH_PROFILE to an explicit profile name')
    const cli = join(checkout, 'apps/cli/lib/bin.js')
    if (!existsSync(cli)) throw new Error(`Build the selected checkout CLI first: ${cli}`)
    if (flags.length > 0) {
      run('bash', [join(root, command === 'setup' ? 'scripts/setup.sh' : 'scripts/uninstall.sh'), ...flags])
    } else {
      const revision = run('git', ['-C', checkout, 'rev-parse', 'HEAD'], { encoding: 'utf8', stdio: 'pipe' })
      const patch = join(root, 'patches/deepseek-harness.patch')
      const checkPatch = reverse => spawnSync('git', ['-C', checkout, 'apply', '--check', ...(reverse ? ['--reverse'] : []), patch], { stdio: 'ignore' }).status === 0
      console.log(JSON.stringify({ package: packageDir, checkout: resolve(checkout), revision, supportedRevision: targetRevision,
        supported: revision === targetRevision, patch: checkPatch(true) ? 'present' : checkPatch(false) ? 'absent' : 'drifted',
        preset: join(process.env.DSH_HOME, '.agent-presets/warm-minimal'), profile: process.env.DSH_PROFILE }, null, 2))
      run(process.execPath, [cli, 'plugin', '--profile', process.env.DSH_PROFILE, 'why', 'dsh-warm-minimal'], { cwd: checkout })
    }
  }
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
}
