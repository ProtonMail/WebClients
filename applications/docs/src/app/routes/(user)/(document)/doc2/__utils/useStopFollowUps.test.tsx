import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'

import { ApplicationProvider, type ApplicationProviderProps } from '~/utils/application-context'

import { createFakeSession } from './createFakeSession'
import { useStopFollowUps } from './useStopFollowUps'

const mockApi = jest.fn()
jest.mock('@proton/app-context/useApi', () => ({ useApi: () => mockApi }))

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
    expect(mockApi).not.toHaveBeenCalled()
  })

  test("expired credentials go through the app's API client, then the session is retried", async () => {
    mockApi.mockResolvedValue({ User: {} })
    const { fake, showAlert } = renderFollowUps()

    await act(async () => fake.setSnapshot({ status: authExpired }))

    expect(mockApi).toHaveBeenCalledTimes(1)
    expect(mockApi).toHaveBeenCalledWith(expect.objectContaining({ url: 'core/v4/users' }))
    expect(fake.mocks.retry).toHaveBeenCalledTimes(1)
    expect(showAlert).not.toHaveBeenCalled()
  })

  test.each([
    ['a 401 the app could not refresh', Object.assign(new Error('Unauthorized'), { status: 401 })],
    ['an inactive app session', Object.assign(new Error('Inactive session'), { name: 'InactiveSession' })],
  ])("expired credentials met with %s leave the session stopped, to the app's sign-in", async (_, error) => {
    mockApi.mockRejectedValue(error)
    const { fake } = renderFollowUps()

    await act(async () => fake.setSnapshot({ status: authExpired }))

    expect(fake.mocks.retry).not.toHaveBeenCalled()
    expect(logger.warn).toHaveBeenCalledWith(expect.any(String), expect.any(Error))
  })

  test.each([
    ['a network failure', Object.assign(new Error('Offline'), { name: 'OfflineError' })],
    ['a server error', Object.assign(new Error('Server error'), { status: 500 })],
  ])('expired credentials whose app session check fails with %s still retry the session', async (_, error) => {
    mockApi.mockRejectedValue(error)
    const { fake } = renderFollowUps()

    await act(async () => fake.setSnapshot({ status: authExpired }))

    expect(fake.mocks.retry).toHaveBeenCalledTimes(1)
  })

  test('a failed check followed by expired credentials again is left stopped: one check per session', async () => {
    mockApi.mockRejectedValue(Object.assign(new Error('Server error'), { status: 500 }))
    const { fake } = renderFollowUps()
    await act(async () => fake.setSnapshot({ status: authExpired }))

    await act(async () => fake.setSnapshot({ status: { ...authExpired } }))

    expect(mockApi).toHaveBeenCalledTimes(1)
    expect(fake.mocks.retry).toHaveBeenCalledTimes(1)
  })

  test('expired credentials again after that retry are left stopped: one refresh per session', async () => {
    mockApi.mockResolvedValue({ User: {} })
    const { fake } = renderFollowUps()
    await act(async () => fake.setSnapshot({ status: authExpired }))

    await act(async () => fake.setSnapshot({ status: { ...authExpired } }))

    expect(mockApi).toHaveBeenCalledTimes(1)
    expect(fake.mocks.retry).toHaveBeenCalledTimes(1)
  })

  test('a session that left the stop while the app session was checked is not retried', async () => {
    let resolveApi: (value: unknown) => void = () => {}
    mockApi.mockReturnValue(new Promise((resolve) => (resolveApi = resolve)))
    const { fake } = renderFollowUps()
    act(() => fake.setSnapshot({ status: authExpired }))
    act(() => fake.setSnapshot({ status: { name: 'connecting' } }))

    await act(async () => resolveApi({ User: {} }))

    expect(fake.mocks.retry).not.toHaveBeenCalled()
  })

  test('nothing is retried after unmount', async () => {
    let resolveApi: (value: unknown) => void = () => {}
    mockApi.mockReturnValue(new Promise((resolve) => (resolveApi = resolve)))
    const { fake, unmount } = renderFollowUps()
    act(() => fake.setSnapshot({ status: authExpired }))

    unmount()
    await act(async () => resolveApi({ User: {} }))

    expect(fake.mocks.retry).not.toHaveBeenCalled()
  })

  test.each(['transient', 'idleEvicted', 'permissionsChanged', 'clientRejected'] as const)(
    'a stop for %s does nothing past the Offline pill',
    (condition) => {
      const { fake, showAlert } = renderFollowUps()

      act(() => fake.setSnapshot({ status: { name: 'stopped', condition, retryable: false } }))

      expect(showAlert).not.toHaveBeenCalled()
      expect(mockApi).not.toHaveBeenCalled()
    },
  )
})
