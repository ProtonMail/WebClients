import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'

import type { Refusal } from '@proton-docs/realtime-sdk'

import { ApplicationProvider, type ApplicationProviderProps } from '~/utils/application-context'

import { createFakeSession } from './createFakeSession'
import { useSessionNotices } from './useSessionNotices'

const mockCreateNotification = jest.fn()
jest.mock('@proton/app-context/useNotifications', () => ({
  useNotifications: () => ({ createNotification: mockCreateNotification }),
}))

const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() }
const application = { logger } as unknown as ApplicationProviderProps['application']

const wrapper = ({ children }: { children: ReactNode }) => (
  <ApplicationProvider application={application}>{children}</ApplicationProvider>
)

function renderNotices() {
  const fake = createFakeSession()
  const hook = renderHook(() => useSessionNotices(fake.session), { wrapper })
  return { ...hook, fake }
}

describe('useSessionNotices', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  test.each<[Refusal, string]>([
    [{ reason: 'updateTooLarge', attemptedBytes: 2, limitBytes: 1 }, 'Your last change is too large to save'],
    [{ reason: 'incompleteBaseState' }, 'Some of the document could not be read'],
  ])('a refusal for %j tells the user', (refusal, text) => {
    const { fake } = renderNotices()

    fake.emit('refusal', refusal)

    expect(mockCreateNotification).toHaveBeenCalledWith({ type: 'error', text: expect.stringContaining(text) })
    expect(logger.warn).toHaveBeenCalledWith(expect.any(String), refusal)
  })

  test('a refusal for the document size leaves telling the user to the size-limit modal', () => {
    const { fake } = renderNotices()
    const refusal: Refusal = { reason: 'documentSizeLimitReached', attemptedBytes: 2, limitBytes: 1 }

    fake.emit('refusal', refusal)

    expect(mockCreateNotification).not.toHaveBeenCalled()
    expect(logger.warn).toHaveBeenCalledWith(expect.any(String), refusal)
  })

  test('an invalidation tells the user a change was not saved', () => {
    const { fake } = renderNotices()
    const invalidation = { updateId: 'update-1', condition: 'divergedFromServer' } as const

    fake.emit('invalidation', invalidation)

    expect(mockCreateNotification).toHaveBeenCalledWith({
      type: 'error',
      text: expect.stringContaining('could not be saved'),
    })
    expect(logger.error).toHaveBeenCalledWith(expect.any(String), invalidation)
  })

  test.each([
    ['live', 'A change from another editor could not be read'],
    ['baseState', 'Some of the document could not be read'],
  ] as const)('an unreadable %s update tells the user', (origin, text) => {
    const { fake } = renderNotices()

    fake.emit('updateUnreadable', { uuid: 'update-1', origin })

    expect(mockCreateNotification).toHaveBeenCalledWith({ type: 'warning', text: expect.stringContaining(text) })
  })

  test('unmounting removes its listeners', () => {
    const { fake, unmount } = renderNotices()
    expect(fake.listenerCount()).toBe(3)

    unmount()

    expect(fake.listenerCount()).toBe(0)
  })
})
