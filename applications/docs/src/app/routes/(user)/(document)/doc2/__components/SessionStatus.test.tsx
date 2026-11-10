import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import type {
  DeliveryState,
  Editability,
  RecoveryCondition,
  SessionSnapshot,
  SessionStatus as SDKSessionStatus,
} from '@proton-docs/realtime-sdk'

import { SessionStatus } from './SessionStatus'

const CONNECTED: SDKSessionStatus = { name: 'connected' }
const RECONNECTING: SDKSessionStatus = {
  name: 'reconnecting',
  condition: 'transient',
  nextAttemptAt: 0,
  budgetExpiresAt: 0,
}

function snapshotOf(change: Partial<SessionSnapshot> = {}): SessionSnapshot {
  return {
    status: CONNECTED,
    delivery: 'synced',
    editing: { allowed: true },
    baseCommitId: 'commit-1',
    caughtUp: true,
    participants: [],
    ...change,
  }
}

function renderStatus(change: Partial<SessionSnapshot> = {}) {
  const onRetry = jest.fn()
  const view = render(<SessionStatus snapshot={snapshotOf(change)} onRetry={onRetry} />)
  return {
    onRetry,
    unmount: view.unmount,
    update: (next: Partial<SessionSnapshot>) =>
      view.rerender(<SessionStatus snapshot={snapshotOf({ ...change, ...next })} onRetry={onRetry} />),
  }
}

const status = () => screen.getByRole('status')

