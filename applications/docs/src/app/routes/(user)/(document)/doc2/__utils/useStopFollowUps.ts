import { useEffect } from 'react'

import { useApi } from '@proton/app-context/useApi'
import { getIs401Error } from '@proton/shared/lib/api/helpers/apiErrorHelper'
import { getUser } from '@proton/shared/lib/api/user'
import type { Session, SessionStatus } from '@proton-docs/realtime-sdk'
import { c } from 'ttag'

import { useApplication } from '~/utils/application-context'

export type AlertProps = { title: string; translatedMessage: string }

/**
 * What /doc does past its "Offline" pill when a session stops for some conditions:
 * - `encryptionFailed`: /doc's alert for an edit it could not encrypt (docs-core `WebsocketService`, shown by
 *   `DocumentViewer.tsx`), with its copy.
 * - `authExpired`: /doc's connection token comes through the app's API client, which refreshes an expired session on
 *   a 401 or, failing that, takes the user through the app's sign-in. This sends one authenticated request through
 *   that client, then retries the session once it succeeds: it reaches the app's sign-in when the SDK's own calls
 *   don't go through that client, and when they do (a host `api.fetch`), it finds the session already refreshed or
 *   already signed out, and adds no refresh of its own. A check that fails other than with a 401 retries too, so a
 *   network failure ends in a stop the user can retry. Once per session, so a server that keeps refusing the
 *   credentials leaves the session stopped, as /doc does.
 */
export function useStopFollowUps(session: Session | undefined, showAlert: (props: AlertProps) => void): void {
  const api = useApi()
  const { logger } = useApplication()

  useEffect(() => {
    if (!session) {
      return
    }

    let disposed = false
    let handledStatus: SessionStatus | undefined
    let triedSessionRefresh = false

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

      if (status.condition === 'authExpired' && !triedSessionRefresh) {
        triedSessionRefresh = true
        logger.info('Document session stopped for expired credentials, checking the app session')
        const retry = () => {
          if (disposed || session.getSnapshot().status !== status) {
            return
          }
          session.retry().catch((error) => logger.warn('Failed to retry the document session', error))
        }
        api(getUser()).then(retry, (error) => {
          if (disposed) {
            return
          }
          logger.warn('Failed to check the app session', error)
          // A 401 the app could not refresh: the app is taking the user to its sign-in. Any other failure, such as
          // going offline, says nothing about the credentials, so retry anyway and let the session report what it finds.
          if (!getIs401Error(error)) {
            retry()
          }
        })
      }
    }

    const unsubscribe = session.subscribe(followUp)
    followUp()

    return () => {
      disposed = true
      unsubscribe()
    }
  }, [api, logger, session, showAlert])
}
