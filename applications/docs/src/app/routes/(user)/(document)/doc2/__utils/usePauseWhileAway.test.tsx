import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'

import { ApplicationProvider, type ApplicationProviderProps } from '~/utils/application-context'

import { createFakeSession } from './createFakeSession'
import { PAUSE_WHEN_HIDDEN_FOR_MS, usePauseWhileAway } from './usePauseWhileAway'

const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() }
const application = { logger } as unknown as ApplicationProviderProps['application']

const wrapper = ({ children }: { children: ReactNode }) => (
  <ApplicationProvider application={application}>{children}</ApplicationProvider>
)

let onLine = true
let visibilityState: DocumentVisibilityState = 'visible'

function goOffline() {
  onLine = false
  act(() => {
    window.dispatchEvent(new Event('offline'))
  })
}

function goOnline() {
  onLine = true
  act(() => {
    window.dispatchEvent(new Event('online'))
  })
}

function setVisibility(state: DocumentVisibilityState) {
  visibilityState = state
  act(() => {
    document.dispatchEvent(new Event('visibilitychange'))
  })
}

describe('usePauseWhileAway', () => {
  beforeAll(() => {
    jest.spyOn(navigator, 'onLine', 'get').mockImplementation(() => onLine)
    jest.spyOn(document, 'visibilityState', 'get').mockImplementation(() => visibilityState)
  })

  beforeEach(() => {
    onLine = true
    visibilityState = 'visible'
  })

  afterEach(() => {
    jest.clearAllMocks()
    jest.useRealTimers()
  })

  afterAll(() => {
    jest.restoreAllMocks()
  })

  test.each(['connected', 'connecting', 'reconnecting', 'opening'] as const)(
    'going offline pauses a %s session, and coming back online resumes it',
    (name) => {
      const fake = createFakeSession({
        status:
          name === 'reconnecting' ? { name, condition: 'transient', nextAttemptAt: 0, budgetExpiresAt: 0 } : { name },
      })
      renderHook(() => usePauseWhileAway(fake.session), { wrapper })

      goOffline()
      expect(fake.mocks.pause).toHaveBeenCalledTimes(1)

      fake.setSnapshot({ status: { name: 'paused' } })
      goOnline()
      expect(fake.mocks.resume).toHaveBeenCalledTimes(1)
    },
  )

  test.each(['ready', 'stopped', 'closed', 'paused'] as const)('going offline leaves a %s session alone', (name) => {
    const fake = createFakeSession({
      status: name === 'stopped' ? { name, condition: 'transient', retryable: true } : { name },
    })
    renderHook(() => usePauseWhileAway(fake.session), { wrapper })

    goOffline()

    expect(fake.mocks.pause).not.toHaveBeenCalled()
  })

  test('coming back online leaves a session that is not paused alone', () => {
    const fake = createFakeSession({ status: { name: 'connected' } })
    renderHook(() => usePauseWhileAway(fake.session), { wrapper })

    goOnline()

    expect(fake.mocks.resume).not.toHaveBeenCalled()
  })

  test('a tab hidden for an hour pauses the session, and showing it again resumes it', () => {
    jest.useFakeTimers()
    const fake = createFakeSession({ status: { name: 'connected' } })
    renderHook(() => usePauseWhileAway(fake.session), { wrapper })

    setVisibility('hidden')
    act(() => jest.advanceTimersByTime(PAUSE_WHEN_HIDDEN_FOR_MS - 1))
    expect(fake.mocks.pause).not.toHaveBeenCalled()

    act(() => jest.advanceTimersByTime(1))
    expect(fake.mocks.pause).toHaveBeenCalledTimes(1)

    fake.setSnapshot({ status: { name: 'paused' } })
    setVisibility('visible')
    expect(fake.mocks.resume).toHaveBeenCalledTimes(1)
  })

  test('a tab shown again within the hour never pauses', () => {
    jest.useFakeTimers()
    const fake = createFakeSession({ status: { name: 'connected' } })
    renderHook(() => usePauseWhileAway(fake.session), { wrapper })

    setVisibility('hidden')
    act(() => jest.advanceTimersByTime(PAUSE_WHEN_HIDDEN_FOR_MS / 2))
    setVisibility('visible')
    act(() => jest.advanceTimersByTime(PAUSE_WHEN_HIDDEN_FOR_MS))

    expect(fake.mocks.pause).not.toHaveBeenCalled()
  })

  test('showing the tab while offline keeps the session paused', () => {
    jest.useFakeTimers()
    const fake = createFakeSession({ status: { name: 'connected' } })
    renderHook(() => usePauseWhileAway(fake.session), { wrapper })
    setVisibility('hidden')
    act(() => jest.advanceTimersByTime(PAUSE_WHEN_HIDDEN_FOR_MS))
    fake.setSnapshot({ status: { name: 'paused' } })

    onLine = false
    setVisibility('visible')

    expect(fake.mocks.resume).not.toHaveBeenCalled()
  })

  test('a session that becomes pausable while offline is paused then', () => {
    const fake = createFakeSession({ status: { name: 'ready' } })
    onLine = false
    renderHook(() => usePauseWhileAway(fake.session), { wrapper })
    expect(fake.mocks.pause).not.toHaveBeenCalled()

    act(() => fake.setSnapshot({ status: { name: 'connecting' } }))

    expect(fake.mocks.pause).toHaveBeenCalledTimes(1)
  })

  test('going offline before the session connects pauses it once it connects', () => {
    const fake = createFakeSession({ status: { name: 'ready' } })
    renderHook(() => usePauseWhileAway(fake.session), { wrapper })

    goOffline()
    expect(fake.mocks.pause).not.toHaveBeenCalled()

    act(() => fake.setSnapshot({ status: { name: 'connecting' } }))
    expect(fake.mocks.pause).toHaveBeenCalledTimes(1)
  })

  test('coming back online while a pause is settling resumes the session once it is paused', async () => {
    const fake = createFakeSession({ status: { name: 'connected' } })
    let settlePause: () => void = () => {}
    fake.mocks.pause.mockReturnValue(new Promise<void>((resolve) => (settlePause = resolve)))
    renderHook(() => usePauseWhileAway(fake.session), { wrapper })

    goOffline()
    goOnline()
    expect(fake.mocks.resume).not.toHaveBeenCalled()

    act(() => fake.setSnapshot({ status: { name: 'paused' } }))
    await act(async () => settlePause())

    expect(fake.mocks.resume).toHaveBeenCalledTimes(1)
    expect(fake.mocks.pause).toHaveBeenCalledTimes(1)
  })

  test('a tab already hidden when it mounts pauses after an hour', () => {
    jest.useFakeTimers()
    visibilityState = 'hidden'
    const fake = createFakeSession({ status: { name: 'connected' } })
    renderHook(() => usePauseWhileAway(fake.session), { wrapper })

    act(() => jest.advanceTimersByTime(PAUSE_WHEN_HIDDEN_FOR_MS))

    expect(fake.mocks.pause).toHaveBeenCalledTimes(1)
  })

  test('a pause that fails is logged', async () => {
    const fake = createFakeSession({ status: { name: 'connected' } })
    const error = new Error('Encrypting the flush failed')
    fake.mocks.pause.mockRejectedValue(error)
    renderHook(() => usePauseWhileAway(fake.session), { wrapper })

    goOffline()

    await waitFor(() => expect(logger.warn).toHaveBeenCalledWith(expect.any(String), error))
  })

  test('does nothing without a session, and stops listening once unmounted', () => {
    const fake = createFakeSession({ status: { name: 'connected' } })
    renderHook(() => usePauseWhileAway(undefined), { wrapper })
    const { unmount } = renderHook(() => usePauseWhileAway(fake.session), { wrapper })

    unmount()
    goOffline()

    expect(fake.mocks.pause).not.toHaveBeenCalled()
  })
})
