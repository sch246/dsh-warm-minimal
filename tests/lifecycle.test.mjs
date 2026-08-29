import assert from 'node:assert/strict'
import { chmod, cp, mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { describe, it } from 'node:test'

const packageRoot = fileURLToPath(new URL('..', import.meta.url))
const patchPath = join(packageRoot, 'patches/deepseek-harness.patch')
const baseline = 'b150a551b8d465e31e418e1b2eaf5e79bbb7d28e'
const sourceCheckout = process.env.DSH_LIFECYCLE_TEST_SOURCE ?? '/root/deepseek-harness'

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: options.cwd,
    env: options.env ?? process.env,
    encoding: options.encoding ?? 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  })
}

function expectSuccess(result, subject) {
  assert.equal(result.status, 0, `${subject}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`)
}

function patchEntries(source) {
  const headers = [...source.matchAll(/^diff --git a\/(.+) b\/(.+)$/gm)]
  return headers.map((header, index) => {
    const end = headers[index + 1]?.index ?? source.length
    const block = source.slice(header.index, end)
    return { path: header[1], isNew: /\nnew file mode \d+\n/.test(block) }
  })
}

async function createBaselineRepository(root, patchSource) {
  const repository = join(root, 'harness')
  await mkdir(repository, { recursive: true })
  expectSuccess(run('git', ['-C', sourceCheckout, 'cat-file', '-e', `${baseline}^{commit}`]), 'locate Harness baseline')

  const entries = [{ path: 'package.json', isNew: false }, ...patchEntries(patchSource)]
  for (const entry of entries) {
    if (entry.isNew) continue
    const content = run('git', ['-C', sourceCheckout, 'show', `${baseline}:${entry.path}`], { encoding: null })
    assert.equal(content.status, 0, `read baseline ${entry.path}: ${content.stderr?.toString()}`)
    const destination = join(repository, entry.path)
    await mkdir(dirname(destination), { recursive: true })
    await writeFile(destination, content.stdout)
  }

  expectSuccess(run('git', ['init', '--quiet', repository]), 'initialize temporary Harness repository')
  expectSuccess(run('git', ['-C', repository, 'config', 'user.name', 'Lifecycle Test']), 'configure Git user name')
  expectSuccess(run('git', ['-C', repository, 'config', 'user.email', 'lifecycle@example.invalid']), 'configure Git user email')
  expectSuccess(run('git', ['-C', repository, 'add', '.']), 'stage temporary baseline')
  expectSuccess(run('git', ['-C', repository, 'commit', '--quiet', '-m', 'baseline']), 'commit temporary baseline')
  return repository
}

async function createEnvironment(root, repository) {
  const bin = join(root, 'bin')
  const dshHome = join(root, 'dsh-home')
  const dshLog = join(root, 'dsh.log')
  const fakeDsh = join(bin, 'dsh')
  await mkdir(bin, { recursive: true })
  await writeFile(fakeDsh, '#!/bin/sh\nprintf "%s\\n" "$*" >> "$DSH_TEST_DSH_LOG"\n')
  await chmod(fakeDsh, 0o755)
  return {
    ...process.env,
    PATH: `${bin}:${process.env.PATH}`,
    DSH_CHECKOUT: repository,
    DSH_HOME: dshHome,
    DSH_PROFILE: 'lifecycle-test',
    DSH_TEST_DSH_LOG: dshLog,
  }
}

async function readOptional(path) {
  try {
    return await readFile(path, 'utf8')
  } catch (error) {
    if (error.code === 'ENOENT') return undefined
    throw error
  }
}

