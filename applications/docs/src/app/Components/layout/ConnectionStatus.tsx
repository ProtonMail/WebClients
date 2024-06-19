import { Icon } from '@proton/components'
import { useCallback, useEffect, useState } from 'react'
import {
  WebsocketAckStatusChangePayload,
  WebsocketConnectionEvent,
  WebsocketConnectionEventStatusChange,
  WebsocketDisconnectedPayload,
  WebsocketFailedToConnectPayload,
} from '@proton/docs-core'
import { useApplication } from '../../Containers/ApplicationProvider'
import { mergeRegister } from '@lexical/utils'
import { ConnectionCloseReason } from '@proton/docs-proto'
import { c } from 'ttag'
import { useGenericAlertModal } from '../Modals/GenericAlert'

export const ConnectionStatus = () => {
  const application = useApplication()
  const [status, setStatus] = useState<WebsocketConnectionEventStatusChange>()
  const [disconnectReason, setDisconnectReason] = useState<ConnectionCloseReason>()
  const [hasConcerningMessages, setHasConcerningMessages] = useState(false)
  const [hasErroredMessages, setHasErroredMessages] = useState(false)
  const [genericAlertModal, showGenericAlertModal] = useGenericAlertModal()

  useEffect(() => {
    return mergeRegister(
      application.eventBus.addEventCallback(() => {
        setStatus(WebsocketConnectionEvent.Connected)
      }, WebsocketConnectionEvent.Connected),
      application.eventBus.addEventCallback(() => {
        setStatus(WebsocketConnectionEvent.Connecting)
      }, WebsocketConnectionEvent.Connecting),
      application.eventBus.addEventCallback((payload: WebsocketDisconnectedPayload) => {
        setStatus(WebsocketConnectionEvent.Disconnected)
        setDisconnectReason(payload.serverReason)
      }, WebsocketConnectionEvent.Disconnected),
      application.eventBus.addEventCallback((payload: WebsocketFailedToConnectPayload) => {
        setStatus(WebsocketConnectionEvent.FailedToConnect)
        setDisconnectReason(payload.serverReason)
      }, WebsocketConnectionEvent.FailedToConnect),
      application.eventBus.addEventCallback((payload: WebsocketAckStatusChangePayload) => {
        setHasConcerningMessages(payload.ledger.hasConcerningMessages())
        setHasErroredMessages(payload.ledger.hasErroredMessages())
      }, WebsocketConnectionEvent.AckStatusChange),
    )
  }, [application.eventBus])

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
          <div className="flex items-center gap-1 rounded-lg bg-[--background-weak] px-2 py-1 text-xs text-[--text-weak]">
            {content}
          </div>
          {isNotConnected && (
            <div className="flex items-center gap-1 rounded-lg bg-[--background-weak] px-2 py-1 text-xs text-[--text-weak]">
              {c('Info').t`Recent edits may not be displayed`}
            </div>
          )}
        </>
      )}
      {hasConcerningMessages && (
        <button
          className="flex items-center gap-1 rounded-lg bg-[--background-weak] px-2 py-1 text-xs text-[--text-weak]"
          onClick={showConcernedSyncAlert}
        >
          {c('Info').t`Some edits are taking longer to sync`}
        </button>
      )}
      {hasErroredMessages && (
        <button
          className="flex items-center gap-1 rounded-lg bg-[--background-weak] px-2 py-1 text-xs text-[--text-weak]"
          onClick={showErroredSyncAlert}
        >
          {c('Info').t`Some edits failed to sync`}
        </button>
      )}
      {genericAlertModal}
    </div>
  )
}
