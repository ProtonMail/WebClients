import { Icon } from '@proton/components'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  WebsocketConnectionEvent,
  WebsocketConnectionEventPayloads,
  WebsocketConnectionEventStatusChange,
} from '@proton/docs-core'
import { useApplication } from '../../Containers/ApplicationProvider'
import { mergeRegister } from '@lexical/utils'
import { ConnectionCloseReason } from '@proton/docs-proto'
import { c } from 'ttag'
import { useGenericAlertModal } from '../Modals/GenericAlert'
import CloudIcon from '../../Icons/CloudIcon'
import ArrowsRotate from '../../Icons/ArrowsRotate'

/**
 * Number of ms a "Saving..." status should be shown at minimum, to prevent fast-paced/jarring switching
 * from Saving to Saved and back.
 */
const MINIMUM_DURATION_SAVING_MUST_BE_SHOWN = 1000

export const ConnectionStatus = () => {
  const application = useApplication()
  const [status, setStatus] = useState<WebsocketConnectionEventStatusChange>()
  const [disconnectReason, setDisconnectReason] = useState<ConnectionCloseReason>()
  const [hasConcerningMessages, setHasConcerningMessages] = useState(false)
  const [hasErroredMessages, setHasErroredMessages] = useState(false)
  const [genericAlertModal, showGenericAlertModal] = useGenericAlertModal()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveStartTime, setSaveStartTime] = useState(0)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return mergeRegister(
      application.eventBus.addEventCallback(() => {
        setStatus(WebsocketConnectionEvent.Connected)
      }, WebsocketConnectionEvent.Connected),
      application.eventBus.addEventCallback(() => {
        setStatus(WebsocketConnectionEvent.Connecting)
      }, WebsocketConnectionEvent.Connecting),
      application.eventBus.addEventCallback(
        (payload: WebsocketConnectionEventPayloads[WebsocketConnectionEvent.Disconnected]) => {
          setStatus(WebsocketConnectionEvent.Disconnected)
          setDisconnectReason(payload.serverReason)
        },
        WebsocketConnectionEvent.Disconnected,
      ),
      application.eventBus.addEventCallback(
        (payload: WebsocketConnectionEventPayloads[WebsocketConnectionEvent.FailedToConnect]) => {
          setStatus(WebsocketConnectionEvent.FailedToConnect)
          setDisconnectReason(payload.serverReason)
        },
        WebsocketConnectionEvent.FailedToConnect,
      ),
      application.eventBus.addEventCallback(
        (payload: WebsocketConnectionEventPayloads[WebsocketConnectionEvent.AckStatusChange]) => {
          setHasConcerningMessages(payload.ledger.hasConcerningMessages())
          setHasErroredMessages(payload.ledger.hasErroredMessages())
        },
        WebsocketConnectionEvent.AckStatusChange,
      ),
      application.eventBus.addEventCallback(() => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
        setSaving(true)
        setSaved(false)
        setSaveStartTime(Date.now())
      }, WebsocketConnectionEvent.Saving),
      application.eventBus.addEventCallback(() => {
        const elapsedTime = Date.now() - saveStartTime
        const remainingTime = Math.max(0, MINIMUM_DURATION_SAVING_MUST_BE_SHOWN - elapsedTime)
        timeoutRef.current = setTimeout(() => {
          setSaving(false)
          setSaved(true)
        }, remainingTime)
      }, WebsocketConnectionEvent.Saved),
    )
  }, [application.eventBus, saveStartTime])

  const showConcernedSyncAlert = useCallback(() => {
    showGenericAlertModal({
      title: c('Title').t`Some edits are taking longer to sync`,
      translatedMessage: c('Info')
        .t`Some edits are taking longer to sync than expected. This may be due to network issues. You may continue editing for now. If the issue persists, we'll show a stronger error message.`,
    })
  }, [showGenericAlertModal])

  const showErroredSyncAlert = useCallback(() => {
    showGenericAlertModal({
      title: c('Title').t`Some edits failed to sync`,
      translatedMessage: c('Info')
        .t`Recent edits to your document could not be saved. To ensure data safety, editing is temporarily disabled. Please download a copy of your document from the main menu. After you have done so, refresh the page to reconnect.`,
    })
  }, [showGenericAlertModal])

  const disconnectReasonMessage = disconnectReason ? disconnectReason?.props.message : ''

  let content = null
  if (status === WebsocketConnectionEvent.Connecting) {
    content = (
      <>
        <Icon name="arrow-rotate-right" className="animate-spin" />
        {c('Info').t`Connecting...`}
      </>
    )
  } else if (status === WebsocketConnectionEvent.Disconnected) {
    content = (
      <>
        <Icon name="exclamation-circle" />
        {c('Info').t`Disconnected: ${disconnectReasonMessage}`}
      </>
    )
  } else if (status === WebsocketConnectionEvent.FailedToConnect) {
    content = (
      <>
        <Icon name="exclamation-circle" />
        {c('Info').t`Failed to connect: ${disconnectReasonMessage}`}
      </>
    )
  }

  const isNotConnected =
    status === WebsocketConnectionEvent.FailedToConnect || status === WebsocketConnectionEvent.Disconnected

  return (
    <div className="flex select-none items-center gap-3">
      {content && (
        <>
          <div className="flex items-center gap-1 rounded-lg bg-weak px-2 py-1 text-xs text-[--text-weak]">
            {content}
          </div>
          {isNotConnected && (
            <div className="flex items-center gap-1 rounded-lg bg-weak px-2 py-1 text-xs text-[--text-weak]">
              {c('Info').t`Recent edits may not be displayed`}
            </div>
          )}
        </>
      )}
      {saving && (
        <div className="flex items-center gap-1 rounded-lg bg-weak px-2 py-1 text-xs text-[--text-weak]">
          <ArrowsRotate className="h-3.5 w-3.5 fill-current animate-spin" />
          {c('Info').t`Saving...`}
        </div>
      )}
      {saved && (
        <div className="flex items-center gap-1 rounded-lg bg-weak px-2 py-1 text-xs text-[--text-weak]">
          <CloudIcon className="h-4 w-4 fill-current" />
          {c('Info').t`Saved`}
        </div>
      )}
      {hasConcerningMessages && (
        <button
          className="flex items-center gap-1 rounded-lg bg-weak px-2 py-1 text-xs text-[--text-weak]"
          onClick={showConcernedSyncAlert}
        >
          {c('Info').t`Some edits are taking longer to sync`}
        </button>
      )}
      {hasErroredMessages && (
        <button
          className="flex items-center gap-1 rounded-lg bg-weak px-2 py-1 text-xs text-[--text-weak]"
          onClick={showErroredSyncAlert}
        >
          {c('Info').t`Some edits failed to sync`}
        </button>
      )}
      {genericAlertModal}
    </div>
  )
}