describe('package-owned Harness patch lifecycle', () => {
  it('applies once, refuses owned-region drift, and removes only the exact patch', async () => {
    const root = await mkdtemp(join(tmpdir(), 'dsh-warm-lifecycle-'))
    try {
      const patchSource = await readFile(patchPath, 'utf8')
      const repository = await createBaselineRepository(root, patchSource)
      const env = await createEnvironment(root, repository)
      const setup = join(packageRoot, 'scripts/setup.sh')
      const uninstall = join(packageRoot, 'scripts/uninstall.sh')

      const fresh = run('bash', [setup], { env })
      expectSuccess(fresh, 'fresh setup')
      expectSuccess(run('git', ['-C', repository, 'apply', '--check', '--reverse', patchPath]), 'verify applied patch')
      expectSuccess(run('git', ['-C', repository, 'diff', '--cached', '--quiet']), 'verify setup did not stage Harness changes')

      const firstStatus = run('git', ['-C', repository, 'status', '--short']).stdout
      const repeated = run('bash', [setup], { env })
      expectSuccess(repeated, 'idempotent setup')
      assert.match(repeated.stdout, /exact package-owned Harness patch already present/)
      assert.equal(run('git', ['-C', repository, 'status', '--short']).stdout, firstStatus)

      const ownedPath = join(repository, 'packages/core/system-prompt/src/index.ts')
      const exactOwnedContent = await readFile(ownedPath, 'utf8')
      await writeFile(ownedPath, exactOwnedContent.replace(
        '@meta-intent:begin dsh-warm-minimal',
        '@meta-intent:begin locally-drifted-warm-minimal',
      ))
      const logBeforeDrift = await readOptional(env.DSH_TEST_DSH_LOG)
      const refused = run('bash', [setup], { env })
      assert.notEqual(refused.status, 0)
      assert.match(refused.stderr, /source differs from both the unpatched and exact patched states/)
      assert.equal(await readOptional(env.DSH_TEST_DSH_LOG), logBeforeDrift)
      assert.equal(
        await readFile(join(env.DSH_HOME, '.agent-presets/warm-minimal/.dsh-warm-minimal-owned'), 'utf8'),
        await readFile(join(packageRoot, 'presets/warm-minimal/.dsh-warm-minimal-owned'), 'utf8'),
      )

      const refusedRemoval = run('bash', [uninstall], { env })
      assert.notEqual(refusedRemoval.status, 0)
      assert.match(refusedRemoval.stderr, /regions have drifted; refusing a partial uninstall/)
      assert.equal(await readOptional(env.DSH_TEST_DSH_LOG), logBeforeDrift)
      assert.equal(
        await readFile(join(env.DSH_HOME, '.agent-presets/warm-minimal/.dsh-warm-minimal-owned'), 'utf8'),
        await readFile(join(packageRoot, 'presets/warm-minimal/.dsh-warm-minimal-owned'), 'utf8'),
      )

      await writeFile(ownedPath, exactOwnedContent)
      const removed = run('bash', [uninstall], { env })
      expectSuccess(removed, 'exact uninstall')
      expectSuccess(run('git', ['-C', repository, 'apply', '--check', patchPath]), 'verify patch removal')
      expectSuccess(run('git', ['-C', repository, 'diff', '--quiet']), 'verify restored tracked Harness files')
      assert.equal(await readOptional(join(env.DSH_HOME, '.agent-presets/warm-minimal/.dsh-warm-minimal-owned')), undefined)
      assert.match(await readFile(env.DSH_TEST_DSH_LOG, 'utf8'), /plugin --profile lifecycle-test remove dsh-warm-minimal/)
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })

  it('skips source removal when the package patch is absent', async () => {
    const root = await mkdtemp(join(tmpdir(), 'dsh-warm-lifecycle-'))
    try {
      const patchSource = await readFile(patchPath, 'utf8')
      const repository = await createBaselineRepository(root, patchSource)
      const env = await createEnvironment(root, repository)
      const preset = join(env.DSH_HOME, '.agent-presets/warm-minimal')
      await mkdir(dirname(preset), { recursive: true })
      await cp(join(packageRoot, 'presets/warm-minimal'), preset, { recursive: true })

      const removed = run('bash', [join(packageRoot, 'scripts/uninstall.sh')], { env })
      expectSuccess(removed, 'uninstall without source patch')
      assert.match(removed.stdout, /patch is not present; skipping source removal/)
      expectSuccess(run('git', ['-C', repository, 'status', '--porcelain']), 'inspect temporary repository')
      assert.equal(run('git', ['-C', repository, 'status', '--porcelain']).stdout, '')
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })
})
