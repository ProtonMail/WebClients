import { act, renderHook } from '@testing-library/react'
import { useIsDarkThemeMode } from './useIsDarkThemeMode'

afterEach(() => {
  document.documentElement.removeAttribute('data-theme-mode')
})

describe('useIsDarkThemeMode', () => {
  test('is false without a theme mode', () => {
    expect(renderHook(() => useIsDarkThemeMode()).result.current).toBe(false)
  })

  test('is false in light mode and true in dark mode', () => {
    document.documentElement.setAttribute('data-theme-mode', 'light')
    expect(renderHook(() => useIsDarkThemeMode()).result.current).toBe(false)

    document.documentElement.setAttribute('data-theme-mode', 'dark')
    expect(renderHook(() => useIsDarkThemeMode()).result.current).toBe(true)
  })

  test('follows the theme as it changes', async () => {
    const { result } = renderHook(() => useIsDarkThemeMode())

    // MutationObserver reports after a microtask.
    await act(async () => document.documentElement.setAttribute('data-theme-mode', 'dark'))
    expect(result.current).toBe(true)

    await act(async () => document.documentElement.setAttribute('data-theme-mode', 'light'))
    expect(result.current).toBe(false)
  })
})
