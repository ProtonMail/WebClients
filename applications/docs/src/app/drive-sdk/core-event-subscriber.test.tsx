import EventManagerContext from '@proton/components/containers/eventManager/context'
import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { useCoreEventSubscription } from './core-event-subscriber'

vi.mock('@proton/drive/sdk', async () => ({
  ...(await vi.importActual('@proton/drive/sdk')),
  getDrive: vi.fn(),
}))

const unsubscribe = vi.fn()
const eventManager = { subscribe: vi.fn(() => unsubscribe) }

const wrapper = ({ children }: { children: ReactNode }) => (
  <EventManagerContext.Provider value={eventManager as any}>{children}</EventManagerContext.Provider>
)

afterEach(() => {
  vi.clearAllMocks()
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
