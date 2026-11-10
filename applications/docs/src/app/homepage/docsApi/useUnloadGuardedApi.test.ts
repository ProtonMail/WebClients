import { act, renderHook } from '@testing-library/react'

import { useUnloadGuardedApi } from './useUnloadGuardedApi'

const request = { method: 'get', url: 'docs/recent' } as const

function dispatchBeforeUnload() {
  const event = new Event('beforeunload', { cancelable: true })
  window.dispatchEvent(event)
  return event.defaultPrevented
}

describe('useUnloadGuardedApi', () => {
  test('passes the request to the injected api and resolves with its response', async () => {
    const api = jest.fn().mockResolvedValue({ RecentDocuments: [] })
    const { result } = renderHook(() => useUnloadGuardedApi(api))

    await expect(result.current(request)).resolves.toEqual({ RecentDocuments: [] })
    expect(api).toHaveBeenCalledWith(request)
  })

  test('blocks unload while a request is pending', async () => {
    let resolve!: (value: unknown) => void
    const api = jest.fn().mockReturnValue(new Promise((r) => (resolve = r)))
    const { result } = renderHook(() => useUnloadGuardedApi(api))

    const pending = result.current(request)
    expect(dispatchBeforeUnload()).toBe(true)

    await act(async () => {
      resolve({})
      await pending
    })
    expect(dispatchBeforeUnload()).toBe(false)
  })

  test('stops blocking unload when a request fails', async () => {
    const api = jest.fn().mockRejectedValue(new Error('Network error'))
    const { result } = renderHook(() => useUnloadGuardedApi(api))

    await expect(result.current(request)).rejects.toThrow('Network error')
    expect(dispatchBeforeUnload()).toBe(false)
  })

  test('removes the unload listener on unmount', () => {
    const api = jest.fn().mockReturnValue(new Promise(() => {}))
    const { result, unmount } = renderHook(() => useUnloadGuardedApi(api))

    void result.current(request)
    unmount()

    expect(dispatchBeforeUnload()).toBe(false)
  })
})
