import { useEffect } from 'react'

import { useNotifications } from '@proton/app-context/useNotifications'
import type { Refusal } from '@proton-docs/realtime-sdk'
import { c } from 'ttag'

import { useApplication } from '~/utils/application-context'
import type { DocumentSession } from './loadDocument'

/** No toast for `documentSizeLimitReached`: the size-limit modal says it */
const refusalMessages: Record<Exclude<Refusal['reason'], 'documentSizeLimitReached'>, () => string> = {
  updateTooLarge: () =>
    c('Error').t`Your last change is too large to save, so editing is disabled. Copy any work you need, then reload.`,
  incompleteBaseState: () => c('Error').t`Some of the document could not be read, so your changes can't be saved.`,
}

/**
 * Tells the user about the edits the SDK refuses, discards or can't read. The Loader locks the editor for them
 * (`loadDocument.ts`).
 */
export function useSessionNotices(session: DocumentSession | undefined) {
  const { logger } = useApplication()
  const { createNotification } = useNotifications()

  useEffect(() => {
    if (!session) {
      return
    }

    const removeListeners = [
      session.on('refusal', (refusal) => {
        logger.warn('Edit refused by the realtime SDK', refusal)
        if (refusal.reason !== 'documentSizeLimitReached') {
          createNotification({ type: 'error', text: refusalMessages[refusal.reason]() })
        }
      }),
      // The SDK fails `delivery` for the rest of the session in the same step, which locks the editor
      session.on('invalidation', (invalidation) => {
        logger.error('Edit discarded by the realtime SDK', invalidation)
        createNotification({
          type: 'error',
          text: c('Error')
            .t`Some of your recent changes could not be saved, so editing is disabled. Copy any work you need, then reload.`,
        })
      }),
      // The Loader logs each one. A 'baseState' one comes with a commit that turns `editing` to
      // `incompleteBaseState`, which locks the editor until a fully readable commit replaces it.
      session.on('updateUnreadable', ({ origin }) => {
        createNotification({
          type: 'warning',
          text:
            origin === 'live'
              ? c('Warning').t`A change from another editor could not be read and is missing from this page.`
              : c('Warning').t`Some of the document could not be read, so editing is disabled.`,
        })
      }),
    ]

    return () => removeListeners.forEach((removeListener) => removeListener())
  }, [createNotification, logger, session])
}
