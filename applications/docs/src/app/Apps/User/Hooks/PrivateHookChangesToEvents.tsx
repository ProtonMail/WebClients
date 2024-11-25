import { useEffect } from 'react'
import { useDocsNotifications } from '../../../Containers/DocsNotificationsProvider'
import { useApplication } from '../../../Containers/ApplicationProvider'
import type { UserState } from '@proton/docs-core/lib/State/UserState'

/**
 * Render this component somewhere so that hook changes are published to the event bus so classes can react to them.
 *
 * Only usable by the private app.
 */
export function PrivateHookChangesToEvents() {
  const { userState } = useApplication()

  usePrivateHooksToEvents({ userState })

  return null
}

export function usePrivateHooksToEvents({ userState }: { userState: UserState }) {
  const { emailTitleEnabled, emailNotificationsEnabled } = useDocsNotifications()

  useEffect(() => {
    userState.setProperty('userAccountEmailDocTitleEnabled', emailTitleEnabled ?? false)
  }, [emailTitleEnabled, userState])

  useEffect(() => {
    userState.setProperty('userAccountEmailNotificationsEnabled', emailNotificationsEnabled ?? false)
  }, [emailNotificationsEnabled, userState])

  return null
}
