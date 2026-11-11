import { useEffect, useMemo } from 'react'

import type { Session } from '@proton-docs/realtime-sdk'

import { UpdateRecorder } from './UpdateRecorder'

/**
 * Records `session`'s base state and the updates it receives, starting again from each replaced base state. The
 * caller records what it sends, since the session tells of no sent update.
 */
export function useUpdateRecorder(session: Session | undefined): UpdateRecorder | undefined {
  const recorder = useMemo(() => session && new UpdateRecorder(session.getBaseState()), [session])

  useEffect(() => {
    if (!session || !recorder) {
      return
    }

    const removeListeners = [
      session.on('update', (update) => recorder.recordReceived(update)),
      session.on('baseStateReplaced', ({ base }) => recorder.reset(base)),
    ]
    return () => removeListeners.forEach((removeListener) => removeListener())
  }, [recorder, session])

  return recorder
}
