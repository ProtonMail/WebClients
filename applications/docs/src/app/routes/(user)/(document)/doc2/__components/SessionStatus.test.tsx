import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import type { RecoveryCondition, SessionStatus as SDKSessionStatus } from '@proton-docs/realtime-sdk'

import { SessionStatus } from './SessionStatus'

function renderStatus(status: SDKSessionStatus) {
  const onRetry = jest.fn()
  render(<SessionStatus status={status} onRetry={onRetry} />)
  return { onRetry }
}

describe('SessionStatus', () => {
  test.each<[SDKSessionStatus, string]>([
    [{ name: 'idle' }, 'Connecting…'],
    [{ name: 'ready' }, 'Connecting…'],
    [{ name: 'connecting' }, 'Connecting…'],
    [{ name: 'opening' }, 'Connecting…'],
    [{ name: 'connected' }, 'Connected'],
    [{ name: 'reconnecting', condition: 'transient', nextAttemptAt: 0, budgetExpiresAt: 0 }, 'Reconnecting…'],
    [{ name: 'paused' }, 'Not connected. Editing resumes once you are back.'],
    [{ name: 'closed' }, 'Disconnected'],
  ])('%j shows "%s" and no retry', (status, text) => {
    renderStatus(status)

    expect(screen.getByRole('status')).toHaveTextContent(text)
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument()
  })

  test.each<[RecoveryCondition, string]>([
    ['transient', 'The connection to the server was lost.'],
    ['closedNormally', 'The connection to the server was lost.'],
    ['overloaded', 'The server is busy.'],
    ['staleBaseCommit', 'The document could not be brought up to date.'],
    ['divergedFromServer', 'The document could not be brought up to date.'],
    ['infrastructureDegraded', 'Editing is temporarily unavailable.'],
    ['idleEvicted', 'You were disconnected after a period of inactivity.'],
  ])('a retryable stop for %s says why, and retries', async (condition, text) => {
    const { onRetry } = renderStatus({ name: 'stopped', condition, retryable: true })

    expect(screen.getByRole('status')).toHaveTextContent(text)

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))

    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  test.each<[RecoveryCondition, string]>([
    ['authExpired', 'Your session has expired. Reload the page to continue.'],
    ['permissionsChanged', 'Your access to this document has changed. Reload the page to continue.'],
    ['clientRejected', 'This version of the app is no longer supported. Reload the page to update it.'],
    ['encryptionFailed', 'Your changes could not be encrypted. Reload the page to continue.'],
  ])('a stop for %s that the SDK calls not retryable says why, and still retries', async (condition, text) => {
    const { onRetry } = renderStatus({ name: 'stopped', condition, retryable: false })

    expect(screen.getByRole('status')).toHaveTextContent(text)

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))

    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
