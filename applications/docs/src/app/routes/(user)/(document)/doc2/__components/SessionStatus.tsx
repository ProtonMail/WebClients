import { type ReactNode, useEffect, useState } from 'react'

import { Button } from '@proton/atoms/Button/Button'
import { IcArrowRotateRight } from '@proton/icons/icons/IcArrowRotateRight'
import { IcExclamationCircle } from '@proton/icons/icons/IcExclamationCircle'
import { IcLock } from '@proton/icons/icons/IcLock'
import { IcLockCheck } from '@proton/icons/icons/IcLockCheck'
import type { SessionSnapshot } from '@proton-docs/realtime-sdk'
import { c } from 'ttag'

import { Pill } from '~/components/document/DocumentLayout/DocumentHeader/Pill'
import { PopoverPill } from '~/components/document/DocumentLayout/DocumentHeader/PopoverPill'
import { ArrowsRotate, CloudSlashIcon } from '~/components/document/DocumentLayout/DocumentHeader/icons'

/**
 * No spinner for a session that opens fast. Mirrors
 * `applications/docs/src/app/components/document/DocumentLayout/DocumentHeader/ConnectionStatus.tsx`, its
 * `DURATION_BEFORE_CONNECTING_STATUS_SHOWN`.
 */
export const OPENING_SHOWN_AFTER_MS = 1_000
/**
 * No flicker from Saving… to saved and back. Mirrors
 * `applications/docs/src/app/components/document/DocumentLayout/DocumentHeader/websocket-status.tsx`, its
 * `MINIMUM_DURATION_SAVING_MUST_BE_SHOWN`.
 */
export const SAVING_SHOWN_FOR_AT_LEAST_MS = 1_000

/** A pill's label, which /doc's header hides on narrow screens, leaving the icon */
const LABEL_CLASS = 'head-max-1199:!sr-only'

export type SessionStatusProps = {
  snapshot: SessionSnapshot
  /** Retries a stopped session's connection */
  onRetry: () => void
}

/**
 * Adapted from `applications/docs/src/app/components/document/DocumentLayout/DocumentHeader/ConnectionStatus.tsx`,
 * which imports docs-core: /doc's header pills, mapped from the session's snapshot: its connection, whether it can be
 * edited, and how far its edits are delivered. The element carries the snapshot's `data-status` and `data-delivery` as
 * they are, for verification. A stopped session shows /doc's Offline pill, as /doc does whatever closed its connection,
 * with the condition as its disconnection code, and a retry when the SDK calls the stop retryable; what doc2 does past
 * that for some conditions, such as an alert or a retry, happens in `useStopFollowUps`.
 */
export function SessionStatus({ snapshot, onRetry }: SessionStatusProps) {
  const { status, delivery } = snapshot
  const opening = useIsFirstOpening(snapshot)
  const openingShown = useShownAfter(opening, OPENING_SHOWN_AFTER_MS)
  const saving = useShownForAtLeast(delivery === 'pending', SAVING_SHOWN_FOR_AT_LEAST_MS)

  const connectionPill = opening ? openingShown && <OpeningPill /> : getConnectionPill(snapshot)
  const readOnlyReason = getReadOnlyReason(snapshot)
  const readOnlyPill = readOnlyReason && <ReadOnlyPill>{readOnlyReason}</ReadOnlyPill>
  let deliveryPill = null
  if (delivery === 'degraded' || delivery === 'failed') {
    deliveryPill = <ErrorSyncingPill delivery={delivery} />
  } else if (saving) {
    deliveryPill = <SavingPill />
  } else if (delivery === 'synced' && !opening && !connectionPill && !readOnlyPill) {
    deliveryPill = <EncryptedPill />
  }

  return (
    <div className="flex select-none items-center gap-3">
      <output
        className="flex items-center gap-3"
        data-testid="session-status"
        data-status={status.name}
        data-delivery={delivery}
      >
        {connectionPill}
        {readOnlyPill}
        {deliveryPill}
      </output>
      {status.name === 'stopped' && status.retryable && (
        <Button size="small" shape="ghost" onClick={onRetry}>{c('Action').t`Try again`}</Button>
      )}
    </div>
  )
}

/** The pill for the connection once the session has opened; none while connected, or for a status not known yet */
function getConnectionPill({ status }: SessionSnapshot) {
  switch (status.name) {
    case 'idle':
    case 'ready':
    case 'opening':
    case 'connecting':
    case 'reconnecting':
      return (
        <Pill>
          <IcArrowRotateRight className="animate-spin" />
          <span className={LABEL_CLASS}>{c('Info').t`Reconnecting…`}</span>
        </Pill>
      )
    case 'paused':
    case 'closed':
      return (
        <OfflinePill>{c('Info')
          .t`Looks like you're offline. You can keep editing: your changes are saved once you are back online.`}</OfflinePill>
      )
    case 'stopped':
      return (
        <OfflinePill>
          <div>{c('Info')
            .t`Looks like you're offline. The document can not be edited while you are offline. Please check your device's connectivity.`}</div>
          <div className="color-weak pt-4" data-testid="network-status-offline-info">
            Disconnection error code: {status.condition}
          </div>
        </OfflinePill>
      )
    default:
      return null
  }
}

function OpeningPill() {
  return (
    <Pill>
      <IcArrowRotateRight className="animate-spin" />
      <span className={LABEL_CLASS}>{c('Info').t`Opening…`}</span>
    </Pill>
  )
}

