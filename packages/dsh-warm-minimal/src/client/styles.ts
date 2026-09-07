/** Package-owned browser styles; the out-of-tree bundle has no CSS sidecar. */

import type { Context as ClientContext } from '@deepseek-ai/cordis'

const PLUGIN_ID = 'dsh-warm-minimal'

const CSS = `
.dsh-warm-settings-card{list-style:none;display:flex;align-items:center;gap:16px;min-width:0;padding:16px;border:1px solid var(--dsw-alias-border-l2);border-radius:16px;background:var(--dsw-alias-bg-layer-1)}
.dsh-warm-settings-card-main{display:flex;flex:1;min-width:0;flex-direction:column;gap:10px}
.dsh-warm-settings-heading{display:flex;min-width:0;flex-direction:column;gap:3px}
.dsh-warm-settings-title{font-size:15px;font-weight:600;line-height:22px;color:var(--dsw-alias-label-primary)}
.dsh-warm-settings-description,.dsh-warm-settings-hint,.dsh-warm-settings-revision,.dsh-warm-settings-tool-preview{font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary)}
.dsh-warm-settings-card-summaries{display:flex;flex-wrap:wrap;gap:6px}
.dsh-warm-settings-card-summaries>span{padding:2px 8px;border-radius:999px;background:var(--dsw-alias-bg-layer-2);font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary)}
.dsh-warm-settings-card-summaries>.dsh-warm-settings-badge{color:var(--dsw-alias-brand-primary);background:color-mix(in srgb,var(--dsw-alias-brand-primary) 10%,transparent)}
.dsh-warm-settings-card-summaries>.dsh-warm-settings-error-badge{color:var(--dsw-alias-state-error-primary);background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 10%,transparent)}
.dsh-warm-settings-open{flex:none;white-space:nowrap}
.dsh-warm-settings-modal.dsh-warm-settings-modal{width:min(1120px,100%);height:min(900px,calc(100vh - 48px));max-height:calc(100vh - 48px)}
.dsh-warm-settings-modal-content{min-height:0;overflow-y:auto;overscroll-behavior:contain}
.dsh-warm-settings-modal-layout{display:flex;min-width:0;flex-direction:column;gap:14px;padding-bottom:4px}
.dsh-warm-settings-status{display:flex;align-items:center;justify-content:space-between;gap:12px;color:var(--dsw-alias-label-secondary)}
.dsh-warm-settings-alert{padding:10px 12px;border-radius:10px;background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 10%,transparent);color:var(--dsw-alias-state-error-primary);font-size:13px;line-height:20px}
.dsh-warm-settings-bootstrap{display:flex;flex-direction:column;gap:12px;padding:14px;border:1px solid var(--dsw-alias-border-l2);border-radius:12px}
.dsh-warm-settings-section-heading{display:flex;align-items:baseline;gap:10px;min-width:0}
.dsh-warm-settings-section-heading h3{margin:0;font-size:14px;line-height:22px;color:var(--dsw-alias-label-primary)}
.dsh-warm-settings-check{display:flex;align-items:flex-start;gap:8px;font-size:13px;color:var(--dsw-alias-label-primary)}
.dsh-warm-settings-check>input{margin-top:3px}
.dsh-warm-settings-check>span{display:flex;flex-direction:column;gap:1px}
.dsh-warm-settings-check small{font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary)}
.dsh-warm-settings-bootstrap-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.dsh-warm-settings-field{display:flex;min-width:0;flex-direction:column;gap:5px}
.dsh-warm-settings-label{font-size:13px;font-weight:500;line-height:20px;color:var(--dsw-alias-label-primary)}
.dsh-warm-settings-textarea{box-sizing:border-box;width:100%;min-height:76px;resize:vertical;padding:9px 10px;border:1px solid var(--dsw-alias-border-l2);border-radius:9px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;line-height:19px}
.dsh-warm-settings-textarea:focus,.dsh-warm-settings-button:focus-visible,.dsh-warm-settings-source-disclosure:focus-visible,.dsh-warm-settings-source-section-summary:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.dsh-warm-settings-source-sections{display:flex;min-width:0;flex-direction:column;gap:10px}
.dsh-warm-settings-source-section{min-width:0;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-alias-bg-layer-1);overflow:hidden}
.dsh-warm-settings-source-section-summary{display:flex;align-items:center;justify-content:space-between;gap:16px;min-width:0;padding:12px 14px;cursor:pointer;color:var(--dsw-alias-label-primary)}
.dsh-warm-settings-source-section-summary::marker{color:var(--dsw-alias-label-secondary)}
.dsh-warm-settings-source-section-title{display:flex;align-items:baseline;gap:8px;min-width:0}
.dsh-warm-settings-source-section-title strong{font-size:14px;line-height:22px}
.dsh-warm-settings-source-section-title span,.dsh-warm-settings-assignment-summary{font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary)}
.dsh-warm-settings-assignment-summary{flex:none}
.dsh-warm-settings-source-section-body{display:flex;min-width:0;flex-direction:column;gap:8px;padding:0 12px 12px;border-top:1px solid var(--dsw-alias-border-l2)}
.dsh-warm-settings-source-section-body>.dsh-warm-settings-hint{margin:8px 2px 0}
.dsh-warm-settings-source-list{display:flex;min-width:0;flex-direction:column;gap:6px}
.dsh-warm-settings-empty{padding:10px;color:var(--dsw-alias-label-secondary);font-size:13px;text-align:center}
.dsh-warm-settings-source{min-width:0;border:1px solid var(--dsw-alias-border-l2);border-radius:9px;background:var(--dsw-alias-bg-base);overflow:hidden}
.dsh-warm-settings-source-main{display:grid;grid-template-columns:minmax(0,1fr) minmax(330px,390px);align-items:stretch;min-width:0}
.dsh-warm-settings-source-disclosure{display:flex;align-items:center;gap:8px;min-width:0;padding:8px 10px;border:0;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;text-align:left;cursor:pointer}
.dsh-warm-settings-source-chevron{flex:none;font-size:18px;line-height:18px;color:var(--dsw-alias-label-secondary);transition:transform .15s ease}
.dsh-warm-settings-source-chevron[data-open=true]{transform:rotate(90deg)}
.dsh-warm-settings-source-copy{display:flex;min-width:0;flex:1;flex-direction:column;gap:1px}
.dsh-warm-settings-contribution-line{display:flex;gap:6px;min-width:0;font-size:13px;line-height:19px}
.dsh-warm-settings-contribution-line>span:last-child,.dsh-warm-settings-tool-name,.dsh-warm-settings-tool-preview{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsh-warm-settings-contribution-kind{flex:none;color:var(--dsw-alias-label-secondary)}
.dsh-warm-settings-tool-name{font-size:13px;font-weight:600;line-height:19px;color:var(--dsw-alias-label-primary)}
.dsh-warm-settings-segments{display:flex;min-width:0;margin:7px 8px;padding:0;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;overflow:hidden}
.dsh-warm-settings-segment{position:relative;display:flex;flex:1 1 0;align-items:center;justify-content:center;min-width:0;padding:7px 6px;border-left:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px;text-align:center;cursor:pointer}
.dsh-warm-settings-segment:first-of-type{border-left:0}
.dsh-warm-settings-segment[data-checked=true]{background:color-mix(in srgb,var(--dsw-alias-brand-primary) 12%,transparent);color:var(--dsw-alias-brand-primary);font-weight:500}
.dsh-warm-settings-segment:focus-within{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}
.dsh-warm-settings-segment input{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none}
.dsh-warm-settings-segments:disabled .dsh-warm-settings-segment{cursor:not-allowed;opacity:.5}
.dsh-warm-settings-source-detail{display:flex;min-width:0;flex-direction:column;gap:8px;padding:9px 12px;border-top:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary)}
.dsh-warm-settings-detail-source{display:flex;gap:8px;min-width:0}
.dsh-warm-settings-detail-source code{min-width:0;overflow-wrap:anywhere}
.dsh-warm-settings-prompt-details{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.dsh-warm-settings-prompt-details>div{display:flex;flex-direction:column;gap:3px}
.dsh-warm-settings-prompt-details ul{margin:0;padding-left:18px}
.dsh-warm-settings-tool-details{display:flex;flex-direction:column;gap:6px}
.dsh-warm-settings-tool-detail{display:grid;grid-template-columns:minmax(100px,180px) minmax(0,1fr);gap:10px}
.dsh-warm-settings-tool-detail span{overflow-wrap:anywhere}
.dsh-warm-settings-footer{position:sticky;bottom:-4px;z-index:1;display:flex;align-items:center;justify-content:flex-end;gap:8px;margin-top:2px;padding:10px 0 4px;background:var(--dsw-alias-bg-layer-1)}
.dsh-warm-settings-revision{margin-right:auto}
.dsh-warm-settings-button{padding:8px 14px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;line-height:20px;cursor:pointer}
.dsh-warm-settings-button-primary{border-color:var(--dsw-alias-brand-primary);background:var(--dsw-alias-brand-primary);color:white}
.dsh-warm-settings-button:disabled,.dsh-warm-settings-textarea:disabled,.dsh-warm-settings-check>input:disabled{cursor:not-allowed;opacity:.5}
.dsh-warm-settings-sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
@media(max-width:760px){.dsh-warm-settings-card{align-items:stretch;flex-direction:column}.dsh-warm-settings-open{align-self:flex-start}.dsh-warm-settings-modal.dsh-warm-settings-modal{width:100%;height:calc(100vh - 48px);max-height:calc(100vh - 48px)}.dsh-warm-settings-bootstrap-fields,.dsh-warm-settings-prompt-details{grid-template-columns:1fr}.dsh-warm-settings-source-section-summary{align-items:flex-start;flex-direction:column;gap:3px}.dsh-warm-settings-source-main{grid-template-columns:1fr}.dsh-warm-settings-segments{margin-top:0}.dsh-warm-settings-tool-detail{grid-template-columns:1fr;gap:1px}.dsh-warm-settings-footer{flex-wrap:wrap}.dsh-warm-settings-revision{width:100%;margin-right:0}}
@media(max-width:440px){.dsh-warm-settings-section-heading,.dsh-warm-settings-source-section-title{align-items:flex-start;flex-direction:column;gap:1px}.dsh-warm-settings-card-summaries{gap:4px}.dsh-warm-settings-segment{padding-inline:3px;font-size:11px}.dsh-warm-settings-footer .dsh-warm-settings-button{flex:1 1 0;padding-inline:8px}}
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
