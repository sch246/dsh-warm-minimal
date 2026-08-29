import { createElement } from 'react'

export function Modal({ open, children }) {
  return open ? createElement('div', { role: 'dialog', 'aria-modal': 'true' }, children) : null
}
