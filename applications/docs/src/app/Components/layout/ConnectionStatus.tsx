import { Icon } from '@proton/components'
import { useEffect, useRef, useState } from 'react'
import {
  WebsocketConnectionEvent,
  WebsocketConnectionEventPayloads,
  WebsocketConnectionEventStatusChange,
} from '@proton/docs-core'
import { useApplication } from '../../Containers/ApplicationProvider'
import { mergeRegister } from '@lexical/utils'
import { ConnectionCloseReason } from '@proton/docs-proto'
import { c } from 'ttag'
import CloudIcon from '../../Icons/CloudIcon'
import CloudSlashIcon from '../../Icons/CloudSlashIcon'
import ArrowsRotate from '../../Icons/ArrowsRotate'
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants'
import Pill from '../Pill'
import PopoverPill from '../PopoverPill'

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

  const disconnectReasonMessage = disconnectReason ? disconnectReason?.props.message : ''

  let connectionPill = null
  switch (status) {
    case WebsocketConnectionEvent.Connecting:
      {
        connectionPill = (
          <Pill>
            <Icon name="arrow-rotate-right" className="animate-spin" />
            {c('Info').t`Connecting...`}
          </Pill>
        )
      }
      break
    case WebsocketConnectionEvent.FailedToConnect:
    case WebsocketConnectionEvent.Disconnected:
      connectionPill = (
        <PopoverPill
          title={
            <div className="flex gap-2">
              <CloudSlashIcon className="h-6 w-6 fill-current" />
              <span>{c('Title').t`Offline`}</span>
            </div>
          }
          content={
            <>
              <div>{c('Info')
                .t`Looks like you're offline. Document can not be edited while you are offline. Please check your device's connectivity.`}</div>
              {disconnectReasonMessage && <div className="pt-4">{disconnectReasonMessage}</div>}
            </>
          }
        >
          <CloudSlashIcon className="h-4 w-4 fill-current" />
          {c('Info').t`Offline`}
        </PopoverPill>
      )
      break
  }

  return (
    <div className="flex select-none items-center gap-3">
      {connectionPill}
      {saving && (
        <PopoverPill
          title={
            <div className="flex gap-2">
              <ArrowsRotate className="h-6 w-6 animate-spin fill-current" />
              <span>{c('Info').t`Saving`}</span>
            </div>
          }
          content={
            <>
              <div>{c('Info').t`Your changes are being synced to Drive. Please do not close the web page.`}</div>
              {hasConcerningMessages && (
                <div className="pt-4">{c('Info')
                  .t`Some edits are taking longer to sync than expected. This may be due to network issues. You may continue editing for now. If the issue persists, we'll show a stronger error message.`}</div>
              )}
            </>
          }
        >
          <ArrowsRotate className="h-3.5 w-3.5 animate-spin fill-current" />
          {c('Info').t`Saving...`}
        </PopoverPill>
      )}
      {saved && (
        <PopoverPill
          title={
            <div className="flex gap-2">
              <CloudIcon className="h-6 w-6 fill-current" />
              <span>{c('Info').t`All changes saved to Drive`}</span>
            </div>
          }
          content={c('Info').t`Every change you make is automatically and securely saved to Drive.`}
        >
          <CloudIcon className="h-4 w-4 fill-current" />
          {c('Info').t`Saved in ${DRIVE_APP_NAME}`}
        </PopoverPill>
      )}
      {hasErroredMessages && (
        <PopoverPill
          title={
            <div className="flex gap-2">
              <Icon name="exclamation-circle" className="h-6 w-6 fill-current" />
              <span>{c('Title').t`Error Syncing`}</span>
            </div>
          }
          content={c('Info')
            .t`Recent edits to your document could not be saved. To ensure data safety, editing is temporarily disabled. Please download a copy of your document from the main menu. After you have done so, refresh the page to reconnect.`}
        >
          <Icon name="exclamation-circle" className="h-4 w-4 fill-current" />
          {c('Info').t`Error Syncing`}
        </PopoverPill>
      )}
    </div>
  )
}
