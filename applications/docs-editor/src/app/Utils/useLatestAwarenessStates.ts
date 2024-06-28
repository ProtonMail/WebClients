import { UserState } from '@lexical/yjs'
import { Application } from '../Application'
import { useEffect, useState } from 'react'
import { DocAwarenessEvent, DocsAwarenessStateChangeData } from '@proton/docs-shared'

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
