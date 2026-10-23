import type { TouchEvent } from 'react'
import { useEffect, useRef } from 'react'

// Copied from Drive's `useItemInteraction`.

const TOUCH_DOUBLE_TAP_MS = 500

// A tap is allowed to wander a little: a finger never lands perfectly still, and a
// mouse click in Chrome's touch emulation drifts a pixel or two.
const TOUCH_MOVE_TOLERANCE_PX = 10

/**
 * Calls `onDoubleClick` on a mouse double click or a touch double tap.
 *
 * Touch cannot rely on the browser synthesizing a dblclick out of two taps: while
 * the page is zoomable, the second tap is claimed by the double-tap-to-zoom gesture
 * and never reaches us. So the taps are counted here instead.
 */
export function useDoubleClick(onDoubleClick: () => void) {
  const tapStartRef = useRef<{ x: number; y: number } | null>(null)
  const tapTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const openedByTouchTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const openedByTouchRef = useRef(false)

  useEffect(
    () => () => {
      clearTimeout(tapTimerRef.current)
      clearTimeout(openedByTouchTimerRef.current)
    },
    [],
  )

  return {
    onDoubleClick: () => {
      // The touch path already fired; ignore the dblclick some browsers still
      // synthesize for the second tap so it does not fire twice.
      if (openedByTouchRef.current) {
        return
      }
      onDoubleClick()
    },
    onTouchStart: (event: TouchEvent) => {
      const touch = event.changedTouches[0]
      tapStartRef.current = touch ? { x: touch.clientX, y: touch.clientY } : null
    },
    onTouchMove: (event: TouchEvent) => {
      const start = tapStartRef.current
      const touch = event.changedTouches[0]
      if (!start || !touch) {
        return
      }
      const hasLeftTapArea =
        Math.abs(touch.clientX - start.x) > TOUCH_MOVE_TOLERANCE_PX ||
        Math.abs(touch.clientY - start.y) > TOUCH_MOVE_TOLERANCE_PX
      if (hasLeftTapArea) {
        tapStartRef.current = null
      }
    },
    onTouchCancel: () => {
      tapStartRef.current = null
    },
    onTouchEnd: () => {
      const wasTap = tapStartRef.current !== null
      tapStartRef.current = null

      // Scrolling rather than tapping: also forget any pending first tap.
      if (!wasTap) {
        clearTimeout(tapTimerRef.current)
        tapTimerRef.current = undefined
        return
      }

      if (!tapTimerRef.current) {
        tapTimerRef.current = setTimeout(() => {
          tapTimerRef.current = undefined
        }, TOUCH_DOUBLE_TAP_MS)
        return
      }

      clearTimeout(tapTimerRef.current)
      tapTimerRef.current = undefined

      openedByTouchRef.current = true
      clearTimeout(openedByTouchTimerRef.current)
      openedByTouchTimerRef.current = setTimeout(() => {
        openedByTouchRef.current = false
      }, TOUCH_DOUBLE_TAP_MS)

      onDoubleClick()
    },
  }
}
