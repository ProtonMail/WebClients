import { useEffect } from 'react'
import { type DocumentSession, commentsOf } from './loadDocument'

/**
 * Has the browser ask before the page is left while `session` holds edits the server has not acknowledged, which a
 * closed tab loses (ADR-0010), or comment changes still waiting for the connection, which live only in the page
 * (ADR-0021). Reads them when the user leaves, so anything but `synced` with none waiting warns.
 */
export function useLeaveWarning(session: DocumentSession | undefined): void {
  useEffect(() => {
    if (!session) {
      return
    }

    const warnUnlessSynced = (event: BeforeUnloadEvent) => {
      const waitingComments = commentsOf(session)?.getSnapshot().waitingChanges ?? 0
      if (session.getSnapshot().delivery !== 'synced' || waitingComments > 0) {
        event.preventDefault()
        // Browsers before Chrome 119 prompt only when returnValue is set
        event.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', warnUnlessSynced)
    return () => window.removeEventListener('beforeunload', warnUnlessSynced)
  }, [session])
}
