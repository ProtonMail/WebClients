import { isMac } from '@proton/shared/lib/helpers/browser'

import { renderHook } from '@testing-library/react'

import { isPrintShortcut, listenForPrintShortcut, usePrintShortcut } from './printShortcut'

vi.mock('@proton/shared/lib/helpers/browser', () => ({ isMac: vi.fn(() => false) }))

function keydown(init: KeyboardEventInit) {
  return new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init })
}

describe('isPrintShortcut', () => {
  test('is Cmd+P on macOS', () => {
    expect(isPrintShortcut(keydown({ key: 'p', code: 'KeyP', metaKey: true }), true)).toBe(true)
    expect(isPrintShortcut(keydown({ key: 'p', code: 'KeyP', ctrlKey: true }), true)).toBe(false)
  })

  test('is Ctrl+P elsewhere', () => {
    expect(isPrintShortcut(keydown({ key: 'p', code: 'KeyP', ctrlKey: true }), false)).toBe(true)
    expect(isPrintShortcut(keydown({ key: 'p', code: 'KeyP', metaKey: true }), false)).toBe(false)
  })

  test('counts Caps Lock', () => {
    expect(isPrintShortcut(keydown({ key: 'P', code: 'KeyP', ctrlKey: true }), false)).toBe(true)
  })

  test('is not P with Shift or Alt, nor another key', () => {
    expect(isPrintShortcut(keydown({ key: 'P', code: 'KeyP', ctrlKey: true, shiftKey: true }), false)).toBe(false)
    expect(isPrintShortcut(keydown({ key: 'p', code: 'KeyP', ctrlKey: true, altKey: true }), false)).toBe(false)
    expect(isPrintShortcut(keydown({ key: 'o', code: 'KeyO', ctrlKey: true }), false)).toBe(false)
    expect(isPrintShortcut(keydown({ key: 'p', code: 'KeyP' }), false)).toBe(false)
  })

  test('follows the letter, not the key position, on Latin layouts (Dvorak)', () => {
    expect(isPrintShortcut(keydown({ key: 'p', code: 'KeyR', ctrlKey: true }), false)).toBe(true)
    expect(isPrintShortcut(keydown({ key: 'l', code: 'KeyP', ctrlKey: true }), false)).toBe(false)
  })

  test('follows the key position on layouts without Latin letters', () => {
    expect(isPrintShortcut(keydown({ key: 'з', code: 'KeyP', ctrlKey: true }), false)).toBe(true)
    expect(isPrintShortcut(keydown({ key: 'х', code: 'BracketLeft', ctrlKey: true }), false)).toBe(false)
  })
})

describe('listenForPrintShortcut', () => {
  const ctrlP = () => keydown({ key: 'p', code: 'KeyP', ctrlKey: true })

  test('prints instead of the browser', () => {
    const print = vi.fn()
    const stop = listenForPrintShortcut(window, print)
    const event = ctrlP()

    document.body.dispatchEvent(event)
    stop()

    expect(print).toHaveBeenCalledTimes(1)
    expect(event.defaultPrevented).toBe(true)
  })

  test('takes Cmd+P on macOS', () => {
    vi.mocked(isMac).mockReturnValueOnce(true)
    const print = vi.fn()
    const stop = listenForPrintShortcut(window, print)

    document.body.dispatchEvent(ctrlP())
    document.body.dispatchEvent(keydown({ key: 'p', code: 'KeyP', metaKey: true }))
    stop()

    expect(print).toHaveBeenCalledTimes(1)
  })

  test('leaves other keys alone', () => {
    const print = vi.fn()
    const stop = listenForPrintShortcut(window, print)
    const event = keydown({ key: 'b', code: 'KeyB', ctrlKey: true })

    document.body.dispatchEvent(event)
    stop()

    expect(print).not.toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(false)
  })

  test('prints once while the shortcut is held, but keeps the browser from printing', () => {
    const print = vi.fn()
    const stop = listenForPrintShortcut(window, print)
    const repeat = keydown({ key: 'p', code: 'KeyP', ctrlKey: true, repeat: true })

    document.body.dispatchEvent(repeat)
    stop()

    expect(print).not.toHaveBeenCalled()
    expect(repeat.defaultPrevented).toBe(true)
  })

  test('stops listening', () => {
    const print = vi.fn()
    listenForPrintShortcut(window, print)()
    const event = ctrlP()

    document.body.dispatchEvent(event)

    expect(print).not.toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(false)
  })
})

describe('usePrintShortcut', () => {
  test('prints with the latest function while there is one, and leaves the shortcut to the browser otherwise', () => {
    const first = vi.fn()
    const latest = vi.fn()
    const { rerender, unmount } = renderHook(({ print }) => usePrintShortcut(print), {
      initialProps: { print: undefined as (() => void) | undefined },
    })

    const beforeReady = keydown({ key: 'p', code: 'KeyP', ctrlKey: true })
    document.body.dispatchEvent(beforeReady)
    expect(beforeReady.defaultPrevented).toBe(false)

    rerender({ print: first })
    rerender({ print: latest })
    const whenReady = keydown({ key: 'p', code: 'KeyP', ctrlKey: true })
    document.body.dispatchEvent(whenReady)
    expect(whenReady.defaultPrevented).toBe(true)
    expect(first).not.toHaveBeenCalled()
    expect(latest).toHaveBeenCalledTimes(1)

    unmount()
    const afterUnmount = keydown({ key: 'p', code: 'KeyP', ctrlKey: true })
    document.body.dispatchEvent(afterUnmount)
    expect(afterUnmount.defaultPrevented).toBe(false)
  })
})
