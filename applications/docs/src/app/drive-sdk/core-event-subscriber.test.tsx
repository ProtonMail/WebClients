import EventManagerContext from '@proton/components/containers/eventManager/context'
import { useFlag } from '@proton/unleash/useFlag'
import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { useCoreEventSubscription } from './core-event-subscriber'

jest.mock('@proton/drive/sdk', () => ({
  ...jest.requireActual('@proton/drive/sdk'),
  getDrive: jest.fn(),
}))

const unsubscribe = jest.fn()
const eventManager = { subscribe: jest.fn(() => unsubscribe) }

const wrapper = ({ children }: { children: ReactNode }) => (
  <EventManagerContext.Provider value={eventManager as any}>{children}</EventManagerContext.Provider>
)

function renderWithFlags(flags: Record<string, boolean>) {
  jest.mocked(useFlag).mockImplementation((name) => flags[name] ?? false)
  return renderHook(() => useCoreEventSubscription(), { wrapper })
}

afterEach(() => {
  jest.clearAllMocks()
})

describe('useCoreEventSubscription', () => {
  test('does not subscribe when no feature using core events runs on the Drive SDK', () => {
    const { unmount } = renderWithFlags({ DocsInvitationsDriveSDK: false, DocsLoadRecentsWithDriveSDK: false })
    unmount()

    expect(eventManager.subscribe).not.toHaveBeenCalled()
  })

  test.each([
    { DocsInvitationsDriveSDK: true, DocsLoadRecentsWithDriveSDK: false },
    { DocsInvitationsDriveSDK: false, DocsLoadRecentsWithDriveSDK: true },
    { DocsInvitationsDriveSDK: true, DocsLoadRecentsWithDriveSDK: true },
  ])('subscribes with %j and unsubscribes on unmount', (flags) => {
    const { unmount } = renderWithFlags(flags)

    expect(eventManager.subscribe).toHaveBeenCalledTimes(1)
    expect(unsubscribe).not.toHaveBeenCalled()

    unmount()

    expect(unsubscribe).toHaveBeenCalledTimes(1)
  })
})
