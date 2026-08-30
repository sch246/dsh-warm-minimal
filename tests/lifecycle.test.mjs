import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { chmod, cp, mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { describe, it } from 'node:test'

const packageRoot = fileURLToPath(new URL('..', import.meta.url))
const patchPath = join(packageRoot, 'patches/deepseek-harness.patch')
const presetSource = join(packageRoot, 'presets/warm-minimal')
const legacyPresetPath = join(packageRoot, 'tests/warm-minimal-0.1.agent.cordis.yml')
const baseline = 'cd5ef8148158c3a752a658978873241fdf8e2bbc'
const legacyAgentSha256 = 'c952e72ff87cb09e6d2700dcf806c6584a67cf867adcd103ec822a6c538d4f87'
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

async function writeLegacyPreset(destination, { driftAgent = false } = {}) {
  const legacyAgent = await readFile(legacyPresetPath)
  assert.equal(createHash('sha256').update(legacyAgent).digest('hex'), legacyAgentSha256)

  await mkdir(destination, { recursive: true })
  const agent = driftAgent ? Buffer.concat([legacyAgent, Buffer.from('\n# user edit\n')]) : legacyAgent
  await writeFile(join(destination, 'agent.cordis.yml'), agent)
  await cp(join(presetSource, 'preset.yml'), join(destination, 'preset.yml'))
  await writeFile(join(destination, '.dsh-warm-minimal-owned'), 'dsh-warm-minimal@0.1.0\n')
}

describe('package-owned Harness patch lifecycle', () => {
  it('upgrades only the exact package-owned 0.1 preset', async () => {
    const root = await mkdtemp(join(tmpdir(), 'dsh-warm-lifecycle-'))
    try {
      const patchSource = await readFile(patchPath, 'utf8')
      const repository = await createBaselineRepository(root, patchSource)
      const env = await createEnvironment(root, repository)
      const preset = join(env.DSH_HOME, '.agent-presets/warm-minimal')
      await writeLegacyPreset(preset)

      const refusedOldUninstall = run('bash', [join(packageRoot, 'scripts/uninstall.sh')], { env })
      assert.notEqual(refusedOldUninstall.status, 0)
      assert.match(refusedOldUninstall.stderr, /refusing to remove a preset not owned by dsh-warm-minimal@0\.2\.0/)

      const upgraded = run('bash', [join(packageRoot, 'scripts/setup.sh')], { env })
      expectSuccess(upgraded, 'upgrade exact 0.1 preset')
      assert.match(upgraded.stdout, /upgrading exact package-owned preset from dsh-warm-minimal@0\.1\.0 to dsh-warm-minimal@0\.2\.0/)
      assert.equal(
        await readFile(join(preset, '.dsh-warm-minimal-owned'), 'utf8'),
        'dsh-warm-minimal@0.2.0\n',
      )
      assert.equal(
        await readFile(join(preset, 'agent.cordis.yml'), 'utf8'),
        await readFile(join(presetSource, 'agent.cordis.yml'), 'utf8'),
      )
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })

  it('refuses a drifted 0.1 preset and an unknown owner', async () => {
    const root = await mkdtemp(join(tmpdir(), 'dsh-warm-lifecycle-'))
    try {
      const patchSource = await readFile(patchPath, 'utf8')
      const repository = await createBaselineRepository(root, patchSource)
      const env = await createEnvironment(root, repository)
      const preset = join(env.DSH_HOME, '.agent-presets/warm-minimal')
      await writeLegacyPreset(preset, { driftAgent: true })

      const drifted = run('bash', [join(packageRoot, 'scripts/setup.sh')], { env })
      assert.notEqual(drifted.status, 0)
      assert.match(drifted.stderr, /legacy package-owned preset has drifted/)
      assert.equal(await readOptional(env.DSH_TEST_DSH_LOG), undefined)
      assert.equal(run('git', ['-C', repository, 'status', '--porcelain']).stdout, '')

      const forced = run('bash', [join(packageRoot, 'scripts/setup.sh')], {
        env: { ...env, DSH_WARM_REPLACE_DRIFTED_PRESET: '1' },
      })
      expectSuccess(forced, 'explicitly replace drifted 0.1 preset')
      assert.equal(
        await readFile(join(preset, '.dsh-warm-minimal-owned'), 'utf8'),
        'dsh-warm-minimal@0.2.0\n',
      )

      await rm(preset, { recursive: true, force: true })
      await cp(presetSource, preset, { recursive: true })
      await writeFile(join(preset, '.dsh-warm-minimal-owned'), 'dsh-warm-minimal@9.9.9\n')
      const dshLogBeforeUnknown = await readFile(env.DSH_TEST_DSH_LOG, 'utf8')
      const repositoryStatusBeforeUnknown = run('git', ['-C', repository, 'status', '--porcelain']).stdout
      const unknown = run('bash', [join(packageRoot, 'scripts/setup.sh')], {
        env: { ...env, DSH_WARM_REPLACE_DRIFTED_PRESET: '1' },
      })
      assert.notEqual(unknown.status, 0)
      assert.match(unknown.stderr, /refusing preset with unknown owner 'dsh-warm-minimal@9\.9\.9'/)
      assert.equal(await readFile(env.DSH_TEST_DSH_LOG, 'utf8'), dshLogBeforeUnknown)
      assert.equal(run('git', ['-C', repository, 'status', '--porcelain']).stdout, repositoryStatusBeforeUnknown)
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })

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
        'export function hostSourceIdForEntry',
        'export function locallyDriftedHostSourceIdForEntry',
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

  it('refuses to uninstall a drifted current preset', async () => {
    const root = await mkdtemp(join(tmpdir(), 'dsh-warm-lifecycle-'))
    try {
      const patchSource = await readFile(patchPath, 'utf8')
      const repository = await createBaselineRepository(root, patchSource)
      const env = await createEnvironment(root, repository)
      const preset = join(env.DSH_HOME, '.agent-presets/warm-minimal')
      expectSuccess(run('bash', [join(packageRoot, 'scripts/setup.sh')], { env }), 'fresh setup')
      const dshLogBefore = await readFile(env.DSH_TEST_DSH_LOG, 'utf8')
      await writeFile(join(preset, 'agent.cordis.yml'), '# user replacement\n')

      const refused = run('bash', [join(packageRoot, 'scripts/uninstall.sh')], { env })
      assert.notEqual(refused.status, 0)
      assert.match(refused.stderr, /package-owned preset has drifted; refusing to remove later edits/)
      assert.equal(await readFile(env.DSH_TEST_DSH_LOG, 'utf8'), dshLogBefore)
      assert.equal(await readFile(join(preset, 'agent.cordis.yml'), 'utf8'), '# user replacement\n')
      expectSuccess(run('git', ['-C', repository, 'apply', '--check', '--reverse', patchPath]), 'verify patch remains applied')
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })
})
