import { useCallback } from 'react'
import { c } from 'ttag'

import useAuthentication from '@proton/components/hooks/useAuthentication'
import { getAppHref } from '@proton/shared/lib/apps/helper'
import { APPS } from '@proton/shared/lib/constants'
import { useNotifications } from '@proton/app-context/useNotifications'

import { useApplication } from '~/utils/application-context'
import { DOCUMENT_V2_PATH } from '~/utils/docs-url-bar'

// Adapted from `applications/docs/src/app/components/document/public/utils.ts`, its copy handover, which reads
// docs-core's editor controller and document state: the name and the state come in as functions, and the copy window
// is `/doc2?mode=copy-public`.

/**
 * To copy a public document, the public context (the opener) will open a new window (the child/copier) to
 * something like docs.proton.x/doc2?mode=copy-public. Once the child is ready to receive data from the opener, it will
 * post a CopierReady event. The opener will listen for this event and respond back with DataForCopying.
 *
 * The copier will receive this data and create a new document with this data.
 *
 * The reason we need to open a new tab to create a copy is that the opening tab is a public context app which
 * doesn't have access to the private API. So to create a copy, we need to open a new tab to the private context.
 * Then, we give the private context the data to create a copy.
 */
export type PublicDocumentPostMessageEvent = 'public-copier-ready' | 'data-for-copying'

export type PublicDocumentPostMessageDataForCopying = {
  name: string
  yjsData: Uint8Array<ArrayBuffer>
}

// Copied from `applications/docs/src/app/routes/(user)/(document)/doc/__components/PublicDocumentCopier.tsx`, its error
export function getCopyFailedMessage(): string {
  return c('Error').t`An error occurred while attempting to duplicate the document. Please try again.`
}

/** The Docs app's origin, the only one the handover talks to */
export function getDocsOrigin(): string {
  return new URL(getAppHref('/', APPS.PROTONDOCS)).origin
}

/** `/doc2?mode=copy-public`, the copy window, under the visitor's local id */
export function getCopierUrl(localID: number | undefined): string {
  const url = new URL(getAppHref(DOCUMENT_V2_PATH, APPS.PROTONDOCS, localID))
  url.searchParams.set('mode', 'copy-public')
  return url.toString()
}

/**
 * The public page's side of Create a copy: opens the copy window, and answers its ready message with the document's
 * name and state, sent only to the Docs app's origin.
 */
export function usePublicDocumentCopying({
  getName,
  getState,
}: {
  getName: () => string
  getState: () => Promise<Uint8Array<ArrayBuffer>>
}) {
  const { getLocalID } = useAuthentication()
  const { logger } = useApplication()
  const { createNotification } = useNotifications()

  return useCallback(() => {
    // Opened straight at its URL, on the click. A blocked popup leaves this page as it is: the copier must be another
    // window, whose opener this page is.
    const handle = window.open(getCopierUrl(getLocalID()), '_blank')
    if (!handle) {
      logger.warn('The copy window was blocked')
      createNotification({
        type: 'error',
        text: getCopyFailedMessage(),
      })
      return
    }
    const handleCopierMessage = async (event: MessageEvent) => {
      if (event.source !== handle || event.origin !== getDocsOrigin()) {
        return
      }
      if (event.data?.type === ('public-copier-ready' satisfies PublicDocumentPostMessageEvent)) {
        window.removeEventListener('message', handleCopierMessage)
        try {
          const doc: PublicDocumentPostMessageDataForCopying = { yjsData: await getState(), name: getName() }
          handle.postMessage(
            { type: 'data-for-copying' satisfies PublicDocumentPostMessageEvent, doc },
            getAppHref('/', APPS.PROTONDOCS),
          )
        } catch (error) {
          // The copy window would wait for ever
          logger.error('Failed to hand the document to the copy window', error as Error)
          handle.close()
        }
      }
    }
    window.addEventListener('message', handleCopierMessage)
  }, [createNotification, getLocalID, getName, getState, logger])
}
