import { useEffect, useState, useSyncExternalStore } from 'react'

import { useNotifications } from '@proton/app-context/useNotifications'
import { DocUpdateOrigin } from '@proton/docs-shared/Doc/DocState'
import type { Refusal, Session, SessionSnapshot } from '@proton-docs/realtime-sdk'
import { c } from 'ttag'

import { useApplication } from '~/utils/application-context'

import type { EditorInvoker } from './EditorInvoker'
import type { DocumentRole } from './getDocumentRole'

const refusalMessages: Record<Refusal['reason'], () => string> = {
  updateTooLarge: () =>
    c('Error').t`Your last change is too large to save, so editing is disabled. Copy any work you need, then reload.`,
  documentSizeLimitReached: () =>
    c('Error')
      .t`This document has reached its maximum size, so your last change was not saved and editing is disabled.`,
  incompleteBaseState: () => c('Error').t`Some of the document could not be read, so your changes can't be saved.`,
}

export type LiveEditingOptions = {
  session: Session | undefined
  /** Undefined until the editor shows the base state */
  editorInvoker: Pick<EditorInvoker, 'receiveMessage' | 'changeLockedState'> | undefined
  role: DocumentRole
  onEditorError: (error: Error) => void
}

/**
 * Connects `session` once the editor shows its base state, and keeps the editor in step with it: updates from other
 * clients and replaced base states go to the editor, which stays locked unless the role can edit, the session allows
 * editing and it isn't paused. Tells the user about the edits the SDK refuses, discards or can't read, and locks the
 * editor for good after one is refused or discarded, since later edits would build on content the server lacks.
 * Returns the session's snapshot.
 */
export function useLiveEditing({
  session,
  editorInvoker,
  role,
  onEditorError,
}: LiveEditingOptions): SessionSnapshot | undefined {
  const { logger } = useApplication()
  const snapshot = useSyncExternalStore(session?.subscribe ?? subscribeToNothing, session?.getSnapshot ?? getNothing)
  const editRefused = useSessionNotices(session)

  useEffect(() => {
    if (!session || !editorInvoker) {
      return
    }

    const sendToEditor = (content: Uint8Array<ArrayBuffer>, origin?: DocUpdateOrigin) => {
      editorInvoker.receiveMessage({ type: { wrapper: 'du' }, content, origin }).catch(onEditorError)
    }
    const removeListeners = [
      session.on('update', ({ content }) => sendToEditor(content)),
      session.on('baseStateReplaced', ({ base }) => {
        logger.info('Merging a replaced base state into the editor', { updates: base.updates.length })
        base.updates.forEach(({ content }) => sendToEditor(content, DocUpdateOrigin.BaseCommit))
      }),
    ]

    // A connect that rejects has stopped the session, which the snapshot shows
    session.connect().catch((error) => logger.error('Failed to connect the document session', error))

    return () => removeListeners.forEach((removeListener) => removeListener())
  }, [editorInvoker, logger, onEditorError, session])

  const locked =
    role === 'Viewer' ||
    editRefused ||
    !snapshot?.editing.allowed ||
    snapshot.status.name === 'paused' ||
    snapshot.delivery === 'failed'

  useEffect(() => {
    editorInvoker?.changeLockedState(locked).catch(onEditorError)
  }, [editorInvoker, locked, onEditorError])

  return snapshot
}

/** Returns whether the SDK has refused an edit */
function useSessionNotices(session: Session | undefined): boolean {
  const { logger } = useApplication()
  const { createNotification } = useNotifications()
  const [editRefused, setEditRefused] = useState(false)

  useEffect(() => {
    if (!session) {
      return
    }

    const removeListeners = [
      session.on('refusal', (refusal) => {
        logger.warn('Edit refused by the realtime SDK', refusal)
        setEditRefused(true)
        createNotification({ type: 'error', text: refusalMessages[refusal.reason]() })
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
      // useDocumentSession logs each one. A 'baseState' one comes with a commit that turns `editing` to
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

  return editRefused
}

const subscribeToNothing = () => () => {}
const getNothing = () => undefined
