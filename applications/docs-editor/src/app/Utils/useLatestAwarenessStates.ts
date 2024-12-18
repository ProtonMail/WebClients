import type { UserState } from '@lexical/yjs'
import type { Application } from '../Lib/Application'
import { useEffect, useState } from 'react'
import type { DocsAwarenessStateChangeData } from '@proton/docs-shared'
import { DocAwarenessEvent } from '@proton/docs-shared'

export function useLatestAwarenessStates(application: Application) {
  const [states, setStates] = useState<UserState[]>([])

  useEffect(() => {
    const eventBus = application.eventBus

    return eventBus.addEventCallback<DocsAwarenessStateChangeData>((data) => {
      setStates(data.states)
    }, DocAwarenessEvent.AwarenessStateChange)
  }, [application.eventBus])

  return states
}