describe('SessionStatus', () => {
  afterEach(() => jest.useRealTimers())

  test.each<[string, Partial<SessionSnapshot>, string[]]>([
    ['connected and synced', {}, ['End-to-end encrypted']],
    ['connected with edits waiting', { delivery: 'pending' }, ['Saving…']],
    ['connected with edits late', { delivery: 'degraded' }, ['Error syncing']],
    ['connected with an edit lost', { delivery: 'failed' }, ['Error syncing']],
    ['reconnecting', { status: RECONNECTING }, ['Reconnecting…']],
    ['connecting again after catching up', { status: { name: 'connecting' } }, ['Reconnecting…']],
    ['opening again after catching up', { status: { name: 'opening' } }, ['Reconnecting…']],
    ['reconnecting with edits waiting', { status: RECONNECTING, delivery: 'pending' }, ['Reconnecting…', 'Saving…']],
    ['paused', { status: { name: 'paused' } }, ['Offline']],
    ['paused with edits late', { status: { name: 'paused' }, delivery: 'degraded' }, ['Offline', 'Error syncing']],
    ['closed', { status: { name: 'closed' } }, ['Offline']],
    ['size-locked', { editing: { allowed: false, reason: 'sizeLocked' } }, ['Read-only']],
    ['reading an incomplete base state', { editing: { allowed: false, reason: 'incompleteBaseState' } }, ['Read-only']],
  ])('%s shows %j', (_, change, pills) => {
    renderStatus(change)

    expect(screen.getAllByRole('button').map((pill) => pill.textContent)).toEqual(pills)
  })

  test.each<SDKSessionStatus['name']>(['idle', 'ready', 'opening', 'connecting'])(
    'while %s before catching up, shows Opening… only after 1s',
    (name) => {
      jest.useFakeTimers()
      renderStatus({ status: { name } as SDKSessionStatus, caughtUp: false })
      expect(status().textContent).toBe('')

      act(() => jest.advanceTimersByTime(999))
      expect(status().textContent).toBe('')

      act(() => jest.advanceTimersByTime(1))
      expect(status()).toHaveTextContent('Opening…')
    },
  )

  test('a session that connects within 1s never shows Opening…, and a later connection attempt is a reconnection', () => {
    jest.useFakeTimers()
    const { update } = renderStatus({ status: { name: 'connecting' }, caughtUp: false })

    act(() => jest.advanceTimersByTime(900))
    update({ status: CONNECTED })
    act(() => jest.advanceTimersByTime(500))
    expect(status()).toHaveTextContent('End-to-end encrypted')

    act(() => jest.advanceTimersByTime(2000))
    update({ status: { name: 'connecting' } })
    expect(status()).toHaveTextContent(/^Reconnecting…$/)
  })

  test('a session that loses its first connection before catching up shows Reconnecting… through each attempt', () => {
    jest.useFakeTimers()
    const { update } = renderStatus({ status: { name: 'connecting' }, caughtUp: false })

    update({ status: RECONNECTING })
    expect(status()).toHaveTextContent(/^Reconnecting…$/)

    update({ status: { name: 'connecting' } })
    expect(status()).toHaveTextContent(/^Reconnecting…$/)
  })

  test('shows Saving… for at least 1s, however fast the edits are acknowledged', () => {
    jest.useFakeTimers()
    const { update } = renderStatus()

    update({ delivery: 'pending' })
    act(() => jest.advanceTimersByTime(100))
    update({ delivery: 'synced' })
    expect(status()).toHaveTextContent('Saving…')

    act(() => jest.advanceTimersByTime(899))
    expect(status()).toHaveTextContent('Saving…')

    act(() => jest.advanceTimersByTime(1))
    expect(status()).toHaveTextContent('End-to-end encrypted')
  })

  test('delivery flapping between pending and synced holds Saving… without a flicker, until 1s after the last save began', () => {
    jest.useFakeTimers()
    const { update } = renderStatus()
    const seen = new Set<string>()
    const look = () => seen.add(status().textContent ?? '')

    // A keystroke every 300ms, each acknowledged 100ms later, for 3s
    for (let elapsed = 0; elapsed < 3000; elapsed += 300) {
      update({ delivery: 'pending' })
      look()
      act(() => jest.advanceTimersByTime(100))
      update({ delivery: 'synced' })
      look()
      act(() => jest.advanceTimersByTime(200))
      look()
    }
    expect([...seen]).toEqual(['Saving…'])

    // The last save began 300ms ago
    act(() => jest.advanceTimersByTime(699))
    expect(status()).toHaveTextContent('Saving…')
    act(() => jest.advanceTimersByTime(1))
    expect(status()).toHaveTextContent('End-to-end encrypted')
  })

  test('a save that runs late shows Error syncing at once, not the held Saving…', () => {
    jest.useFakeTimers()
    const { update } = renderStatus({ delivery: 'pending' })

    update({ delivery: 'degraded' })

    expect(screen.getAllByRole('button').map((pill) => pill.textContent)).toEqual(['Error syncing'])
  })

  test('leaves no timer of its own running once unmounted', () => {
    jest.useFakeTimers()
    // The popover pills' hovercard leaves a timer of its own
    renderStatus().unmount()
    const popoverTimers = jest.getTimerCount()
    jest.clearAllTimers()
    const { update, unmount } = renderStatus({ status: { name: 'connecting' }, caughtUp: false })
    update({ delivery: 'pending' })
    update({ delivery: 'synced' })
    expect(jest.getTimerCount()).toBeGreaterThan(popoverTimers)

    unmount()

    expect(jest.getTimerCount()).toBe(popoverTimers)
  })

  test.each<[SDKSessionStatus, DeliveryState]>([
    [{ name: 'idle' }, 'synced'],
    [{ name: 'opening' }, 'synced'],
    [{ name: 'ready' }, 'synced'],
    [{ name: 'connecting' }, 'pending'],
    [CONNECTED, 'synced'],
    [CONNECTED, 'pending'],
    [CONNECTED, 'degraded'],
    [CONNECTED, 'failed'],
    [RECONNECTING, 'degraded'],
    [{ name: 'paused' }, 'pending'],
    [{ name: 'closed' }, 'synced'],
    [{ name: 'stopped', condition: 'transient', retryable: true }, 'failed'],
  ])('carries %j and delivery %s as data-status and data-delivery', (sessionStatus, delivery) => {
    renderStatus({ status: sessionStatus, delivery })

    expect(screen.getByTestId('session-status')).toHaveAttribute('data-status', sessionStatus.name)
    expect(screen.getByTestId('session-status')).toHaveAttribute('data-delivery', delivery)
  })

  test.each<[Editability, string]>([
    [{ allowed: false, reason: 'sizeLocked' }, 'reached its maximum size'],
    [{ allowed: false, reason: 'incompleteBaseState' }, 'could not be read'],
  ])("the Read-only pill's popover says why for %j", async (editing, reason) => {
    renderStatus({ editing })

    await userEvent.hover(screen.getByRole('button', { name: /Read-only/ }))

    expect(await screen.findByText(new RegExp(reason))).toBeInTheDocument()
  })

  test('a Read-only reason this app does not know yet still shows the pill', async () => {
    renderStatus({ editing: { allowed: false, reason: 'someFutureReason' } as unknown as Editability })

    await userEvent.hover(screen.getByRole('button', { name: /Read-only/ }))

    expect(await screen.findByText("This document can't be edited right now.")).toBeInTheDocument()
  })

  test('the Offline pill says editing goes on while paused', async () => {
    renderStatus({ status: { name: 'paused' } })

    await userEvent.hover(screen.getByRole('button', { name: /Offline/ }))

    expect(await screen.findByText(/You can keep editing/)).toBeInTheDocument()
  })

  const ALL_CONDITIONS: RecoveryCondition[] = [
    'transient',
    'closedNormally',
    'overloaded',
    'staleBaseCommit',
    'divergedFromServer',
    'infrastructureDegraded',
    'idleEvicted',
    'authExpired',
    'permissionsChanged',
    'clientRejected',
    'encryptionFailed',
  ]
  const stopped = (condition: RecoveryCondition, retryable: boolean): Partial<SessionSnapshot> => ({
    status: { name: 'stopped', condition, retryable },
    editing: { allowed: false, reason: 'stopped' },
  })
  /** The buttons besides the pills, which are buttons in /doc's header */
  const actions = () =>
    screen
      .queryAllByRole('button')
      .filter((button) => !button.closest('output'))
      .map((button) => button.textContent)

  test.each(ALL_CONDITIONS)(
    "a retryable stop for %s shows /doc's Offline pill alone, and retries",
    async (condition) => {
      const { onRetry } = renderStatus(stopped(condition, true))

      expect(
        screen
          .getAllByRole('button')
          .filter((button) => button.closest('output'))
          .map((pill) => pill.textContent),
      ).toEqual(['Offline'])
      expect(actions()).toEqual(['Try again'])

      await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
      expect(onRetry).toHaveBeenCalledTimes(1)
    },
  )

  test.each(ALL_CONDITIONS)(
    "a stop for %s that is not retryable shows /doc's Offline pill and no action",
    (condition) => {
      renderStatus(stopped(condition, false))

      expect(status()).toHaveTextContent(/^Offline$/)
      expect(actions()).toEqual([])
    },
  )

  test("a stop's Offline pill has /doc's explanation and the condition as its disconnection code", async () => {
    renderStatus(stopped('authExpired', false))

    await userEvent.hover(screen.getByRole('button', { name: /Offline/ }))

    expect(await screen.findByText(/The document can not be edited while you are offline/)).toBeInTheDocument()
    expect(screen.getByTestId('network-status-offline-info')).toHaveTextContent('Disconnection error code: authExpired')
  })

  test('a stop for a condition this app does not know yet still shows the Offline pill', () => {
    renderStatus(stopped('someFutureCondition' as RecoveryCondition, true))

    expect(status()).toHaveTextContent(/^Offline$/)
    expect(actions()).toEqual(['Try again'])
  })

  test('a status or delivery state this app does not know yet shows no pill, and still carries its name', () => {
    renderStatus({
      status: { name: 'someFutureStatus' } as unknown as SDKSessionStatus,
      delivery: 'someFutureState' as DeliveryState,
    })

    expect(screen.queryAllByRole('button')).toEqual([])
    expect(screen.getByTestId('session-status')).toHaveAttribute('data-status', 'someFutureStatus')
    expect(screen.getByTestId('session-status')).toHaveAttribute('data-delivery', 'someFutureState')
  })
})
