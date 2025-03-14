import { useEffect, useState } from 'react'
import { Tooltip } from '@proton/components'
import clsx from '@proton/utils/clsx'
import { useApplication } from '../../../../utils/application-context'
import type { DocsAwarenessStateChangeData, SafeDocsUserState } from '@proton/docs-shared'
import { DocAwarenessEvent, UserAvatar } from '@proton/docs-shared'

export type DocumentActiveUsersProps = { className?: string }

export function DocumentActiveUsers({ className }: DocumentActiveUsersProps) {
  const application = useApplication()
  const [states, setStates] = useState<SafeDocsUserState[]>([])

  useEffect(() => {
    return application.eventBus.addEventCallback<DocsAwarenessStateChangeData>((data) => {
      for (const state of data.states) {
        if (!state.name) {
          console.error('User state missing name', state)
          state.name = '?'
        }
      }
      const deduped = data.states.filter((state, index, self) => {
        return self.findIndex((t) => t.awarenessData?.userId === state.awarenessData?.userId) === index
      })
      setStates(deduped)
    }, DocAwarenessEvent.AwarenessStateChange)
  }, [application.eventBus])

  if (states.length <= 1) {
    return null
  }

  return (
    <div className={clsx('flex items-center gap-2', className)} data-testid="active-users">
      {states.map((state, index) => {
        const { name, color, focusing, awarenessData } = state

        const letter = awarenessData?.anonymousUserLetter

        return (
          <Tooltip title={name} key={index}>
            <UserAvatar
              name={letter ? letter : name}
              useFirstLetterOfName={!letter}
              className={!focusing ? 'opacity-50' : ''}
              color={{ hsl: color }}
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
