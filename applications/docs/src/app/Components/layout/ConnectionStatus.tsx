import { Icon } from '@proton/components'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { WebsocketConnectionEventPayloads, WebsocketConnectionEventStatusChange } from '@proton/docs-core'
import { ParticipantTrackerEvent, WebsocketConnectionEvent } from '@proton/docs-core'
import { useApplication } from '../../Containers/ApplicationProvider'
import { mergeRegister } from '@lexical/utils'
import type { ConnectionCloseReason } from '@proton/docs-proto'
import { c } from 'ttag'
import CloudSlashIcon from '../../Icons/CloudSlashIcon'
import ArrowsRotate from '../../Icons/ArrowsRotate'
import Pill from '../Pill'
import PopoverPill from '../PopoverPill'

/**
 * Number of ms a "Saving..." status should be shown at minimum, to prevent fast-paced/jarring switching
 * from Saving to Saved and back.
 */
const MINIMUM_DURATION_SAVING_MUST_BE_SHOWN = 1000

/**
 * @TODO DRVDOC-842
 * In the near future, retrying unacked messages should be handled seamlessly by the service with exponential backoff.
 * Until then, we're going to manually retry all failed document updates when the user hovers on or clicks the error pill.
 */
const MIN_TIME_TO_WAIT_BETWEEN_RETRIES = 15_000

/**
 * How long to wait before we should show "Connecting..." (or Opening...).
 * We don't want to show it immediately in case we get a connection pretty fast and can avoid extraneous spinners.
 */
const DURATION_BEFORE_CONNECTING_STATUS_SHOWN = 1_000

