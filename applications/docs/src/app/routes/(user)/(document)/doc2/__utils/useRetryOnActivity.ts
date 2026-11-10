import { useEffect, useState } from 'react'

import type { Session, SessionStatus } from '@proton-docs/realtime-sdk'

import { useApplication } from '~/utils/application-context'

const ACTIVITY_EVENTS = ['pointerdown', 'pointermove', 'wheel', 'keydown'] as const

function isIdleEvicted(status: SessionStatus): boolean {
  return status.name === 'stopped' && status.condition === 'idleEvicted'
}

/**
 * Retries `session` on the user's next pointer, wheel, key or visibility activity after RTS evicted it for idling, so
 * the session comes back as soon as they are active, and returns whether it waits for that activity. Retries once per
 * eviction, and only while the session is still stopped for it, so a retry from elsewhere, such as the status bar's,
 * is not repeated. The SDK keeps the same status object until the status changes, which tells one eviction from the
 * next. Activity inside the editor frame reaches only the frame's own window, so while this waits, the caller covers
 * the frame with an element of the page, which then gets that activity.
 */
export function useRetryOnActivity(session: Session | undefined): boolean {
  const { logger } = useApplication()
  const [waiting, setWaiting] = useState(false)

  useEffect(() => {
    if (!session) {
      return
    }

    let listening = false
    /** The eviction already retried, so that a snapshot change before the retry leaves it doesn't retry it again */
    let retriedStatus: SessionStatus | undefined

    const retry = () => {
      const { status } = session.getSnapshot()
      if (!isIdleEvicted(status) || status === retriedStatus) {
        return
      }
      retriedStatus = status
      stopListening()
      logger.info('Retrying the document session after an idle eviction, on user activity')
      session
        .retry()
        .catch((error) => logger.warn('Failed to retry the document session after an idle eviction', error))
    }
    const retryWhenVisible = () => {
      if (document.visibilityState === 'visible') {
        retry()
      }
    }

    function startListening() {
      if (listening) {
        return
      }
      listening = true
      setWaiting(true)
      ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, retry, { capture: true, passive: true }))
      document.addEventListener('visibilitychange', retryWhenVisible)
    }
    function stopListening() {
      if (!listening) {
        return
      }
      listening = false
      setWaiting(false)
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, retry, { capture: true }))
      document.removeEventListener('visibilitychange', retryWhenVisible)
    }

    const listenWhileIdleEvicted = () => {
      const { status } = session.getSnapshot()
      return isIdleEvicted(status) && status !== retriedStatus ? startListening() : stopListening()
    }
    const unsubscribe = session.subscribe(listenWhileIdleEvicted)
    listenWhileIdleEvicted()

    return () => {
      unsubscribe()
      stopListening()
    }
  }, [logger, session])

  return waiting
}
