/** Browser half: a warm-minimal card on the official Plugins settings page. */

import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-api-remotes/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings-plugins/client'
import warmMinimalRemote from 'dsh-warm-minimal/remote'
import { WarmMinimalCard, type WarmMinimalCardFace } from './WarmMinimalCard.tsx'
import { decodeWarmMinimalSettings } from './contract.ts'
import { WarmMinimalCardController } from './controller.ts'
import { en, zh, type WarmMinimalLocaleKey } from './locales.ts'
import { installStyles } from './styles.ts'

export type {
  AssignedSource, InventorySource, SourceAssignment, WarmMinimalSettings,
} from './contract.ts'
export type {
  WarmMinimalCardObservable, WarmMinimalCardView, WarmMinimalInventoryRemote,
} from './controller.ts'
export type { WarmMinimalCardFace, WarmMinimalCardProps } from './WarmMinimalCard.tsx'

/** Host settings namespace and keyed Plugins-card dispatch value. */
export const WARM_MINIMAL_SETTINGS_NAMESPACE = 'warm-minimal'

/** Browser locale namespace. */
export const WARM_MINIMAL_LOCALE_NAMESPACE = 'warm-minimal.settings'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Warm-minimal Plugins-card copy. */
    'warm-minimal.settings': WarmMinimalLocaleKey
  }
}

/** Services required to mount the generated Remote and official settings scope. */
export const inject = ['slots', 'locale', 'remote', 'settingsScope']

/**
 * Mount the read-only inventory Remote and register the namespace-keyed card.
 * @param ctx - browser Client plugin context.
 */
export async function apply(ctx: ClientContext): Promise<void> {
  await ctx.effect(
    () => ctx.remote.$mount(warmMinimalRemote),
    'dsh-warm-minimal: generated inventory Remote contribution',
  )
  ctx.effect(
    () => ctx.locale.register(WARM_MINIMAL_LOCALE_NAMESPACE, { zh, en }),
    'dsh-warm-minimal: settings dictionaries',
  )
  installStyles(ctx)

  ctx.inject(['remote.warmMinimal'], (remoteCtx) => {
    const scope = remoteCtx.settingsScope.bind({
      namespace: WARM_MINIMAL_SETTINGS_NAMESPACE,
      decode: decodeWarmMinimalSettings,
    })
    const controller = new WarmMinimalCardController(scope, remoteCtx.remote.warmMinimal)
    ctx.effect(() => () => { controller.dispose() }, 'dsh-warm-minimal: settings controller')

    const face = (): WarmMinimalCardFace => ({
      hooks: { warmMinimalCard: controller },
      setBootstrapEnabled: enabled => { controller.setBootstrapEnabled(enabled) },
      setBootstrapMessage: message => { controller.setBootstrapMessage(message) },
      setGuidance: guidance => { controller.setGuidance(guidance) },
      assign: (list, source, assignment) => { controller.assign(list, source, assignment) },
      discard: () => { controller.discard() },
      reloadInventory: () => { void controller.loadInventory() },
      save: () => { void controller.save() },
    })

    ctx.slots.inject('settings.plugin.item', () => ctx.slots.register({
      name: 'settings.plugin.item',
      key: WARM_MINIMAL_SETTINGS_NAMESPACE,
      locale: WARM_MINIMAL_LOCALE_NAMESPACE,
      inject: face,
    }, WarmMinimalCard))

    void controller.loadInventory()
  })
}
