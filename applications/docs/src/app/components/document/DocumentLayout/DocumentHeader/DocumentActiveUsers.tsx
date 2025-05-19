import { useEffect, useMemo, useState } from 'react'
import { DropdownMenu, DropdownMenuButton, SimpleDropdown, Tooltip } from '@proton/components'
import clsx from '@proton/utils/clsx'
import { useApplication } from '~/utils/application-context'
import type { DocsAwarenessStateChangeData, SafeDocsUserState } from '@proton/docs-shared'
import { DocAwarenessEvent } from '@proton/docs-shared'
import { Button, UserAvatar, UserAvatarSizeEnum } from '@proton/atoms'

export type DocumentActiveUsersProps = { className?: string }

const NumberOfVisibleUsers = 5

export function DocumentActiveUsers({ className }: DocumentActiveUsersProps) {
  const application = useApplication()
  const [states, setStates] = useState<SafeDocsUserState[]>([])

  useEffect(() => {
    return application.eventBus.addEventCallback<DocsAwarenessStateChangeData>((data) => {
      for (const state of data.states) {
        if (!state.name) {
          if (state.title) {
            state.name = state.title
          } else {
            console.error('User state missing name', state)
            state.name = '?'
          }
        }
      }
      const deduped = data.states.filter((state, index, self) => {
        if (!state.awarenessData) {
          return true
        }
        return self.findIndex((t) => t.awarenessData?.userId === state.awarenessData?.userId) === index
      })
      setStates(deduped)
    }, DocAwarenessEvent.AwarenessStateChange)
  }, [application.eventBus])

  const visibleStates = useMemo(() => states.slice(0, NumberOfVisibleUsers), [states])
  const hiddenStates = useMemo(() => states.slice(NumberOfVisibleUsers), [states])

  if (states.length <= 1) {
    return null
  }

  return (
    <div className={clsx('flex items-center gap-2', className)} data-testid="active-users">
      {visibleStates.map((state, index) => {
        const { name, color, focusing, awarenessData } = state

        const letter = awarenessData?.anonymousUserLetter

        return (
          <Tooltip title={name} key={index}>
            <UserAvatar
              as="button"
              size={UserAvatarSizeEnum.Small}
              name={letter ? letter : name}
              className={clsx('text-[0.75rem]', awarenessData && !focusing && 'opacity-50')}
              color={{ hsl: color }}
              onClick={() => {
                application.syncedEditorState.emitEvent({
                  name: 'ScrollToUserCursorData',
                  payload: { state },
                })
              }}
              capitalize={!letter}
            />
          </Tooltip>
        )
      })}
      {hiddenStates.length > 0 && (
        <SimpleDropdown
          as={Button}
          className="bg-strong flex h-7 w-7 items-center justify-center rounded p-0 text-xs"
          content={
            <>
              +{Math.min(hiddenStates.length, 99)}
              <span className="sr-only">users</span>
            </>
          }
          hasCaret={false}
        >
          <DropdownMenu>
            {hiddenStates.map((state, index) => {
              const { name, color, focusing, awarenessData } = state

              const letter = awarenessData?.anonymousUserLetter

              return (
                <Tooltip title={name} key={index}>
                  <DropdownMenuButton
                    className="flex items-center gap-2 px-4 py-2 text-left text-sm"
                    onClick={() => {
                      application.syncedEditorState.emitEvent({
                        name: 'ScrollToUserCursorData',
                        payload: { state },
                      })
                    }}
                  >
                    <UserAvatar
                      as="button"
                      size={UserAvatarSizeEnum.Small}
                      name={letter ? letter : name}
                      className={clsx('text-[0.75rem]', awarenessData && !focusing && 'opacity-50')}
                      color={{ hsl: color }}
                      capitalize={!letter}
                    />
                    <span>{name}</span>
                  </DropdownMenuButton>
                </Tooltip>
              )
            })}
          </DropdownMenu>
        </SimpleDropdown>
      )}
    </div>
  )
}
