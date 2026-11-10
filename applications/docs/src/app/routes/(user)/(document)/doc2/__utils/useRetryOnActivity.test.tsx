import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'

import { ApplicationProvider, type ApplicationProviderProps } from '~/utils/application-context'

import { createFakeSession } from './createFakeSession'
import { useRetryOnActivity } from './useRetryOnActivity'

const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() }
const application = { logger } as unknown as ApplicationProviderProps['application']
const wrapper = ({ children }: { children: ReactNode }) => (
  <ApplicationProvider application={application}>{children}</ApplicationProvider>
)

const HOUR = 60 * 60 * 1000
const idleEvicted = { name: 'stopped', condition: 'idleEvicted', retryable: true } as const

function setVisibility(visibilityState: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => visibilityState })
  document.dispatchEvent(new Event('visibilitychange'))
}

function renderRetry() {
  const fake = createFakeSession({ status: { name: 'connected' } })
  // As the SDK, retry() leaves `stopped` at once
  fake.mocks.retry.mockImplementation(async () => fake.setSnapshot({ status: { name: 'connecting' } }))
  const rendered = renderHook(() => useRetryOnActivity(fake.session), { wrapper })
  return { fake, ...rendered }
}

describe('useRetryOnActivity', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    setVisibility('visible')
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.clearAllMocks()
  })

  test('after an idle eviction, waits however long it takes, then retries once on the next key press', () => {
    const { fake } = renderRetry()

    act(() => fake.setSnapshot({ status: idleEvicted }))
    act(() => jest.advanceTimersByTime(3 * HOUR))

    expect(fake.mocks.retry).not.toHaveBeenCalled()

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }))
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'b' }))
    })

    expect(fake.mocks.retry).toHaveBeenCalledTimes(1)
  })

  test.each<[string, () => void]>([
    ['a pointer press', () => window.dispatchEvent(new Event('pointerdown'))],
    ['a pointer move', () => window.dispatchEvent(new Event('pointermove'))],
    ['a wheel turn', () => window.dispatchEvent(new Event('wheel'))],
    ['the tab becoming visible', () => setVisibility('visible')],
  ])('retries on %s', (_, activity) => {
    const { fake } = renderRetry()
    act(() => setVisibility('hidden'))
    act(() => fake.setSnapshot({ status: idleEvicted }))
    act(() => jest.advanceTimersByTime(HOUR))

    act(activity)

    expect(fake.mocks.retry).toHaveBeenCalledTimes(1)
  })

  test('says it waits for activity from the eviction until the retry', () => {
    const { fake, result } = renderRetry()
    expect(result.current).toBe(false)

    act(() => fake.setSnapshot({ status: idleEvicted }))
    expect(result.current).toBe(true)

    act(() => {
      window.dispatchEvent(new Event('pointermove'))
    })
    expect(result.current).toBe(false)
  })

  test('stops waiting when the session leaves the eviction by other means', () => {
    const { fake, result } = renderRetry()
    act(() => fake.setSnapshot({ status: idleEvicted }))

    act(() => fake.setSnapshot({ status: { name: 'connecting' } }))

    expect(result.current).toBe(false)
  })

  test('the tab becoming hidden is not activity', () => {
    const { fake } = renderRetry()
    act(() => fake.setSnapshot({ status: idleEvicted }))

    act(() => setVisibility('hidden'))

    expect(fake.mocks.retry).not.toHaveBeenCalled()
  })

  test.each<[string, Parameters<ReturnType<typeof createFakeSession>['setSnapshot']>[0]['status']]>([
    ['connected', { name: 'connected' }],
    ['opening', { name: 'opening' }],
    ['stopped for another condition', { name: 'stopped', condition: 'transient', retryable: true }],
  ])('activity while %s retries nothing', (_, status) => {
    const { fake } = renderRetry()
    act(() => fake.setSnapshot({ status }))

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }))
      window.dispatchEvent(new Event('pointerdown'))
    })

    expect(fake.mocks.retry).not.toHaveBeenCalled()
  })

  test('a session already retried by other means is not retried again', () => {
    const { fake } = renderRetry()
    act(() => fake.setSnapshot({ status: idleEvicted }))
    act(() => fake.setSnapshot({ status: { name: 'connecting' } }))

    act(() => {
      window.dispatchEvent(new Event('pointerdown'))
    })

    expect(fake.mocks.retry).not.toHaveBeenCalled()
  })

  test('an eviction whose retry has not left it yet is not retried again on later snapshots and activity', () => {
    const { fake } = renderRetry()
    fake.mocks.retry.mockImplementation(async () => {})
    act(() => fake.setSnapshot({ status: idleEvicted }))
    act(() => {
      window.dispatchEvent(new Event('pointerdown'))
    })

    act(() => fake.setSnapshot({ delivery: 'pending' }))
    act(() => {
      window.dispatchEvent(new Event('pointerdown'))
    })

    expect(fake.mocks.retry).toHaveBeenCalledTimes(1)
  })

  test('a second idle eviction is retried on the activity after it', () => {
    const { fake } = renderRetry()
    act(() => fake.setSnapshot({ status: idleEvicted }))
    act(() => {
      window.dispatchEvent(new Event('pointerdown'))
    })
    act(() => fake.setSnapshot({ status: { name: 'connected' } }))

    act(() => fake.setSnapshot({ status: { ...idleEvicted } }))
    act(() => jest.advanceTimersByTime(HOUR))
    act(() => {
      window.dispatchEvent(new Event('pointerdown'))
    })

    expect(fake.mocks.retry).toHaveBeenCalledTimes(2)
  })

  test('a retry that fails is logged', async () => {
    const { fake } = renderRetry()
    fake.mocks.retry.mockRejectedValue(new Error('stopped again'))
    act(() => fake.setSnapshot({ status: idleEvicted }))

    await act(async () => window.dispatchEvent(new Event('pointerdown')))

    expect(logger.warn).toHaveBeenCalledWith(expect.any(String), expect.any(Error))
  })

  test('after unmount, activity retries nothing', () => {
    const { fake, unmount } = renderRetry()
    act(() => fake.setSnapshot({ status: idleEvicted }))

    unmount()
    act(() => {
      window.dispatchEvent(new Event('pointerdown'))
    })

    expect(fake.mocks.retry).not.toHaveBeenCalled()
  })

  test('with no session, does nothing', () => {
    renderHook(() => useRetryOnActivity(undefined), { wrapper })

    act(() => {
      window.dispatchEvent(new Event('pointerdown'))
    })
  })
})
