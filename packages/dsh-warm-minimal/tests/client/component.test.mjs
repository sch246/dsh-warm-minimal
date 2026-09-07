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

  it('keeps prompt sources grouped but renders one three-slot native radio group per tool schema', () => {
    const state = {
      status: 'ready', revision: 9, writable: true,
      draft: {
        bootstrapEnabled: true, bootstrapMessage: 'Inspect.', guidance: 'Coordinate.',
        promptAssignments: { 'source:\/\/prompt-alpha': 'parent-only' },
        toolAssignments: {
          'tool-schema:v1:WyJzb3VyY2U6Ly90b29sLWFscGhhIiwic2VhcmNoX2ZpbGVzIl0': 'shared',
          'tool-schema:v1:WyJzb3VyY2U6Ly90b29sLWFscGhhIiwicmVhZF9maWxlIl0': 'child-only',
        },
      },
      promptSources: [{
        source: 'source://prompt-alpha', sections: ['same', 'system'], contexts: ['same'],
        assignment: 'parent-only',
      }],
      toolSources: [{
        id: 'tool-schema:v1:WyJzb3VyY2U6Ly90b29sLWFscGhhIiwic2VhcmNoX2ZpbGVzIl0',
        source: 'source://tool-alpha', name: 'search_files',
        description: 'Search all workspace files.', assignment: 'shared',
      }, {
        id: 'tool-schema:v1:WyJzb3VyY2U6Ly90b29sLWFscGhhIiwicmVhZF9maWxlIl0',
        source: 'source://tool-alpha', name: 'read_file',
        description: 'Read one workspace file.', assignment: 'child-only',
      }],
      dirty: true, saving: false, failure: undefined,
    }
    const html = renderToStaticMarkup(createElement(WarmMinimalSettingsContent, {
      state, t: key => key, ...actions(),
    }))

    assert.match(html, /data-source-list="prompt"/)
    assert.match(html, /data-source-list="tool"/)
    assert.match(html, /data-parent-only="1" data-child-only="0" data-shared="0"/)
    assert.match(html, /data-parent-only="0" data-child-only="1" data-shared="1"/)
    assert.equal(html.match(/data-source-row="tool"/g)?.length, 2)
    assert.equal(html.match(/role="radiogroup"/g)?.length, 3)
    assert.equal(html.match(/type="radio"/g)?.length, 9)
    assert.doesNotMatch(html, /<select/)
    assert.match(html, /class="dsh-warm-settings-source-disclosure"[\s\S]*?<\/button><fieldset[^>]*role="radiogroup"/)
    assert.match(html, /dsh-warm-settings-contribution-kind">sections<\/span><span>same, system/)
    assert.match(html, /dsh-warm-settings-contribution-kind">contexts<\/span><span>same/)
    assert.match(html, /dsh-warm-settings-tool-name">search_files</)
    assert.match(html, /dsh-warm-settings-tool-name">read_file</)
    assert.doesNotMatch(html, /search_files, read_file/)
    assert.match(html, /dsh-warm-settings-tool-preview">Search all workspace files\./)
    assert.match(html, /dsh-warm-settings-tool-preview">Read one workspace file\./)
    assert.match(html, /aria-label="assignment: search_files"[\s\S]*?data-checked="true"[\s\S]*?checked="" value="shared"/)
    assert.match(html, /aria-label="assignment: read_file"[\s\S]*?data-checked="true"[\s\S]*?checked="" value="child-only"/)
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
