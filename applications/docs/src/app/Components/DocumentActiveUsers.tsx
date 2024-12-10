import { useEffect, useState } from 'react'
import type { UserState } from '@lexical/yjs'
import { Tooltip } from '@proton/components'
import clsx from '@proton/utils/clsx'
import { useApplication } from '../Containers/ApplicationProvider'
import type { DocsAwarenessStateChangeData } from '@proton/docs-shared'
import { DocAwarenessEvent, UserAvatar } from '@proton/docs-shared'

export function DocumentActiveUsers({ className }: { className?: string }) {
  const application = useApplication()
  const [states, setStates] = useState<UserState[]>([])

  useEffect(() => {
    return application.eventBus.addEventCallback<DocsAwarenessStateChangeData>((data) => {
      for (const state of data.states) {
        if (!state.name) {
          console.error('User state missing name', state)
          state.name = '?'
        }
      }
      setStates(data.states)
    }, DocAwarenessEvent.AwarenessStateChange)
  }, [application.eventBus])

  if (states.length <= 1) {
    return null
  }

  return (
    <div className={clsx('flex items-center gap-2', className)} data-testid="active-users">
      {states.map((state, index) => {
        const { name, color, focusing } = state
        return (
          <Tooltip title={name} key={index}>
            <UserAvatar
              name={name}
              className={!focusing ? 'opacity-50' : ''}
              color={{
                hsl: color,
              }}
              onClick={() => {
                application.syncedEditorState.emitEvent({
                  name: 'ScrollToUserCursorData',
                  payload: { state },
                })
              }}
            />
          </Tooltip>
        )
      })}
    </div>
  )
}
