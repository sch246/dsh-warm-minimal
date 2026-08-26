import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, it } from 'node:test'

const script = new URL('../scripts/host-patch.mjs', import.meta.url)

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'dsh-warm-patch-'))
  const realization = join(root, 'realization')
  await mkdir(realization)
  run(root, 'git', ['init'])
  run(root, 'git', ['config', 'user.name', 'Test'])
  run(root, 'git', ['config', 'user.email', 'test@example.invalid'])
  run(root, 'git', ['remote', 'add', 'origin', 'https://example.invalid/harness.git'])
  await writeFile(join(root, 'target.txt'), 'before\n')
  run(root, 'git', ['add', 'target.txt'])
  run(root, 'git', ['commit', '-m', 'baseline'])
  const baseline = run(root, 'git', ['rev-parse', 'HEAD']).trim()
  await writeFile(join(realization, 'change.patch'), [
    'diff --git a/target.txt b/target.txt',
    '--- a/target.txt',
    '+++ b/target.txt',
    '@@ -1 +1 @@',
    '-before',
    '+after',
    '',
  ].join('\n'))
  const manifest = join(realization, 'manifest.json')
  await writeFile(manifest, `${JSON.stringify({
    id: 'fixture', revision: '1',
    target: { uri: 'https://example.invalid/harness.git', baseline, paths: ['target.txt'] },
    patch: 'change.patch', receipt: 'fixture/receipt.json',
  })}\n`)
  return { root, manifest }
}

describe('host patch lifecycle', () => {
  it('installs idempotently and uninstalls only its owned patch', async () => {
    const value = await fixture()
    lifecycle(value, 'install')
    assert.equal(await readFile(join(value.root, 'target.txt'), 'utf8'), 'after\n')
    lifecycle(value, 'install')
    assert.match(lifecycle(value, 'status'), /^installed:/)

    await writeFile(join(value.root, 'target.txt'), 'later\n')
    assert.notEqual(lifecycle(value, 'uninstall', false).status, 0)
    assert.equal(await readFile(join(value.root, 'target.txt'), 'utf8'), 'later\n')

    await writeFile(join(value.root, 'target.txt'), 'after\n')
    lifecycle(value, 'uninstall')
    assert.equal(await readFile(join(value.root, 'target.txt'), 'utf8'), 'before\n')
  })

  it('requires explicit adoption of an already-present unowned patch', async () => {
    const value = await fixture()
    run(value.root, 'git', ['apply', join(value.root, 'realization/change.patch')])
    assert.notEqual(lifecycle(value, 'install', false).status, 0)
    lifecycle(value, 'install', true, ['--adopt'])
    lifecycle(value, 'uninstall')
    assert.equal(await readFile(join(value.root, 'target.txt'), 'utf8'), 'before\n')
  })
})

function lifecycle(value, action, success = true, extra = []) {
  const args = [script.pathname, action, '--repo', value.root, '--manifest', value.manifest, ...extra]
  if (!success) return spawnSync(process.execPath, args, { encoding: 'utf8' })
  return execFileSync(process.execPath, args, { encoding: 'utf8' })
}

function run(cwd, command, args) {
  return execFileSync(command, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
}
