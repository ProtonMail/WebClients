import { useEffect, useRef } from 'react'

/**
 * Covers the editor frame while an idle-evicted session waits for the user, and takes the focus from it, so that
 * pointer, wheel and key activity over the document reaches the page, which retries the session. The editor is locked
 * while the session is stopped, so nothing is lost; the cover goes with the retry.
 */
export function IdleActivityCatcher() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    ref.current?.focus({ preventScroll: true })
  }, [])

  return <div ref={ref} tabIndex={-1} className="absolute inset-0 outline-none" data-testid="idle-activity-catcher" />
}