export const ConnectionStatus = () => {
  const application = useApplication()
  const [status, setStatus] = useState<WebsocketConnectionEventStatusChange>()
  const [disconnectReason, setDisconnectReason] = useState<ConnectionCloseReason>()
  const [hasConcerningMessages, setHasConcerningMessages] = useState(false)
  const [hasErroredMessages, setHasErroredMessages] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isUserLimitReached, setIsUserLimitReached] = useState(false)
  const [saveStartTime, setSaveStartTime] = useState(0)
  const [lastSaveRetryTime, setLastSaveRetryTime] = useState(0)
  const [shouldShowConnecting, setShouldShowConnecting] = useState(false)

  const savingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const connectingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const onErrorPillToggle = useCallback(
    (isOpen: boolean) => {
      if (isOpen && Date.now() - lastSaveRetryTime > MIN_TIME_TO_WAIT_BETWEEN_RETRIES) {
        setLastSaveRetryTime(Date.now())
        application.websocketService.retryAllFailedDocumentUpdates()
      }
    },
    [application, lastSaveRetryTime],
  )

  useEffect(() => {
    return mergeRegister(
      application.eventBus.addEventCallback(() => {
        setStatus(WebsocketConnectionEvent.Connected)
        if (connectingTimeoutRef.current) {
          clearTimeout(connectingTimeoutRef.current)
        }
        setShouldShowConnecting(false)
      }, WebsocketConnectionEvent.Connected),

      application.eventBus.addEventCallback(() => {
        setStatus(WebsocketConnectionEvent.Connecting)
        if (connectingTimeoutRef.current) {
          clearTimeout(connectingTimeoutRef.current)
        }
        connectingTimeoutRef.current = setTimeout(() => {
          setShouldShowConnecting(true)
        }, DURATION_BEFORE_CONNECTING_STATUS_SHOWN)
      }, WebsocketConnectionEvent.Connecting),

      application.eventBus.addEventCallback(
        (payload: WebsocketConnectionEventPayloads[WebsocketConnectionEvent.Disconnected]) => {
          setStatus(WebsocketConnectionEvent.Disconnected)
          setDisconnectReason(payload.serverReason)
          setSaving(false)
        },
        WebsocketConnectionEvent.Disconnected,
      ),

      application.eventBus.addEventCallback(
        (payload: WebsocketConnectionEventPayloads[WebsocketConnectionEvent.FailedToConnect]) => {
          setStatus(WebsocketConnectionEvent.FailedToConnect)
          setDisconnectReason(payload.serverReason)
          setSaving(false)
        },
        WebsocketConnectionEvent.FailedToConnect,
      ),

      application.eventBus.addEventCallback(
        (payload: WebsocketConnectionEventPayloads[WebsocketConnectionEvent.AckStatusChange]) => {
          setHasConcerningMessages(payload.ledger.hasConcerningMessages())

          const hasErrored = payload.ledger.hasErroredMessages()
          setHasErroredMessages(hasErrored)

          if (hasErrored) {
            setSaving(false)
          }
        },
        WebsocketConnectionEvent.AckStatusChange,
      ),

      application.eventBus.addEventCallback(() => {
        if (savingTimeoutRef.current) {
          clearTimeout(savingTimeoutRef.current)
        }
        setSaving(true)
        setSaveStartTime(Date.now())
      }, WebsocketConnectionEvent.Saving),

      application.eventBus.addEventCallback(() => {
        const elapsedTime = Date.now() - saveStartTime
        const remainingTime = Math.max(0, MINIMUM_DURATION_SAVING_MUST_BE_SHOWN - elapsedTime)
        savingTimeoutRef.current = setTimeout(() => {
          setSaving(false)
        }, remainingTime)
      }, WebsocketConnectionEvent.Saved),

      application.eventBus.addEventCallback(() => {
        setIsUserLimitReached(true)
      }, ParticipantTrackerEvent.DocumentLimitBreached),

      application.eventBus.addEventCallback(() => {
        setIsUserLimitReached(false)
      }, ParticipantTrackerEvent.DocumentLimitUnbreached),
    )
  }, [application.eventBus, saveStartTime])

  const disconnectReasonMessage = disconnectReason ? disconnectReason?.props.message : ''

  let connectionPill = null
  switch (status) {
    case WebsocketConnectionEvent.Connecting:
      {
        if (shouldShowConnecting) {
          connectionPill = (
            <Pill>
              <Icon name="arrow-rotate-right" className="animate-spin" data-testid="network-status-connecting" />
              {c('Info').t`Opening...`}
            </Pill>
          )
        }
      }
      break
    case WebsocketConnectionEvent.FailedToConnect:
    case WebsocketConnectionEvent.Disconnected:
      connectionPill = (
        <PopoverPill
          title={
            <div className="flex gap-2" data-testid="network-status-offline">
              <CloudSlashIcon className="h-6 w-6 fill-current" />
              <span>{c('Title').t`Offline`}</span>
            </div>
          }
          content={
            <>
              <div>{c('Info')
                .t`Looks like you're offline. The document can not be edited while you are offline. Please check your device's connectivity.`}</div>
              {disconnectReasonMessage && (
                <div className="pt-4" data-testid="network-status-offline-info">
                  Disconnection error code: {disconnectReasonMessage}
                </div>
              )}
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
                <div className="pt-4">{c('Info').t`Some edits are taking longer to sync than expected.`}</div>
              )}
            </>
          }
        >
          <ArrowsRotate className="h-3.5 w-3.5 animate-spin fill-current" data-testid="changes-info-saving" />
          {c('Info').t`Saving...`}
        </PopoverPill>
      )}
      {!saving && !connectionPill && (
        <PopoverPill
          title={
            <div className="flex gap-2" data-testid="changes-info-e2e-encrypted">
              <Icon name="lock-check" className="h-6 w-6 fill-current" />
              <span>{c('Info').t`End-to-end encrypted`}</span>
            </div>
          }
          content={c('Info').t`Every change you make is automatically and securely saved to Drive.`}
        >
          <Icon name="lock-check" className="h-4 w-4 fill-current" />
          {c('Info').t`End-to-end encrypted`}
        </PopoverPill>
      )}
      {hasErroredMessages && (
        <PopoverPill
          title={
            <div className="flex gap-2" data-testid="changes-info-error">
              <Icon name="exclamation-circle" className="h-6 w-6 fill-current" />
              <span>{c('Title').t`Error Syncing`}</span>
            </div>
          }
          content={c('Info')
            .t`Your changes failed to sync. Drive will automatically try to save the changes. Please do not close the web page.`}
          onToggle={onErrorPillToggle}
        >
          <Icon name="exclamation-circle" className="h-4 w-4 fill-current" />
          {c('Info').t`Error Syncing`}
        </PopoverPill>
      )}
      {isUserLimitReached && (
        <PopoverPill
          title={
            <div className="flex gap-2" data-testid="changes-info-limited">
              <Icon name="exclamation-circle" className="h-6 w-6 fill-current" />
              <span>{c('Title').t`Limited availability`}</span>
            </div>
          }
          content={c('Info').t`This document has lots of activity. Some features may be temporarily unavailable.`}
        >
          <Icon name="exclamation-circle" className="h-4 w-4 fill-current" />
          {c('Info').t`Limited availability`}
        </PopoverPill>
      )}
    </div>
  )
}
