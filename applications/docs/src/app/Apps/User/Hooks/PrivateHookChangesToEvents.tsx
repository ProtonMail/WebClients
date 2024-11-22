import { useEffect } from 'react'
import { useDocsNotifications } from '../../../Containers/DocsNotificationsProvider'
import type { DocumentPropertiesState } from '@proton/docs-core'
import { useApplication } from '../../../Containers/ApplicationProvider'

/**
 * Render this component somewhere so that hook changes are published to the event bus so classes can react to them.
 *
 * Only usable by the private app.
 */
export function PrivateHookChangesToEvents() {
  const { sharedState } = useApplication()

  usePrivateHooksToEvents({ state: sharedState })

  return null
}

export function usePrivateHooksToEvents({ state }: { state: DocumentPropertiesState }) {
  const { emailTitleEnabled, emailNotificationsEnabled } = useDocsNotifications()

  useEffect(() => {
    state.setProperty('userAccountEmailDocTitleEnabled', emailTitleEnabled ?? false)
  }, [emailTitleEnabled, state])

  useEffect(() => {
    state.setProperty('userAccountEmailNotificationsEnabled', emailNotificationsEnabled ?? false)
  }, [emailNotificationsEnabled, state])

  return null
}
