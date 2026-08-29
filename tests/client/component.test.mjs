import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  WarmMinimalCard, WarmMinimalSettingsContent,
} from '../../lib/types/client/WarmMinimalCard.js'

function actions() {
  return {
    setBootstrapEnabled() {}, setBootstrapMessage() {}, setGuidance() {}, assign() {},
    discard() {}, reloadInventory() {}, save() {},
  }
}

describe('WarmMinimalCard', () => {
  it('keeps the Plugins page compact and opens the complete configuration in a dialog', () => {
    const state = {
      status: 'ready', revision: 4, writable: true,
      draft: {
        bootstrapEnabled: false, bootstrapMessage: 'Still editable', guidance: 'Coordinate.',
        promptAssignments: {}, toolAssignments: {},
      },
      promptSources: [], toolSources: [], dirty: false, saving: false, failure: undefined,
    }
    const html = renderToStaticMarkup(createElement(WarmMinimalCard, {
      t: key => key,
      useWarmMinimalCard: selector => selector(state),
      ...actions(),
    }))

    assert.doesNotMatch(html, /aria-expanded=/)
    assert.match(html, /data-warm-minimal-summary="bootstrap"[^>]*>bootstrapDisabled</)
    assert.match(html, /data-warm-minimal-summary="prompt"[^>]*>promptSourceCount: 0</)
    assert.match(html, /data-warm-minimal-summary="tool"[^>]*>toolSourceCount: 0</)
    assert.match(html, /<button[^>]*data-open-warm-minimal-settings="true"[^>]*>openSettings<\/button>/)
    assert.match(html, /description/)
  })

  it('renders distinct contribution kinds and one three-slot native radio group per source', () => {
    const state = {
      status: 'ready', revision: 9, writable: true,
      draft: {
        bootstrapEnabled: true, bootstrapMessage: 'Inspect.', guidance: 'Coordinate.',
        promptAssignments: { 'source:\/\/prompt-alpha': 'parent-only' },
        toolAssignments: { 'source:\/\/tool-alpha': 'shared' },
      },
      promptSources: [{
        source: 'source://prompt-alpha', sections: ['same', 'system'], contexts: ['same'],
        assignment: 'parent-only',
      }],
      toolSources: [{
        source: 'source://tool-alpha',
        tools: [{ name: 'search_files', description: 'Search all workspace files.' }, { name: 'read_file' }],
        assignment: 'shared',
      }],
      dirty: true, saving: false, failure: undefined,
    }
    const html = renderToStaticMarkup(createElement(WarmMinimalSettingsContent, {
      state, t: key => key, ...actions(),
    }))

    assert.match(html, /data-source-list="prompt"/)
    assert.match(html, /data-source-list="tool"/)
    assert.match(html, /data-parent-only="1" data-child-only="0" data-shared="0"/)
    assert.match(html, /data-parent-only="0" data-child-only="0" data-shared="1"/)
    assert.equal(html.match(/role="radiogroup"/g)?.length, 2)
    assert.equal(html.match(/type="radio"/g)?.length, 6)
    assert.doesNotMatch(html, /<select/)
    assert.match(html, /class="dsh-warm-settings-source-disclosure"[\s\S]*?<\/button><fieldset[^>]*role="radiogroup"/)
    assert.match(html, /dsh-warm-settings-contribution-kind">sections<\/span><span>same, system/)
    assert.match(html, /dsh-warm-settings-contribution-kind">contexts<\/span><span>same/)
    assert.match(html, /dsh-warm-settings-tool-names">search_files, read_file/)
    assert.match(html, /dsh-warm-settings-tool-preview">Search all workspace files\./)
    assert.doesNotMatch(html, /source:\/\/tool-alpha/)
    assert.doesNotMatch(html, /source:\/\/prompt-alpha/)
  })

  it('disables every staged setting control while loading, read-only, or saving', () => {
    const base = {
      status: 'ready', revision: 2, writable: true,
      draft: {
        bootstrapEnabled: true, bootstrapMessage: 'Inspect.', guidance: 'Coordinate.',
        promptAssignments: {}, toolAssignments: {},
      },
      promptSources: [{ source: 'prompt', sections: ['system'], contexts: [], assignment: 'shared' }],
      toolSources: [], dirty: true, saving: false, failure: undefined,
    }

    for (const state of [
      { ...base, status: 'loading' },
      { ...base, writable: false },
      { ...base, saving: true },
    ]) {
      const html = renderToStaticMarkup(createElement(WarmMinimalSettingsContent, {
        state, t: key => key, ...actions(),
      }))
      assert.match(html, /type="checkbox"[^>]*disabled=""/)
      assert.equal(html.match(/type="radio"[^>]*disabled=""/g)?.length, 3)
      assert.equal(html.match(/<textarea[^>]*disabled=""/g)?.length, 2)
    }
  })
})
