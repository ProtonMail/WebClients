import { useMemo } from 'react'

import { Button } from '@proton/atoms/Button/Button'
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip'
import { UserAvatar, UserAvatarSizeEnum } from '@proton/atoms/UserAvatar/UserAvatar'
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu'
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton'
import SimpleDropdown from '@proton/components/components/dropdown/SimpleDropdown'
import type { SafeDocsUserState } from '@proton/docs-shared/Doc/DocsAwareness'
import clsx from '@proton/utils/clsx'
import type { Participant } from '@proton-docs/realtime-sdk'

import { useApplication } from '~/utils/application-context'

import type { EditorInvoker } from '../__utils/EditorInvoker'
import { getActiveUsers } from '../__utils/activeUsers'

export type DocumentActiveUsersProps = {
  participants: Participant[]
  /** Undefined until the editor holds the base state, when a click scrolls nowhere */
  editorInvoker: Pick<EditorInvoker, 'syncEvent'> | undefined
  className?: string
}

const NumberOfVisibleUsers = 5

/**
 * Copied from the docs app's `DocumentLayout/DocumentHeader/DocumentActiveUsers.tsx`, which reads docs-core's event bus
 * and synced state: an avatar per user among the session's participants, the first five shown and the rest in a +N
 * dropdown, each scrolling to the user's cursor on click. Shows nothing while the user is alone.
 */
export function DocumentActiveUsers({ participants, editorInvoker, className }: DocumentActiveUsersProps) {
  const { logger } = useApplication()
  const users = useMemo(() => getActiveUsers(participants), [participants])
  const onScrollToUser = (state: SafeDocsUserState) => {
    editorInvoker
      ?.syncEvent({ name: 'ScrollToUserCursorData', payload: { state } })
      .catch((error) => logger.warn("Failed to have the editor scroll to a user's cursor", error))
  }
  const visibleUsers = users.slice(0, NumberOfVisibleUsers)
  const hiddenUsers = users.slice(NumberOfVisibleUsers)

  if (users.length <= 1) {
    return null
  }

  return (
    <div className={clsx('flex items-center gap-2', className)} data-testid="active-users">
      {visibleUsers.map(({ id, name, color, letter, faded, state }) => (
        <Tooltip title={name} key={id}>
          <UserAvatar
            as="button"
            size={UserAvatarSizeEnum.Small}
            name={letter ?? name}
            className={clsx('text-[0.75rem]', faded && 'opacity-50')}
            color={color ? { hsl: color } : undefined}
            onClick={() => onScrollToUser(state)}
            capitalize={!letter}
          />
        </Tooltip>
      ))}
      {hiddenUsers.length > 0 && (
        <SimpleDropdown
          as={Button}
          className="bg-strong flex h-7 w-7 items-center justify-center rounded p-0 text-xs"
          content={
            <>
              +{Math.min(hiddenUsers.length, 99)} <span className="sr-only">users</span>
            </>
          }
          hasCaret={false}
        >
          <DropdownMenu>
            {hiddenUsers.map(({ id, name, color, letter, faded, state }) => (
              <Tooltip title={name} key={id}>
                <DropdownMenuButton
                  className="flex items-center gap-2 px-4 py-2 text-left text-sm"
                  onClick={() => onScrollToUser(state)}
                >
                  {/* Not a button, unlike /doc's, as it sits in one */}
                  <UserAvatar
                    size={UserAvatarSizeEnum.Small}
                    name={letter ?? name}
                    className={clsx('text-[0.75rem]', faded && 'opacity-50')}
                    color={color ? { hsl: color } : undefined}
                    capitalize={!letter}
                  />
                  <span>{name}</span>
                </DropdownMenuButton>
              </Tooltip>
            ))}
          </DropdownMenu>
        </SimpleDropdown>
      )}
    </div>
  )
}
