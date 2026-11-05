import { useEffect } from 'react'

import type { Session, SessionStatus } from '@proton-docs/realtime-sdk'

import { useApplication } from '~/utils/application-context'

/** As docs-core `Realtime/WebsocketConnection.ts` closes its connection after the document hides for an hour */
export const PAUSE_WHEN_HIDDEN_FOR_MS = 60 * 60 * 1000

const PAUSABLE_STATUSES: SessionStatus['name'][] = ['connecting', 'connected', 'reconnecting', 'opening']

/**
 * Keeps `session` paused while the browser is offline or the tab has been hidden for PAUSE_WHEN_HIDDEN_FOR_MS, and
 * resumes it once neither holds. It checks again on every status change, since the session can only pause or resume
 * from some statuses, and a status can change after the browser event that asked for it. The SDK never pauses on its
 * own.
 */
export function usePauseWhileAway(session: Session | undefined): void {
  const { logger } = useApplication()

  useEffect(() => {
    if (!session) {
      return
    }

    let hiddenTooLong = false
    let hiddenTimeout: ReturnType<typeof setTimeout> | undefined
    let pausing = false
    let resuming = false

    const pauseOrResume = () => {
      const away = hiddenTooLong || !navigator.onLine
      const { name } = session.getSnapshot().status
      if (away && !pausing && PAUSABLE_STATUSES.includes(name)) {
        logger.info('Pausing the document session', { online: navigator.onLine, hiddenTooLong })
        pausing = true
        session
          .pause()
          .catch((error) => logger.warn('Failed to pause the document session', error))
          .finally(() => {
            pausing = false
          })
      } else if (!away && !resuming && name === 'paused') {
        logger.info('Resuming the document session')
        resuming = true
        session
          .resume()
          .catch((error) => logger.warn('Failed to resume the document session', error))
          .finally(() => {
            resuming = false
          })
      }
    }

    const watchVisibility = () => {
      clearTimeout(hiddenTimeout)
      if (document.visibilityState === 'hidden') {
        hiddenTimeout = setTimeout(() => {
          hiddenTooLong = true
          pauseOrResume()
        }, PAUSE_WHEN_HIDDEN_FOR_MS)
        return
      }
      hiddenTooLong = false
      pauseOrResume()
    }

    const unsubscribe = session.subscribe(pauseOrResume)
    window.addEventListener('online', pauseOrResume)
    window.addEventListener('offline', pauseOrResume)
    document.addEventListener('visibilitychange', watchVisibility)
    watchVisibility()

    return () => {
      clearTimeout(hiddenTimeout)
      unsubscribe()
      window.removeEventListener('online', pauseOrResume)
      window.removeEventListener('offline', pauseOrResume)
      document.removeEventListener('visibilitychange', watchVisibility)
    }
  }, [logger, session])
}
