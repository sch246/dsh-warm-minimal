#!/usr/bin/env node
/**
 * mine-first-rounds: rank DeepSeek Harness session logs by first-round
 * reasoning style and print the best candidates as seed-template material.
 *
 * Style fingerprint (mirrors the NoLetMe / modeltest word list):
 *   we      = /\bwe\b/gi
 *   let's   = /\blet's\b/gi
 *   let me  = /\blet me\b/gi
 *   I       = /\bI\b/gi
 *
 * Quality gate for a warm-minimal first-round template:
 *   letMe === 0 && (we + lets) >= 8 && at least one tool/call
 *   && at least one assistant/message && no tool/error.
 *
 * Usage (needs `zstd` on PATH):
 *   node tools/mine-first-rounds.mjs <sessions-root> [--top 5]
 */

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const root = process.argv[2] ?? process.cwd()
const topFlag = process.argv.indexOf('--top')
const top = topFlag === -1 ? 10 : Number(process.argv[topFlag + 1] ?? 10)

/** Decompress one zstd-compressed session log through the `zstd` CLI. */
function readSessionLog(path) {
  const result = spawnSync('zstd', ['-d', '-c', path], { maxBuffer: 1 << 29 })
  if (result.status !== 0) throw new Error(`zstd failed for ${path}`)
  return result.stdout.toString('utf8')
}

function profile(events) {
  let preset = ''
  let firstUser = ''
  let reasoning = ''
  const tools = new Set()
  let errors = 0
  let finals = 0
  let firstLine = ''
  for (const event of events) {
    const data = event.data ?? {}
    if (event.type === 'session') preset = event.agentPreset ?? ''
    if (event.type === 'user/message' && firstUser === '' && data.source?.kind === 'user') {
      firstUser = (data.content?.[0]?.text ?? '').slice(0, 120).replace(/\s+/g, ' ')
    }
    if (event.type === 'assistant/chunk') {
      const chunk = data.chunk ?? {}
      if ((chunk.type === 'reasoning-delta' || chunk.type === 'reasoning') && typeof chunk.text === 'string') {
        reasoning += chunk.text
      }
    }
    if (event.type === 'reasoning-chunks') reasoning += (data.texts ?? []).join('')
    if (event.type === 'tool/call') tools.add(data.name ?? data.arguments?.name ?? '?')
    if (event.type === 'tool/error') errors += 1
    if (event.type === 'assistant/message') finals += 1
  }
  for (const line of reasoning.split('\n')) {
    const trimmed = line.trim()
    if (trimmed !== '') { firstLine = trimmed.slice(0, 100); break }
  }
  const we = (reasoning.match(/\bwe\b/gi) ?? []).length
  const lets = (reasoning.match(/\blet's\b/gi) ?? []).length
  const letMe = (reasoning.match(/\blet me\b/gi) ?? []).length
  const i = (reasoning.match(/\bI\b/gi) ?? []).length
  return { preset, firstUser, firstLine, we, lets, letMe, i, tools: [...tools], errors, finals }
}

const files = []
function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    const stat = statSync(path)
    if (stat.isDirectory()) walk(path)
    else if (entry.endsWith('.zstd') || entry === 'session.jsonl.zstd') files.push(path)
  }
}
walk(root)

const rows = []
for (const file of files) {
  const events = readSessionLog(file).split('\n').filter(Boolean).map(line => JSON.parse(line))
  rows.push({ file, ...profile(events) })
}
rows.sort((left, right) => (right.we + right.lets - right.letMe * 2) - (left.we + left.lets - left.letMe * 2))

for (const row of rows.slice(0, top)) {
  const passes = row.letMe === 0 && (row.we + row.lets) >= 8 && row.tools.length > 0 && row.errors === 0 && row.finals > 0
  console.log(`${passes ? 'SEED-OK ' : 'skip    '} ${row.file}`)
  console.log(`  preset=${row.preset || '-'} we=${row.we} lets=${row.lets} letMe=${row.letMe} I=${row.i} tools=[${row.tools}] errors=${row.errors} finals=${row.finals}`)
  console.log(`  first="${row.firstLine}"`)
  console.log(`  user="${row.firstUser}"`)
}
