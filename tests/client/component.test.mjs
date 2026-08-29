import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { WarmMinimalCard } from '../../lib/types/client/WarmMinimalCard.js'

describe('WarmMinimalCard', () => {
  it('renders an accessible Plugins-card disclosure on its collapsed main path', () => {
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
      setBootstrapEnabled() {}, setBootstrapMessage() {}, setGuidance() {}, assign() {},
      discard() {}, reloadInventory() {}, save() {},
    }))

    assert.match(html, /aria-expanded="false"/)
    assert.match(html, /aria-label="expand: title"/)
    assert.match(html, /description/)
  })
})
