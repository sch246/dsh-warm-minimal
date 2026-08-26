#!/usr/bin/env node

import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { mkdir, readFile, realpath, rm, writeFile } from 'node:fs/promises'
import { dirname, isAbsolute, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const parsed = parseArgs(process.argv.slice(2))
const manifestPath = resolve(parsed.manifest ?? resolve(packageRoot, 'realization/deepseek-harness.json'))
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
const patchPath = resolve(dirname(manifestPath), manifest.patch)
const patchDigest = `sha256:${createHash('sha256').update(await readFile(patchPath)).digest('hex')}`
const repository = await realpath(parsed.repo ?? process.env.DSH_REPO ?? fail('pass --repo or set DSH_REPO'))

const root = git(['rev-parse', '--show-toplevel']).stdout
if (await realpath(root) !== repository) fail(`repository root mismatch: ${root}`)

const remote = normalizeRemote(git(['remote', 'get-url', 'origin']).stdout)
if (remote !== normalizeRemote(manifest.target.uri)) {
  fail(`origin mismatch: expected ${manifest.target.uri}, got ${remote}`)
}
git(['cat-file', '-e', `${manifest.target.baseline}^{commit}`])
git(['merge-base', '--is-ancestor', manifest.target.baseline, 'HEAD'])

const gitDirRaw = git(['rev-parse', '--git-dir']).stdout
const gitDir = isAbsolute(gitDirRaw) ? gitDirRaw : resolve(repository, gitDirRaw)
const receiptPath = resolve(gitDir, manifest.receipt)
const receipt = await readReceipt(receiptPath)
const forwardApplicable = gitCheck(['apply', '--check', patchPath])
const reverseApplicable = gitCheck(['apply', '--reverse', '--check', patchPath])

if (parsed.action === 'status') {
  const state = receipt && reverseApplicable
    ? 'installed'
    : reverseApplicable
      ? 'applied-unowned'
      : forwardApplicable
        ? 'not-installed'
        : 'drifted'
  console.log(`${state}: ${repository}`)
  process.exit(0)
}

if (parsed.action === 'install') {
  if (receipt) {
    verifyReceipt(receipt)
    if (!reverseApplicable) fail('receipt exists but the owned patch has drifted')
    console.log(`host patch already installed -> ${repository}`)
    process.exit(0)
  }
  if (reverseApplicable && !parsed.adopt) {
    fail('patch is already present but unowned; rerun with --adopt to record ownership')
  }
  if (!reverseApplicable) {
    if (!forwardApplicable) fail('patch cannot be applied cleanly to this checkout')
    git(['apply', patchPath])
  }
  await mkdir(dirname(receiptPath), { recursive: true })
  await writeFile(receiptPath, `${JSON.stringify({
    schema: 'dsh-warm-minimal/host-patch-receipt-v1',
    id: manifest.id,
    revision: manifest.revision,
    repository,
    baseline: manifest.target.baseline,
    patchDigest,
    paths: manifest.target.paths,
  }, null, 2)}\n`)
  console.log(`${reverseApplicable ? 'host patch adopted' : 'host patch installed'} -> ${repository}`)
  process.exit(0)
}

if (!receipt) fail('host patch receipt not found; refusing an unowned uninstall')
verifyReceipt(receipt)
if (!reverseApplicable) fail('owned patch has drifted; refusing to overwrite later edits')
git(['apply', '--reverse', patchPath])
await rm(receiptPath)
console.log(`host patch uninstalled -> ${repository}`)

function parseArgs(args) {
  const action = args.shift()
  if (!['install', 'uninstall', 'status'].includes(action)) {
    fail('usage: host-patch.mjs <install|uninstall|status> --repo <checkout> [--adopt] [--manifest <path>]')
  }
  const result = { action, adopt: false }
  while (args.length > 0) {
    const option = args.shift()
    if (option === '--adopt') result.adopt = true
    else if (option === '--repo') result.repo = args.shift() ?? fail('--repo requires a path')
    else if (option === '--manifest') result.manifest = args.shift() ?? fail('--manifest requires a path')
    else fail(`unknown option: ${option}`)
  }
  return result
}

function git(args) {
  const result = spawnSync('git', ['-C', repository, ...args], { encoding: 'utf8' })
  if (result.status !== 0) fail(result.stderr.trim() || `git ${args.join(' ')} failed`)
  return { stdout: result.stdout.trim() }
}

function gitCheck(args) {
  return spawnSync('git', ['-C', repository, ...args], { stdio: 'ignore' }).status === 0
}

async function readReceipt(path) {
  try {
    return JSON.parse(await readFile(path, 'utf8'))
  } catch (error) {
    if (error?.code === 'ENOENT') return null
    throw error
  }
}

function verifyReceipt(value) {
  if (value.schema !== 'dsh-warm-minimal/host-patch-receipt-v1'
    || value.id !== manifest.id
    || value.revision !== manifest.revision
    || value.repository !== repository
    || value.baseline !== manifest.target.baseline
    || value.patchDigest !== patchDigest
    || JSON.stringify(value.paths) !== JSON.stringify(manifest.target.paths)) {
    fail('host patch receipt does not match this realization')
  }
}

function normalizeRemote(value) {
  return value.trim().replace(/^git@github\.com:/, 'https://github.com/').replace(/\.git$/, '')
}

function fail(message) {
  throw new Error(message)
}
