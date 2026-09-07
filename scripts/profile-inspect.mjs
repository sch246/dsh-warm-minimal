/** Read one profile's independent installation records without changing deployment state. */
import { existsSync, lstatSync, readFileSync, realpathSync } from 'node:fs'
import { isAbsolute, join, resolve } from 'node:path'
import { createRequire } from 'node:module'
import { spawnSync } from 'node:child_process'

/** Return installation consistency, or explicit reasons the selected target was not inspected. */
export function inspectProfile(packageName, packageRoot, receiptName) {
  const { DSH_CHECKOUT: checkout, DSH_HOME: home, DSH_PROFILE: profile } = process.env
  if (!checkout || !home || !profile || !isAbsolute(checkout) || !isAbsolute(home) || !/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/u.test(profile)) {
    return { status: 'not-inspected', problems: ['Set absolute DSH_CHECKOUT and DSH_HOME, and an explicit DSH_PROFILE name'] }
  }
  if (!existsSync(checkout) || !existsSync(home)) return { status: 'not-inspected', problems: ['Selected checkout or Home does not exist'] }
  const directory = join(home, 'profiles', profile)
  const problems = []
  const report = { directory, status: 'inconsistent', dependency: null, lockDependency: null, resolvedPath: null, bundleCount: 0, matchesCandidate: false, problems }
  try {
    const manifestFile = join(directory, 'package.json')
    const manifest = existsSync(manifestFile) ? JSON.parse(readFileSync(manifestFile, 'utf8')) : {}
    report.dependency = manifest.dependencies?.[packageName] ?? null
    report.bundleCount = (manifest.dsh?.profile?.bundles ?? []).filter(name => name === packageName).length
    const lockFile = join(directory, 'pnpm-lock.yaml')
    if (existsSync(lockFile)) {
      const { load } = createRequire(join(checkout, 'apps/cli/package.json'))('js-yaml')
      report.lockDependency = load(readFileSync(lockFile, 'utf8'))?.importers?.['.']?.dependencies?.[packageName] ?? null
    }
    const installed = join(directory, 'node_modules', packageName)
    const entry = lstatSync(installed, { throwIfNoEntry: false })
    if (entry) report.resolvedPath = realpathSync(installed)
    const absent = report.dependency === null && report.lockDependency === null && !entry && report.bundleCount === 0
    if (!absent) {
      if (report.dependency === null) problems.push('Profile dependency is missing')
      if (report.lockDependency?.specifier !== report.dependency) problems.push('Root lock importer specifier differs from profile dependency')
      if (!report.lockDependency?.version) problems.push('Root lock importer resolution is missing')
      if (!report.resolvedPath) problems.push('Installed package cannot be resolved')
      if (report.bundleCount !== 1) problems.push('Expected exactly one profile Bundle entry')
      if (report.resolvedPath) {
        const installedManifest = JSON.parse(readFileSync(join(report.resolvedPath, 'package.json'), 'utf8'))
        if (installedManifest.name !== packageName) problems.push('Resolved package identity differs from dependency')
        report.installedVersion = installedManifest.version
        for (const [label, specifier] of [['manifest', report.dependency], ['lock', report.lockDependency?.version]]) {
          if (typeof specifier === 'string' && /^link:/.test(specifier)) {
            const expected = realpathSync(resolve(directory, specifier.slice('link:'.length)))
            if (expected !== report.resolvedPath) problems.push(`${label} local path differs from node_modules resolution`)
          }
        }
        report.matchesCandidate = report.resolvedPath === realpathSync(packageRoot)
      }
    }
    report.status = absent ? 'missing' : problems.length ? 'inconsistent' : 'installed'
  } catch (error) {
    // Invalid or unreadable deployment records prevent a consistency claim.
    problems.push(error instanceof Error ? error.message : String(error))
  }
  if (receiptName) {
    const result = spawnSync('git', ['-C', checkout, 'rev-parse', '--git-path', receiptName], { encoding: 'utf8' })
    if (result.status === 0) {
      const path = resolve(checkout, result.stdout.trim())
      report.receipt = { path, present: existsSync(path) }
      if (report.receipt.present) {
        try {
          const fields = Object.fromEntries(readFileSync(path, 'utf8').split(/\r?\n/u).filter(line => line.includes('=')).map(line => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1)]))
          for (const key of ['patch_sha256', 'patch_applied_by_setup', 'install_complete', 'host_head']) if (fields[key] !== undefined) report.receipt[key] = fields[key]
        } catch (error) {
          // Receipt read failures are reported separately from profile consistency.
          report.receipt.error = error instanceof Error ? error.message : String(error)
        }
      }
    } else report.receipt = { error: result.error?.message ?? result.stderr.trim() }
  }
  return report
}
