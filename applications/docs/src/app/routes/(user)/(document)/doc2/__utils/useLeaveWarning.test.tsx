import { renderHook } from '@testing-library/react'

import type { DeliveryState } from '@proton-docs/realtime-sdk'

import { createFakeSession } from './createFakeSession'
import { useLeaveWarning } from './useLeaveWarning'

function leave() {
  const event = new Event('beforeunload', { cancelable: true })
  window.dispatchEvent(event)
  return { prevented: event.defaultPrevented }
}

describe('useLeaveWarning', () => {
  test.each<[DeliveryState, boolean]>([
    ['synced', false],
    ['pending', true],
    ['degraded', true],
    ['failed', true],
  ])('leaving with delivery %s is prevented: %s', (delivery, prevented) => {
    const fake = createFakeSession({ delivery })
    renderHook(() => useLeaveWarning(fake.session))

    expect(leave().prevented).toBe(prevented)
  })

  test('reads the delivery when the user leaves, not when it was set up', () => {
    const fake = createFakeSession({ delivery: 'synced' })
    renderHook(() => useLeaveWarning(fake.session))

    fake.setSnapshot({ delivery: 'pending' })
    expect(leave().prevented).toBe(true)

    fake.setSnapshot({ delivery: 'synced' })
    expect(leave().prevented).toBe(false)
  })

  test('a delivery state this app does not know yet is not synced, so leaving is prevented', () => {
    const fake = createFakeSession({ delivery: 'someFutureState' as DeliveryState })
    renderHook(() => useLeaveWarning(fake.session))

    expect(leave().prevented).toBe(true)
  })

  test('warns nothing without a session', () => {
    renderHook(() => useLeaveWarning(undefined))

    expect(leave().prevented).toBe(false)
  })

  test('registers one listener per session, and removes it on unmount or when the session changes', () => {
    const add = jest.spyOn(window, 'addEventListener')
    const remove = jest.spyOn(window, 'removeEventListener')
    const first = createFakeSession({ delivery: 'pending' })
    const second = createFakeSession({ delivery: 'synced' })
    const { rerender, unmount } = renderHook(({ session }) => useLeaveWarning(session), {
      initialProps: { session: first.session },
    })
    rerender({ session: first.session })
    const listeners = () =>
      add.mock.calls.filter(([type]) => (type as string) === 'beforeunload').map(([, listener]) => listener)
    expect(listeners()).toHaveLength(1)

    rerender({ session: second.session })
    expect(remove).toHaveBeenCalledWith('beforeunload', listeners()[0])
    expect(leave().prevented).toBe(false)

    unmount()
    expect(remove).toHaveBeenCalledWith('beforeunload', listeners()[1])
    first.setSnapshot({ delivery: 'pending' })
    expect(leave().prevented).toBe(false)

    add.mockRestore()
    remove.mockRestore()
  })
})
