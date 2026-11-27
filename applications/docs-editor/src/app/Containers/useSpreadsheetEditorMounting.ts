import { useCallback, useRef, useState } from 'react'

const waitForNextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

/**
 * Lets the update replay debug tool unmount the Sheets editor while it applies updates, then mount it again, so the
 * editor loads them from the Y.Doc as when a sheet opens instead of applying them one by one.
 */
export function useSpreadsheetEditorMounting() {
  const [isSpreadsheetEditorUnmounted, setIsSpreadsheetEditorUnmounted] = useState(false)
  const isUnmountedRef = useRef(false)
  const resolvePendingMountRef = useRef<(() => void) | undefined>(undefined)

  const setSpreadsheetEditorMounted = useCallback(async (isMounted: boolean) => {
    if (isMounted === !isUnmountedRef.current) {
      return
    }
    isUnmountedRef.current = !isMounted
    if (!isMounted) {
      setIsSpreadsheetEditorUnmounted(true)
      return
    }
    await new Promise<void>((resolve) => {
      resolvePendingMountRef.current = resolve
      setIsSpreadsheetEditorUnmounted(false)
    })
  }, [])

  /**
   * The editor reads the sheet from the Y.Doc in its mount effects, before it says it's ready, and renders it on the
   * next frames: waiting for those lets the replay tool's next snapshot of the sheet see what it loaded.
   */
  const onSpreadsheetEditorReady = useCallback(async () => {
    const resolvePendingMount = resolvePendingMountRef.current
    if (!resolvePendingMount) {
      return
    }
    resolvePendingMountRef.current = undefined
    await waitForNextFrame()
    await waitForNextFrame()
    resolvePendingMount()
  }, [])

  return { isSpreadsheetEditorUnmounted, setSpreadsheetEditorMounted, onSpreadsheetEditorReady }
}
