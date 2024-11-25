import { Icon } from '@proton/components'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { DocumentState, PublicDocumentState } from '@proton/docs-core'
import { WebsocketConnectionEvent } from '@proton/docs-core'
import { useApplication } from '../../Containers/ApplicationProvider'
import { c } from 'ttag'
import CloudSlashIcon from '../../Icons/CloudSlashIcon'
import ArrowsRotate from '../../Icons/ArrowsRotate'
import Pill from '../Pill'
import PopoverPill from '../PopoverPill'
import { useWebSocketStatus } from '../../Hooks/useWebsocketStatus'

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

export const ConnectionStatus = ({ documentState }: { documentState: DocumentState | PublicDocumentState }) => {
  const application = useApplication()
  const [isUserLimitReached, setIsUserLimitReached] = useState(false)
  const [lastSaveRetryTime, setLastSaveRetryTime] = useState(0)
  const [shouldShowConnecting, setShouldShowConnecting] = useState(false)

  const status = useWebSocketStatus()

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
    if (status.state === WebsocketConnectionEvent.Connecting) {
      if (connectingTimeoutRef.current) {
        clearTimeout(connectingTimeoutRef.current)
      }
      connectingTimeoutRef.current = setTimeout(() => {
        setShouldShowConnecting(true)
      }, DURATION_BEFORE_CONNECTING_STATUS_SHOWN)
    } else if (status.state === WebsocketConnectionEvent.ConnectedAndReady) {
      if (connectingTimeoutRef.current) {
        clearTimeout(connectingTimeoutRef.current)
      }
      setShouldShowConnecting(false)
    }
  }, [status.state])

  useEffect(() => {
    return documentState.subscribeToProperty('realtimeIsParticipantLimitReached', (value) => {
      setIsUserLimitReached(value)
    })
  }, [documentState])

  const disconnectReasonMessage = status.disconnectReason ? status.disconnectReason.props.message : ''

  let connectionPill = null
  switch (status.state) {
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
                <div className="color-weak pt-4" data-testid="network-status-offline-info">
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
      {status.saving && (
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
              {status.hasConcerningMessages && (
                <div className="pt-4">{c('Info').t`Some edits are taking longer to sync than expected.`}</div>
              )}
            </>
          }
        >
          <ArrowsRotate className="h-3.5 w-3.5 animate-spin fill-current" data-testid="changes-info-saving" />
          {c('Info').t`Saving...`}
        </PopoverPill>
      )}
      {!status.saving && !connectionPill && (
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
      {status.hasErroredMessages && (
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
