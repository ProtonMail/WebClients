import { useEffect } from 'react'

import type { Session } from '@proton-docs/realtime-sdk'

/**
 * Has the browser ask before the page is left while `session` holds edits the server has not acknowledged, which a
 * closed tab loses (ADR-0010). Reads `delivery` when the user leaves, so anything but `synced` warns.
 */
export function useLeaveWarning(session: Session | undefined): void {
  useEffect(() => {
    if (!session) {
      return
    }

    const warnUnlessSynced = (event: BeforeUnloadEvent) => {
      if (session.getSnapshot().delivery !== 'synced') {
        event.preventDefault()
        // Browsers before Chrome 119 prompt only when returnValue is set
        event.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', warnUnlessSynced)
    return () => window.removeEventListener('beforeunload', warnUnlessSynced)
  }, [session])
}
