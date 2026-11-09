import { useCallback, useEffect, useRef } from 'react'

import { EventTypeEnum } from '@proton/docs-proto/Event/EventTypeEnum'
import type { Session } from '@proton-docs/realtime-sdk'

import { useApplication } from '~/utils/application-context'

import type { EditorInvoker } from './EditorInvoker'
import { type PeerClocks, encodeParticipantsForEditor, findEditorPresence } from './presenceBridge'

/**
 * Bridges presence between the editor's awareness and `session`, once the editor gives its client id: the editor's own
 * entry in each awareness update it broadcasts becomes the session's presence when it changes, and the session's
 * participants go to the editor as awareness updates. Returns where the editor's broadcasts go; until the editor gives
 * its id, the newest one waits. A new editor starts with fresh clocks, as its awareness does, and a new invoker for the
 * same editor goes on from the clocks that editor holds.
 */
export function usePresenceBridge(
  session: Session | undefined,
  editorInvoker: Pick<EditorInvoker, 'getClientId' | 'receiveMessage'> | undefined,
): (update: Uint8Array<ArrayBuffer>) => void {
  const { logger } = useApplication()
  const takeEditorPresence = useRef<(update: Uint8Array<ArrayBuffer>) => void>(undefined)
  const waitingUpdate = useRef<Uint8Array<ArrayBuffer>>(undefined)
  const fed = useRef<{ editorClientId: number; clocks: PeerClocks }>(undefined)

  useEffect(() => {
    if (!session || !editorInvoker) {
      return
    }

    let stopped = false
    let unsubscribe = () => {}

    editorInvoker.getClientId().then(
      (editorClientId) => {
        if (stopped) {
          return
        }

        let ownState: string | undefined
        takeEditorPresence.current = (update) => {
          try {
            const own = findEditorPresence(update, editorClientId)
            const json = own && JSON.stringify(own.state)
            if (own && json !== ownState) {
              session.setPresence(own.state)
              ownState = json
            }
          } catch (error) {
            // Its message only: the cause of a JSON error quotes the state
            logger.warn('Failed to read the editor presence', { error: String(error) })
          }
        }

        let clocks: PeerClocks = fed.current?.editorClientId === editorClientId ? fed.current.clocks : new Map()
        const feedEditor = () => {
          const next = encodeParticipantsForEditor(clocks, session.getSnapshot().participants, editorClientId)
          clocks = next.clocks
          fed.current = { editorClientId, clocks }
          if (next.update) {
            editorInvoker
              .receiveMessage({
                type: { wrapper: 'events', eventType: EventTypeEnum.ClientIsBroadcastingItsPresenceState },
                content: next.update,
              })
              .catch((error) => !stopped && logger.warn('Failed to give the editor the participants', error))
          }
        }
        unsubscribe = session.subscribe(feedEditor)
        feedEditor()

        const waiting = waitingUpdate.current
        waitingUpdate.current = undefined
        if (waiting) {
          takeEditorPresence.current(waiting)
        }
      },
      (error) => !stopped && logger.warn('Failed to get the editor client id for presence', error),
    )

    return () => {
      stopped = true
      unsubscribe()
      takeEditorPresence.current = undefined
      waitingUpdate.current = undefined
    }
  }, [editorInvoker, logger, session])

  return useCallback((update) => {
    if (takeEditorPresence.current) {
      takeEditorPresence.current(update)
    } else {
      waitingUpdate.current = update
    }
  }, [])
}
