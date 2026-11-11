import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'

import { ApplicationProvider, type ApplicationProviderProps } from '~/utils/application-context'

import { createFakeSession } from './createFakeSession'
import { useStopFollowUps } from './useStopFollowUps'

const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() }
const application = { logger } as unknown as ApplicationProviderProps['application']
const wrapper = ({ children }: { children: ReactNode }) => (
  <ApplicationProvider application={application}>{children}</ApplicationProvider>
)

const authExpired = { name: 'stopped', condition: 'authExpired', retryable: false } as const

function renderFollowUps() {
  const fake = createFakeSession({ status: { name: 'connected' } })
  fake.mocks.retry.mockImplementation(async () => fake.setSnapshot({ status: { name: 'connecting' } }))
  const showAlert = jest.fn()
  const rendered = renderHook(() => useStopFollowUps(fake.session, showAlert), { wrapper })
  return { fake, showAlert, ...rendered }
}

describe('useStopFollowUps', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  test("an encryption failure shows /doc's alert, once per stop", () => {
    const { fake, showAlert } = renderFollowUps()

    act(() => fake.setSnapshot({ status: { name: 'stopped', condition: 'encryptionFailed', retryable: false } }))
    act(() => fake.setSnapshot({ delivery: 'failed' }))

    expect(showAlert).toHaveBeenCalledTimes(1)
    expect(showAlert).toHaveBeenCalledWith({
      title: 'Something went wrong',
      translatedMessage: 'We are having trouble saving recent edits. Please refresh the page.',
    })
  })

  test('expired credentials retry the session', async () => {
    const { fake, showAlert } = renderFollowUps()

    await act(async () => fake.setSnapshot({ status: authExpired }))

    expect(fake.mocks.retry).toHaveBeenCalledTimes(1)
    expect(showAlert).not.toHaveBeenCalled()
  })

  test('expired credentials again after that retry are left stopped: one retry per session', async () => {
    const { fake } = renderFollowUps()
    await act(async () => fake.setSnapshot({ status: authExpired }))

    await act(async () => fake.setSnapshot({ status: { ...authExpired } }))

    expect(fake.mocks.retry).toHaveBeenCalledTimes(1)
  })

  test('a session that left the stop before the retry is not retried', async () => {
    const { fake } = renderFollowUps()

    act(() => {
      fake.setSnapshot({ status: authExpired })
      fake.setSnapshot({ status: { name: 'connecting' } })
    })
    await act(async () => {})

    expect(fake.mocks.retry).not.toHaveBeenCalled()
  })

  test('nothing is retried after unmount', async () => {
    const { fake, unmount } = renderFollowUps()

    act(() => fake.setSnapshot({ status: authExpired }))
    unmount()
    await act(async () => {})

    expect(fake.mocks.retry).not.toHaveBeenCalled()
  })

  test('a retry the session refuses is logged', async () => {
    const { fake } = renderFollowUps()
    fake.mocks.retry.mockRejectedValue(new Error('Refused'))

    await act(async () => fake.setSnapshot({ status: authExpired }))

    expect(logger.warn).toHaveBeenCalledWith('Failed to retry the document session', expect.any(Error))
  })

  test.each(['transient', 'idleEvicted', 'permissionsChanged', 'clientRejected'] as const)(
    'a stop for %s does nothing past the Offline pill',
    async (condition) => {
      const { fake, showAlert } = renderFollowUps()

      await act(async () => fake.setSnapshot({ status: { name: 'stopped', condition, retryable: false } }))

      expect(showAlert).not.toHaveBeenCalled()
      expect(fake.mocks.retry).not.toHaveBeenCalled()
    },
  )
})
