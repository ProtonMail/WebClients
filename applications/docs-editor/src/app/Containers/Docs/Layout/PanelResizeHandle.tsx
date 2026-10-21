import React from 'react'
import { clsx } from 'clsx'

const KEYBOARD_RESIZE_STEP = 10

export interface PanelResizeHandleProps {
  className: string
  label: string
  width: number
  minWidth: number
  maxWidth: number
  onResizeEnd: () => void
  onResize: (startWidth: number, delta: number) => void
  onReset: () => void
  onResizeStart: () => void
}

export function PanelResizeHandle({
  className,
  label,
  width,
  minWidth,
  maxWidth,
  onResizeEnd,
  onResize,
  onReset,
  onResizeStart,
}: PanelResizeHandleProps) {
  // Store event listeners created on resize to clean up if resizing is interrupted.
  const cleanupRef = React.useRef<(() => void) | null>(null)

  React.useEffect(() => {
    return () => {
      cleanupRef.current?.()
    }
  }, [])

  function handleResize(e: React.PointerEvent<HTMLDivElement>) {
    e.preventDefault()
    cleanupRef.current?.()

    const handle = e.currentTarget
    const pointerId = e.pointerId
    handle.setPointerCapture(pointerId)
    const startX = e.clientX
    const startWidth = handle.parentElement?.offsetWidth ?? 0

    onResizeStart()

    function onPointerMove(moveEvent: PointerEvent) {
      onResize(startWidth, moveEvent.clientX - startX)
    }

    function cleanupListeners() {
      try {
        handle.releasePointerCapture(pointerId)
      } catch {
        // Handle may already be unmounted.
      }
      handle.removeEventListener('pointermove', onPointerMove)
      handle.removeEventListener('pointerup', onPointerUp)
      handle.removeEventListener('pointercancel', onPointerUp)
      cleanupRef.current = null
      onResizeEnd()
    }

    function onPointerUp() {
      cleanupListeners()
    }

    cleanupRef.current = cleanupListeners

    handle.addEventListener('pointermove', onPointerMove)
    handle.addEventListener('pointerup', onPointerUp)
    handle.addEventListener('pointercancel', onPointerUp)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
      return
    }
    e.preventDefault()
    onResize(width, e.key === 'ArrowLeft' ? -KEYBOARD_RESIZE_STEP : KEYBOARD_RESIZE_STEP)
  }

  return (
    <div
      role="separator"
      tabIndex={0}
      aria-label={label}
      aria-orientation="vertical"
      aria-valuenow={width}
      aria-valuemin={minWidth}
      aria-valuemax={maxWidth}
      onKeyDown={handleKeyDown}
      onPointerDown={handleResize}
      onDoubleClick={onReset}
      className={clsx('absolute bottom-0 top-0 h-full w-3 cursor-col-resize max-[815px]:hidden', className)}
    >
      <div className="mx-auto h-full w-[1px] bg-[--border-weak]" />
    </div>
  )
}
