import React from 'react'
import clsx from '@proton/utils/clsx'

interface PanelResizeHandleProps {
  className: string
  onResizeEnd: () => void
  onResize: (startWidth: number, delta: number) => void
  onReset: () => void
  onResizeStart: () => void
}

export function PanelResizeHandle({
  className,
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

  return (
    <div
      aria-orientation="vertical"
      onPointerDown={handleResize}
      onDoubleClick={onReset}
      className={clsx('absolute bottom-0 top-0 h-full w-3 cursor-col-resize max-[815px]:hidden', className)}
    >
      <div className="mx-auto h-full w-[1px] bg-[--border-weak]" />
    </div>
  )
}
