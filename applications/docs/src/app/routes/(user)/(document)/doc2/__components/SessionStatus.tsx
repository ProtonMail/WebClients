import { Button } from '@proton/atoms/Button/Button'
import type { RecoveryCondition, SessionStatus as SDKSessionStatus } from '@proton-docs/realtime-sdk'
import { c } from 'ttag'

const stopMessages: Record<RecoveryCondition, () => string> = {
  transient: () => c('Info').t`The connection to the server was lost.`,
  closedNormally: () => c('Info').t`The connection to the server was lost.`,
  overloaded: () => c('Info').t`The server is busy.`,
  staleBaseCommit: () => c('Info').t`The document could not be brought up to date.`,
  divergedFromServer: () => c('Info').t`The document could not be brought up to date.`,
  infrastructureDegraded: () => c('Info').t`Editing is temporarily unavailable.`,
  idleEvicted: () => c('Info').t`You were disconnected after a period of inactivity.`,
  authExpired: () => c('Info').t`Your session has expired. Reload the page to continue.`,
  permissionsChanged: () => c('Info').t`Your access to this document has changed. Reload the page to continue.`,
  clientRejected: () => c('Info').t`This version of the app is no longer supported. Reload the page to update it.`,
  encryptionFailed: () => c('Info').t`Your changes could not be encrypted. Reload the page to continue.`,
}

function getStatusMessage(status: SDKSessionStatus): string {
  switch (status.name) {
    case 'idle':
    case 'ready':
    case 'opening':
    case 'connecting':
      return c('Info').t`Connecting…`
    case 'connected':
      return c('Info').t`Connected`
    case 'reconnecting':
      return c('Info').t`Reconnecting…`
    case 'paused':
      return c('Info').t`Not connected. Editing resumes once you are back.`
    case 'closed':
      return c('Info').t`Disconnected`
    case 'stopped':
      return stopMessages[status.condition]()
  }
}

export type SessionStatusProps = { status: SDKSessionStatus; onRetry: () => void }

/** The connection status of the session, and when it stopped, why, with a retry. */
export function SessionStatus({ status, onRetry }: SessionStatusProps) {
  return (
    <div className="border-bottom border-weak color-weak flex shrink-0 items-center gap-2 px-4 py-1 text-sm">
      <output data-testid="session-status">{getStatusMessage(status)}</output>
      {status.name === 'stopped' && <Button size="small" onClick={onRetry}>{c('Action').t`Try again`}</Button>}
    </div>
  )
}
