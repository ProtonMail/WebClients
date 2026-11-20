import { act, renderHook } from '@testing-library/react'
import { useIsNarrow } from './useIsNarrow'

function mockViewport(width: number) {
  const listeners = new Set<() => void>()
  // At the default 16px font size.
  const matches = (query: string) => width <= 16 * Number(/max-width: ([\d.]+)em/.exec(query)?.[1])
  window.matchMedia = vi.fn((query: string) => ({
    get matches() {
      return matches(query)
    },
    addEventListener: (_: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
  })) as unknown as typeof window.matchMedia
  return {
    resize(newWidth: number) {
      width = newWidth
      listeners.forEach((listener) => listener())
    },
  }
}

describe('useIsNarrow', () => {
  test("is true up to Proton's small breakpoint, 680px", () => {
    mockViewport(680)
    expect(renderHook(() => useIsNarrow()).result.current).toBe(true)
  })

  test("is false above Proton's small breakpoint", () => {
    mockViewport(681)
    expect(renderHook(() => useIsNarrow()).result.current).toBe(false)
  })

  test('follows the viewport as it is resized', () => {
    const viewport = mockViewport(1024)
    const { result } = renderHook(() => useIsNarrow())

    act(() => viewport.resize(400))
    expect(result.current).toBe(true)

    act(() => viewport.resize(900))
    expect(result.current).toBe(false)
  })
})
