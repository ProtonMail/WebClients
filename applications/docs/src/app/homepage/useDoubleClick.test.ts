import type { TouchEvent } from 'react'
import { renderHook } from '@testing-library/react'

import { useDoubleClick } from './useDoubleClick'

function touchEvent(clientX = 0, clientY = 0): TouchEvent {
  return { changedTouches: [{ clientX, clientY }] } as unknown as TouchEvent
}

function setup() {
  const onDoubleClick = jest.fn()
  const { result, unmount } = renderHook(() => useDoubleClick(onDoubleClick))

  const tap = (x = 0, y = 0) => {
    result.current.onTouchStart(touchEvent(x, y))
    result.current.onTouchEnd()
  }

  return { onDoubleClick, result, unmount, tap }
}

describe('useDoubleClick', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('mouse', () => {
    test('Will call the callback on double click', () => {
      const { onDoubleClick, result } = setup()

      result.current.onDoubleClick()

      expect(onDoubleClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('touch', () => {
    test('Will not call the callback on a single tap', () => {
      const { onDoubleClick, tap } = setup()

      tap()
      jest.runAllTimers()

      expect(onDoubleClick).not.toHaveBeenCalled()
    })

    test('Will call the callback on two taps within the time limit', () => {
      const { onDoubleClick, tap } = setup()

      tap()
      jest.advanceTimersByTime(499)
      tap()

      expect(onDoubleClick).toHaveBeenCalledTimes(1)
    })

    test('Will not call the callback if the second tap comes too late', () => {
      const { onDoubleClick, tap } = setup()

      tap()
      jest.advanceTimersByTime(500)
      tap()

      expect(onDoubleClick).not.toHaveBeenCalled()
    })

    test('Will treat a late second tap as a new first tap', () => {
      const { onDoubleClick, tap } = setup()

      tap()
      jest.advanceTimersByTime(500)
      tap()
      jest.advanceTimersByTime(100)
      tap()

      expect(onDoubleClick).toHaveBeenCalledTimes(1)
    })

    test('Will call the callback once on a triple tap', () => {
      const { onDoubleClick, tap } = setup()

      tap()
      tap()
      tap()

      expect(onDoubleClick).toHaveBeenCalledTimes(1)
    })

    test('Will start a new pair after a double tap', () => {
      const { onDoubleClick, tap } = setup()

      tap()
      tap()
      tap()
      tap()

      expect(onDoubleClick).toHaveBeenCalledTimes(2)
    })

    test('Will count a tap that moves within the tolerance', () => {
      const { onDoubleClick, result, tap } = setup()

      tap()
      result.current.onTouchStart(touchEvent(100, 100))
      result.current.onTouchMove(touchEvent(110, 90))
      result.current.onTouchEnd()

      expect(onDoubleClick).toHaveBeenCalledTimes(1)
    })

    test.each([
      ['horizontally', 111, 100],
      ['vertically', 100, 89],
    ])('Will not count a touch that moves beyond the tolerance %s', (_, x, y) => {
      const { onDoubleClick, result, tap } = setup()

      tap()
      result.current.onTouchStart(touchEvent(100, 100))
      result.current.onTouchMove(touchEvent(x, y))
      result.current.onTouchEnd()

      expect(onDoubleClick).not.toHaveBeenCalled()
    })

    test('Will not count a touch that moves away and comes back', () => {
      const { onDoubleClick, result, tap } = setup()

      tap()
      result.current.onTouchStart(touchEvent(100, 100))
      result.current.onTouchMove(touchEvent(150, 100))
      result.current.onTouchMove(touchEvent(100, 100))
      result.current.onTouchEnd()

      expect(onDoubleClick).not.toHaveBeenCalled()
    })

    test('Will forget the pending first tap after a scroll', () => {
      const { onDoubleClick, result, tap } = setup()

      tap()
      result.current.onTouchStart(touchEvent(0, 0))
      result.current.onTouchMove(touchEvent(0, 200))
      result.current.onTouchEnd()
      tap()

      expect(onDoubleClick).not.toHaveBeenCalled()
    })

    test('Will not count a cancelled touch', () => {
      const { onDoubleClick, result, tap } = setup()

      tap()
      result.current.onTouchStart(touchEvent())
      result.current.onTouchCancel()
      result.current.onTouchEnd()

      expect(onDoubleClick).not.toHaveBeenCalled()
    })

    test('Will not count a touch start without touches', () => {
      const { onDoubleClick, result, tap } = setup()

      tap()
      result.current.onTouchStart({ changedTouches: [] } as unknown as TouchEvent)
      result.current.onTouchEnd()

      expect(onDoubleClick).not.toHaveBeenCalled()
    })

    test('Will count two quick taps regardless of the distance between them', () => {
      const { onDoubleClick, tap } = setup()

      tap(0, 0)
      tap(200, 200)

      expect(onDoubleClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('touch and mouse together', () => {
    test('Will ignore a synthesized double click right after a double tap', () => {
      const { onDoubleClick, result, tap } = setup()

      tap()
      tap()
      result.current.onDoubleClick()

      expect(onDoubleClick).toHaveBeenCalledTimes(1)
    })

    test('Will handle a double click again once the double tap has settled', () => {
      const { onDoubleClick, result, tap } = setup()

      tap()
      tap()
      jest.advanceTimersByTime(500)
      result.current.onDoubleClick()

      expect(onDoubleClick).toHaveBeenCalledTimes(2)
    })
  })

  test('Will clear pending timers on unmount', () => {
    const { tap, unmount } = setup()

    tap()
    tap()
    tap()
    expect(jest.getTimerCount()).toBeGreaterThan(0)

    unmount()

    expect(jest.getTimerCount()).toBe(0)
  })
})
