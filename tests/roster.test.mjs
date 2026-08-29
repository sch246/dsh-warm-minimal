import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { describe, it } from 'node:test'

const presetUrl = new URL('../presets/warm-minimal/agent.cordis.yml', import.meta.url)

function entryPaths(source) {
  const paths = new Set()
  let parent

  for (const line of source.split('\n')) {
    const topLevel = /^- id: ([a-z0-9-]+)$/.exec(line)
    if (topLevel !== null) {
      parent = topLevel[1]
      paths.add(parent)
      continue
    }

    const child = /^    - id: ([a-z0-9-]+)$/.exec(line)
    if (child !== null && parent !== undefined) paths.add(`${parent}/${child[1]}`)
  }

  return paths
}

function topLevelBlock(source, id) {
  const start = source.indexOf(`- id: ${id}\n`)
  assert.notEqual(start, -1, `missing top-level entry: ${id}`)
  const next = source.indexOf('\n- id: ', start + 1)
  return source.slice(start, next === -1 ? source.length : next)
}

describe('warm-minimal package-owned roster', () => {
  it('mounts the broader roster under stable entry paths', async () => {
    const preset = await readFile(presetUrl, 'utf8')
    const paths = entryPaths(preset)

    for (const expected of [
      'persona',
      'worker-persona',
      'agent-instructions',
      'persistent-shell/pty',
      'persistent-shell/terminal-bash',
      'persistent-shell/persistent-bash',
      'persistent-shell/terminal-pwsh',
      'persistent-shell/persistent-pwsh',
      'filesystem/fs-local',
      'filesystem/str-replace-editor',
      'tool-fs',
      'tool-fs-search',
      'tool-jobs',
      'skill-filesystem',
      'tool-skill',
      'tool-goal',
      'planning/plan-mode',
      'compaction/compaction-basic',
      'compaction/command-compact',
      'compaction/tool-result-pruner',
      'delegation/tool-subagent-control',
      'delegation/tool-subagent-list-agents',
      'delegation/tool-subagent',
      'tool-ask-user',
      'tool-todo',
      'tool-web',
    ]) {
      assert.equal(paths.has(expected), true, `missing stable entry path: ${expected}`)
    }
  })

  it('owns projection and roster configuration without another preset', async () => {
    const preset = await readFile(presetUrl, 'utf8')
    const paths = entryPaths(preset)

    assert.match(
      topLevelBlock(preset, 'worker-persona'),
      /name: dsh-warm-minimal\/projection/,
    )
    assert.doesNotMatch(
      preset,
      /agent-presets[/\\].*standard|[/\\]standard[/\\]agent\.cordis\.yml|preset:\s*standard|extends:|inherits?:/i,
    )
    assert.doesNotMatch(
      preset,
      /^\s*name: '@deepseek-ai\/dsh-tool-(?:bash|pwsh)'\s*$/m,
    )
    assert.match(preset, /@deepseek-ai\/dsh-tool-jobs/)
    for (const removed of ['tool-subagent-fork', 'tool-workflow', 'tool-ralph', 'workflow-worker-thread']) {
      assert.equal(paths.has(`delegation/${removed}`), false, `compact coordinator must not mount ${removed}`)
    }
  })

  it('keeps persona extensible and copies the selected runtime settings', async () => {
    const preset = await readFile(presetUrl, 'utf8')
    const persona = topLevelBlock(preset, 'persona')
    const workerPersona = topLevelBlock(preset, 'worker-persona')

    assert.match(persona, /text: You are a helpful software engineer assistant\./)
    assert.doesNotMatch(persona, /\bcomplete:/)
    assert.doesNotMatch(persona, /\bincludeRuntimeContext:/)
    assert.match(workerPersona, /workerPersona: You are a coding agent powered by the \{\{model\}\} model\. Your working directory is \{\{cwd\}\}\./)
    assert.doesNotMatch(workerPersona, /\bcomplete:/)
    assert.doesNotMatch(workerPersona, /@deepseek-ai\/dsh-persona/)

    for (const expected of [
      /maxBytes: 65536/,
      /sampleOverCapGlobResults: false/,
      /thresholdChars: 8192/,
      /headChars: 4096/,
      /tailChars: 1024/,
      /provider: spawn\n\s+toolName: subagent\n\s+backgroundMode: continuable/,
      /allowParallelInProgress: true/,
      /fetch: false\n\s+searchTimeoutMs: 60000/,
    ]) {
      assert.match(preset, expected)
    }
  })
})
