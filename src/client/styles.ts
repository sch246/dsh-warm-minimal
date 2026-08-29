/** Package-owned browser styles; the out-of-tree bundle has no CSS sidecar. */

import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'

const PLUGIN_ID = 'dsh-warm-minimal'

const CSS = `
.dsh-warm-settings-card{list-style:none;border:1px solid var(--dsw-alias-border-l2);border-radius:16px;background:var(--dsw-alias-bg-layer-1);overflow:hidden}
.dsh-warm-settings-header{width:100%;display:flex;gap:12px;align-items:center;padding:16px;border:0;background:transparent;color:var(--dsw-alias-label-primary);text-align:left;cursor:pointer;font:inherit}
.dsh-warm-settings-heading{display:flex;flex:1;min-width:0;flex-direction:column;gap:4px}
.dsh-warm-settings-title{font-size:15px;font-weight:600;line-height:22px}
.dsh-warm-settings-description,.dsh-warm-settings-hint,.dsh-warm-settings-source-id,.dsh-warm-settings-revision{font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary)}
.dsh-warm-settings-badge{font-size:12px;line-height:18px;color:var(--dsw-alias-brand-primary)}
.dsh-warm-settings-chevron{font-size:18px;transition:transform .15s ease}
.dsh-warm-settings-chevron[data-open=true]{transform:rotate(180deg)}
.dsh-warm-settings-body{display:flex;flex-direction:column;gap:20px;padding:0 16px 16px;border-top:1px solid var(--dsw-alias-border-l2)}
.dsh-warm-settings-status{margin:16px 0 0;color:var(--dsw-alias-label-secondary)}
.dsh-warm-settings-alert{margin:16px 0 0;padding:10px 12px;border-radius:10px;background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 10%,transparent);color:var(--dsw-alias-state-error-primary);font-size:13px;line-height:20px}
.dsh-warm-settings-alert ul{margin:6px 0 0;padding-left:20px}
.dsh-warm-settings-field{display:flex;flex-direction:column;gap:6px}
.dsh-warm-settings-check{display:flex;align-items:center;gap:8px;font-size:14px;color:var(--dsw-alias-label-primary)}
.dsh-warm-settings-label{font-size:14px;font-weight:500;line-height:22px;color:var(--dsw-alias-label-primary)}
.dsh-warm-settings-textarea{box-sizing:border-box;width:100%;min-height:84px;resize:vertical;padding:10px 12px;border:1px solid var(--dsw-alias-border-l2);border-radius:10px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;line-height:20px}
.dsh-warm-settings-textarea:focus,.dsh-warm-settings-select:focus{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}
.dsh-warm-settings-source-list{display:flex;flex-direction:column;gap:8px;margin-top:4px}
.dsh-warm-settings-source{display:grid;grid-template-columns:minmax(0,1fr) minmax(150px,220px);gap:12px;align-items:center;padding:10px 12px;border:1px solid var(--dsw-alias-border-l2);border-radius:10px}
.dsh-warm-settings-source-name{display:block;font-size:13px;line-height:20px;color:var(--dsw-alias-label-primary);overflow-wrap:anywhere}
.dsh-warm-settings-select{width:100%;padding:8px 10px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font:inherit;font-size:13px}
.dsh-warm-settings-footer{display:flex;align-items:center;justify-content:flex-end;gap:8px;padding-top:4px}
.dsh-warm-settings-revision{margin-right:auto}
.dsh-warm-settings-button{padding:8px 14px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;cursor:pointer}
.dsh-warm-settings-button-primary{border-color:var(--dsw-alias-brand-primary);background:var(--dsw-alias-brand-primary);color:white}
.dsh-warm-settings-button:disabled,.dsh-warm-settings-textarea:disabled,.dsh-warm-settings-select:disabled{cursor:not-allowed;opacity:.5}
@media(max-width:680px){.dsh-warm-settings-source{grid-template-columns:1fr}.dsh-warm-settings-footer{flex-wrap:wrap}.dsh-warm-settings-revision{width:100%;margin-right:0}}
`

/**
 * Install the package stylesheet for the owning browser plugin lifetime.
 * @param ctx - owning Client plugin context.
 */
export function installStyles(ctx: ClientContext): void {
  if (typeof document === 'undefined') return
  ctx.effect(() => {
    const tag = document.createElement('style')
    tag.dataset.plugin = PLUGIN_ID
    tag.textContent = CSS
    document.head.appendChild(tag)
    return () => { tag.remove() }
  }, 'dsh-warm-minimal: settings card stylesheet')
}