/** /doc's Offline pill, which /doc shows whatever closed its connection */
function OfflinePill({ children }: { children: ReactNode }) {
  return (
    <PopoverPill
      title={
        <div className="flex gap-2" data-testid="network-status-offline">
          <CloudSlashIcon className="h-6 w-6 fill-current" />
          <span>{c('Title').t`Offline`}</span>
        </div>
      }
      content={children}
    >
      <CloudSlashIcon className="h-4 w-4 fill-current" />
      <span className={LABEL_CLASS}>{c('Info').t`Offline`}</span>
    </PopoverPill>
  )
}

/**
 * Why the session can't be edited, for the Read-only pill; none while it can, before it holds a base state, or once
 * stopped, which the Offline pill shows as /doc does
 */
function getReadOnlyReason({ status, editing }: SessionSnapshot): string | undefined {
  if (status.name === 'stopped') {
    return undefined
  }
  if (editing.allowed || editing.reason === 'noBaseState' || editing.reason === 'stopped') {
    return undefined
  }
  return readOnlyReasons[editing.reason]?.() ?? c('Info').t`This document can't be edited right now.`
}

const readOnlyReasons: Record<string, () => string> = {
  sizeLocked: () => c('Info').t`This document has reached its maximum size, so it can't be edited.`,
  incompleteBaseState: () => c('Info').t`Some of the document could not be read, so it can't be edited.`,
}

function ReadOnlyPill({ children }: { children: string }) {
  return (
    <PopoverPill
      title={
        <div className="flex gap-2">
          <IcLock className="h-6 w-6 fill-current" />
          <span>{c('Title').t`Read-only`}</span>
        </div>
      }
      content={children}
    >
      <IcLock className="h-4 w-4 fill-current" />
      <span className={LABEL_CLASS}>{c('Info').t`Read-only`}</span>
    </PopoverPill>
  )
}

function SavingPill() {
  return (
    <PopoverPill
      title={
        <div className="flex gap-2">
          <ArrowsRotate className="h-6 w-6 animate-spin fill-current" />
          <span>{c('Info').t`Saving`}</span>
        </div>
      }
      content={c('Info').t`Your changes are being synced to Drive. Please do not close the web page.`}
    >
      <ArrowsRotate className="h-3.5 w-3.5 animate-spin fill-current" />
      <span className={LABEL_CLASS}>{c('Info').t`Saving…`}</span>
    </PopoverPill>
  )
}

function EncryptedPill() {
  return (
    <PopoverPill
      title={
        <div className="flex gap-2">
          <IcLockCheck className="h-6 w-6 fill-current" />
          <span>{c('Info').t`End-to-end encrypted`}</span>
        </div>
      }
      content={c('Info').t`Every change you make is automatically and securely saved to Drive.`}
    >
      <IcLockCheck className="h-4 w-4 fill-current" />
      <span className={LABEL_CLASS}>{c('Info').t`End-to-end encrypted`}</span>
    </PopoverPill>
  )
}

function ErrorSyncingPill({ delivery }: { delivery: 'degraded' | 'failed' }) {
  return (
    <PopoverPill
      title={
        <div className="flex gap-2">
          <IcExclamationCircle className="h-6 w-6 fill-current" />
          <span>{c('Title').t`Error syncing`}</span>
        </div>
      }
      content={
        delivery === 'failed'
          ? c('Error')
              .t`Some of your recent changes could not be saved, so editing is disabled. Copy any work you need, then reload.`
          : c('Info')
              .t`Your changes failed to sync. Drive will automatically try to save the changes. Please do not close the web page.`
      }
    >
      <IcExclamationCircle className="h-4 w-4 fill-current" />
      <span className={LABEL_CLASS}>{c('Info').t`Error syncing`}</span>
    </PopoverPill>
  )
}

const OPENING_STATUSES: string[] = ['idle', 'ready', 'opening', 'connecting']

/**
 * Whether the session is still in its first opening: past it, once it reached another status or caught up, a
 * connection attempt is a reconnection
 */
function useIsFirstOpening({ status, caughtUp }: SessionSnapshot): boolean {
  const [openedOnce, setOpenedOnce] = useState(false)
  const opening = !openedOnce && !caughtUp && OPENING_STATUSES.includes(status.name)
  if (!opening && !openedOnce) {
    setOpenedOnce(true)
  }
  return opening
}

/** Whether `active` has held for `delay` ms without a break */
function useShownAfter(active: boolean, delay: number): boolean {
  const [shown, setShown] = useState(false)
  if (!active && shown) {
    setShown(false)
  }

  useEffect(() => {
    if (!active) {
      return
    }
    const timeout = setTimeout(() => setShown(true), delay)
    return () => clearTimeout(timeout)
  }, [active, delay])

  return active && shown
}

/** `active`, held true until at least `minimum` ms after it last turned true, as /doc's `websocket-status.tsx` holds Saving… */
function useShownForAtLeast(active: boolean, minimum: number): boolean {
  const [wasActive, setWasActive] = useState(active)
  const [shownAt, setShownAt] = useState(() => (active ? Date.now() : undefined))
  if (active !== wasActive) {
    setWasActive(active)
    if (active) {
      setShownAt(Date.now())
    }
  }

  useEffect(() => {
    if (active || shownAt === undefined) {
      return
    }
    const timeout = setTimeout(() => setShownAt(undefined), shownAt + minimum - Date.now())
    return () => clearTimeout(timeout)
  }, [active, minimum, shownAt])

  return active || shownAt !== undefined
}
