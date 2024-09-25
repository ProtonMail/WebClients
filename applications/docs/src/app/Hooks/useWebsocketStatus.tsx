import { useEffect, useRef, useState } from 'react'
import { useApplication } from '../Containers/ApplicationProvider'
import { mergeRegister } from '@lexical/utils'
import type { WebsocketConnectionEventPayloads, WebsocketConnectionEventStatusChange } from '@proton/docs-core'
import { WebsocketConnectionEvent } from '@proton/docs-core'
import type { NodeMeta } from '@proton/drive-store'
import { areNodeMetasEqual } from '@proton/drive-store/lib/interface'
import type { ConnectionCloseReason } from '@proton/docs-proto'

type WebsocketStatus = {
  state?: WebsocketConnectionEventStatusChange
  saving?: boolean
  disconnectReason?: ConnectionCloseReason
  hasConcerningMessages?: boolean
  hasErroredMessages?: boolean
}

/**
 * Number of ms a "Saving..." status should be shown at minimum, to prevent fast-paced/jarring switching
 * from Saving to Saved and back.
 */
const MINIMUM_DURATION_SAVING_MUST_BE_SHOWN = 1000

export function useWebSocketStatus(document?: NodeMeta) {
  const application = useApplication()

  const [currentStatus, setCurrentStatus] = useState<WebsocketStatus>({})

  const savingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const [saveStartTime, setSaveStartTime] = useState(0)

  useEffect(() => {
    const disposer = mergeRegister(
      application.eventBus.addEventCallback(
        (payload: WebsocketConnectionEventPayloads[WebsocketConnectionEvent.ConnectedAndReady]) => {
          if (!document || areNodeMetasEqual(document, payload.document)) {
            setCurrentStatus({ state: WebsocketConnectionEvent.ConnectedAndReady })
          }
        },
        WebsocketConnectionEvent.ConnectedAndReady,
      ),

      application.eventBus.addEventCallback(
        (payload: WebsocketConnectionEventPayloads[WebsocketConnectionEvent.Connecting]) => {
          if (!document || areNodeMetasEqual(document, payload.document)) {
            setCurrentStatus({ state: WebsocketConnectionEvent.Connecting })
          }
        },
        WebsocketConnectionEvent.Connecting,
      ),

      application.eventBus.addEventCallback(
        (payload: WebsocketConnectionEventPayloads[WebsocketConnectionEvent.Disconnected]) => {
          if (!document || areNodeMetasEqual(document, payload.document)) {
            setCurrentStatus({
              state: WebsocketConnectionEvent.Disconnected,
              disconnectReason: payload.serverReason,
              saving: false,
            })
          }
        },
        WebsocketConnectionEvent.Disconnected,
      ),

      application.eventBus.addEventCallback(
        (payload: WebsocketConnectionEventPayloads[WebsocketConnectionEvent.FailedToConnect]) => {
          if (!document || areNodeMetasEqual(document, payload.document)) {
            setCurrentStatus({
              state: WebsocketConnectionEvent.FailedToConnect,
              disconnectReason: payload.serverReason,
              saving: false,
            })
          }
        },
        WebsocketConnectionEvent.FailedToConnect,
      ),

      application.eventBus.addEventCallback(
        (payload: WebsocketConnectionEventPayloads[WebsocketConnectionEvent.Saving]) => {
          if (!document || areNodeMetasEqual(document, payload.document)) {
            if (savingTimeoutRef.current) {
              clearTimeout(savingTimeoutRef.current)
            }
            setCurrentStatus({ ...currentStatus, saving: true })
            setSaveStartTime(Date.now())
          }
        },
        WebsocketConnectionEvent.Saving,
      ),

      application.eventBus.addEventCallback(
        (payload: WebsocketConnectionEventPayloads[WebsocketConnectionEvent.Saved]) => {
          if (!document || areNodeMetasEqual(document, payload.document)) {
            const elapsedTime = Date.now() - saveStartTime
            const remainingTime = Math.max(0, MINIMUM_DURATION_SAVING_MUST_BE_SHOWN - elapsedTime)
            savingTimeoutRef.current = setTimeout(() => {
              setCurrentStatus({ ...currentStatus, saving: false })
            }, remainingTime)
          }
        },
        WebsocketConnectionEvent.Saved,
      ),

      application.eventBus.addEventCallback(
        (payload: WebsocketConnectionEventPayloads[WebsocketConnectionEvent.AckStatusChange]) => {
          const hasErrored = payload.ledger.hasErroredMessages()

          setCurrentStatus({
            ...currentStatus,
            hasConcerningMessages: payload.ledger.hasConcerningMessages(),
            hasErroredMessages: payload.ledger.hasErroredMessages(),
            saving: hasErrored ? false : currentStatus.saving,
          })
        },
        WebsocketConnectionEvent.AckStatusChange,
      ),
    )

    return disposer
  }, [application.eventBus, document, currentStatus, saveStartTime])

  return currentStatus
}
