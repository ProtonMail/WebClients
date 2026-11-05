import { useEffect, useState } from 'react'

import { generateNodeUid, getDrive } from '@proton/drive/sdk'
import { isProtonDocsDocument } from '@proton/shared/lib/helpers/mimetype'
import type { PrivateNodeMeta, Session } from '@proton-docs/realtime-sdk'

import { useApplication } from '~/utils/application-context'

import { type DocumentRole, getDocumentRole } from './getDocumentRole'
import type { useRealtimeClient } from './useRealtimeClient'

export type DocumentSessionState =
  | { status: 'loading' }
  | { status: 'ready'; session: Session; role: DocumentRole }
  | { status: 'failed'; reason: 'unsupported' | 'bootstrapFailed' | 'unreadableUpdate' }

/**
 * Bootstraps a session for the text document `nodeMeta`, with the user's role on it, under an abort signal tied to
 * the hook's lifetime. On unmount it removes its listeners and disconnects the session, once bootstrapped if it was
 * still bootstrapping.
 * A base state with an unreadable update fails, since showing the rest would pass an incomplete document as whole.
 */
export function useDocumentSession(
  client: ReturnType<typeof useRealtimeClient>,
  { volumeId, linkId }: PrivateNodeMeta,
): DocumentSessionState {
  const { logger } = useApplication()
  const [state, setState] = useState<DocumentSessionState>({ status: 'loading' })

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller
    const removeListeners: (() => void)[] = []
    let session: Session | undefined

    const removeAllListeners = () => removeListeners.splice(0).forEach((removeListener) => removeListener())
    const disconnect = (session: Session) => {
      session.disconnect().catch((error) => logger.warn('Failed to disconnect the document session', error))
    }

    async function bootstrap() {
      const nodeUid = generateNodeUid(volumeId, linkId)
      const [node, hierarchy] = await Promise.all([getDrive().getNode(nodeUid), getDrive().getNodeHierarchy(nodeUid)])
      if (signal.aborted) {
        return
      }
      if (!isProtonDocsDocument(node.mediaType ?? '')) {
        logger.info('Node is not a text document', { mediaType: node.mediaType })
        setState({ status: 'failed', reason: 'unsupported' })
        return
      }

      const pending = client.createSession({ documentType: 'doc', nodeMeta: { volumeId, linkId } })
      const unreadableBaseStateUuids: string[] = []
      removeListeners.push(
        pending.on('updateUnreadable', ({ uuid, origin }) => {
          if (origin === 'baseState') {
            logger.error('Base state DU could not be read', { uuid, origin })
            unreadableBaseStateUuids.push(uuid)
            return
          }
          logger.warn('Live DU could not be read', { uuid, origin })
        }),
      )

      const bootstrapped = await pending.bootstrap()
      if (signal.aborted) {
        disconnect(bootstrapped)
        return
      }
      if (unreadableBaseStateUuids.length > 0) {
        removeAllListeners()
        disconnect(bootstrapped)
        setState({ status: 'failed', reason: 'unreadableUpdate' })
        return
      }
      session = bootstrapped
      setState({ status: 'ready', session, role: getDocumentRole(hierarchy) })
    }

    bootstrap().catch((error) => {
      if (signal.aborted) {
        return
      }
      logger.error('Failed to bootstrap the document session', error)
      setState({ status: 'failed', reason: 'bootstrapFailed' })
    })

    return () => {
      controller.abort()
      removeAllListeners()
      if (session) {
        disconnect(session)
      }
    }
  }, [client, logger, volumeId, linkId])

  return state
}
