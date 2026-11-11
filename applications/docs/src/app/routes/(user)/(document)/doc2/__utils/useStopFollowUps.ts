import { useEffect } from 'react'

import type { Session, SessionStatus } from '@proton-docs/realtime-sdk'
import { c } from 'ttag'

import { useApplication } from '~/utils/application-context'

export type AlertProps = { title: string; translatedMessage: string }

/**
 * What /doc does past its "Offline" pill when a session stops for some conditions:
 * - `encryptionFailed`: /doc's alert for an edit it could not encrypt (docs-core `WebsocketService`, shown by
 *   `DocumentViewer.tsx`), with its copy.
 * - `authExpired`: the SDK's Docs API calls already go through the app's 401 refresh (`createDocsApiFetch`), which
 *   takes the user to the app's sign-in when it fails, so no app session check is needed here. The session is still
 *   retried once: the SDK reconnects once itself before it stops for expired credentials, except when its reconnect
 *   budget runs out first, which stops it as `authExpired` too. The snapshot doesn't tell the two apart, so the retry
 *   also follows the usual stop, where it is expected to fail again; it can go once the SDK reports a budget stop
 *   otherwise, as it does for `permissionsChanged`. Once per session, so a server that keeps refusing the credentials
 *   leaves the session stopped.
 */
export function useStopFollowUps(session: Session | undefined, showAlert: (props: AlertProps) => void): void {
  const { logger } = useApplication()

  useEffect(() => {
    if (!session) {
      return
    }

    let disposed = false
    let handledStatus: SessionStatus | undefined
    let retriedAuthExpired = false

    const followUp = () => {
      const { status } = session.getSnapshot()
      if (status.name !== 'stopped' || status === handledStatus) {
        return
      }
      handledStatus = status

      if (status.condition === 'encryptionFailed') {
        showAlert({
          title: c('Title').t`Something went wrong`,
          translatedMessage: c('Error').t`We are having trouble saving recent edits. Please refresh the page.`,
        })
        return
      }

      if (status.condition === 'authExpired' && !retriedAuthExpired) {
        retriedAuthExpired = true
        logger.info('Document session stopped for expired credentials, retrying it once')
        // Out of the snapshot listener: retry() called inside it settles on this stop, not on the reconnect it starts
        queueMicrotask(() => {
          if (disposed || session.getSnapshot().status !== status) {
            return
          }
          session.retry().catch((error) => logger.warn('Failed to retry the document session', error))
        })
      }
    }

    const unsubscribe = session.subscribe(followUp)
    followUp()

    return () => {
      disposed = true
      unsubscribe()
    }
  }, [logger, session, showAlert])
}
