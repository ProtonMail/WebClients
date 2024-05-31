import { Icon } from '@proton/components'
import { useEffect, useState } from 'react'
import {
  WebsocketConnectionEvent,
  WebsocketConnectionEventStatusChange,
  WebsocketDisconnectedPayload,
  WebsocketFailedToConnectPayload,
} from '@proton/docs-shared'
import { useApplication } from '../../Containers/ApplicationProvider'
import { mergeRegister } from '@lexical/utils'
import { ConnectionCloseReason } from '@proton/docs-proto'
import { c } from 'ttag'

export const ConnectionStatus = () => {
  const application = useApplication()
  const [status, setStatus] = useState<WebsocketConnectionEventStatusChange>()
  const [disconnectReason, setDisconnectReason] = useState<ConnectionCloseReason>()

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
    )
  }, [application.eventBus])

  const disconnectReasonMessage = disconnectReason ? `: ${disconnectReason?.props.message}` : ''

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

  if (!content) {
    return null
  }

  const isNotConnected =
    status === WebsocketConnectionEvent.FailedToConnect || status === WebsocketConnectionEvent.Disconnected

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-1 rounded-lg bg-[--background-weak] px-2 py-1 text-xs text-[--text-weak]">
        {content}
      </div>
      {isNotConnected && (
        <div className="flex items-center gap-1 rounded-lg bg-[--background-weak] px-2 py-1 text-xs text-[--text-weak]">
          {c('Info').t`Recent edits may not be displayed`}
        </div>
      )}
    </div>
  )
}
