import EventManagerContext from '@proton/components/containers/eventManager/context'
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

afterEach(() => {
  jest.clearAllMocks()
})

describe('useCoreEventSubscription', () => {
  test('subscribes and unsubscribes on unmount', () => {
    const { unmount } = renderHook(() => useCoreEventSubscription(), { wrapper })

    expect(eventManager.subscribe).toHaveBeenCalledTimes(1)
    expect(unsubscribe).not.toHaveBeenCalled()

    unmount()

    expect(unsubscribe).toHaveBeenCalledTimes(1)
  })
})
