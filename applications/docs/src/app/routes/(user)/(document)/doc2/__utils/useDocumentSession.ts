import { useEffect, useState } from 'react'

import { type NodeEntity, generateNodeUid, getDrive } from '@proton/drive/sdk'
import { isDevOrBlack } from '@proton/shared/lib/env'
import { isProtonDocsDocument } from '@proton/shared/lib/helpers/mimetype'
import type { PrivateNodeMeta, Session } from '@proton-docs/realtime-sdk'

import { useApplication } from '~/utils/application-context'

import { type BootstrapFailure, classifyBootstrapError } from './classifyBootstrapError'
import { type DocumentRole, getDocumentRole } from './getDocumentRole'
import { DocsLoadMark, markDocsLoad } from './loadMarks'
import type { useRealtimeClient } from './useRealtimeClient'

export type DocumentSessionState =
  | { status: 'loading' }
  | {
      status: 'ready'
      session: Session
      role: DocumentRole
      node: NodeEntity
      /** How many times the role was read, so that a re-read applies the editor lock again even when it is unchanged */
      roleReads: number
    }
  /** In the trash: RTS refuses a trashed document a token, so no session opens until it is restored */
  | { status: 'trashed'; role: DocumentRole; node: NodeEntity }
  | { status: 'failed'; reason: 'unsupported' | 'unreadableUpdate' | BootstrapFailure }

/**
 * Bootstraps a session for the text document `nodeMeta`, with the user's role on it and its Drive node, under an abort signal tied to
 * the hook's lifetime. On unmount it removes its listeners and disconnects the session, once bootstrapped if it was
 * still bootstrapping.
 * A base state with an unreadable update fails, since showing the rest would pass an incomplete document as whole.
 * A document in the trash bootstraps nothing: it reads `trashed`, with its role and node.
 * A failed bootstrap says why, by `classifyBootstrapError`.
 * The role is read again after each rebootstrap, when the status leaves `opening` after the first ready, since the
 * SDK rebootstraps when the user's access changes. Only the latest read counts, and one that fails keeps the role.
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
      if (node.trashTime) {
        logger.info('Document is in trash, opening no session')
        setState({ status: 'trashed', role: getDocumentRole(hierarchy), node })
        return
      }

      const pending = client.createSession({
        documentType: 'doc',
        nodeMeta: { volumeId, linkId },
        // As /doc squashes on dev and black (GetCommitDULimit in packages/docs-core/lib/Types/SquashingConstants.ts).
        ...(isDevOrBlack() && { commitDuLimit: 50 }),
      })
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
      markDocsLoad(DocsLoadMark.DocumentLoaded)
      setState({ status: 'ready', session, role: getDocumentRole(hierarchy), node, roleReads: 1 })
      removeListeners.push(rereadRoleAfterRebootstraps(bootstrapped, nodeUid))
    }

    function rereadRoleAfterRebootstraps(session: Session, nodeUid: string): () => void {
      let rebootstrapping = session.getSnapshot().status.name === 'opening'
      let latestRead = 0

      return session.subscribe(({ status }) => {
        if (status.name === 'opening') {
          rebootstrapping = true
          return
        }
        if (!rebootstrapping) {
          return
        }
        rebootstrapping = false
        const read = ++latestRead
        getDrive()
          .getNodeHierarchy(nodeUid)
          .then(
            (hierarchy) => {
              if (signal.aborted || read !== latestRead) {
                return
              }
              const role = getDocumentRole(hierarchy)
              logger.info('Read the role again after a rebootstrap', { role })
              setState((state) =>
                state.status === 'ready' && state.session === session
                  ? { ...state, role, roleReads: state.roleReads + 1 }
                  : state,
              )
            },
            (error) => {
              if (!signal.aborted) {
                logger.warn('Failed to read the role again after a rebootstrap', error)
              }
            },
          )
      })
    }

    bootstrap().catch((error) => {
      if (signal.aborted) {
        return
      }
      logger.error('Failed to bootstrap the document session', error)
      setState({ status: 'failed', reason: classifyBootstrapError(error) })
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
