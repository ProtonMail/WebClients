import { useEffect } from 'react'
import { useDocsNotifications } from '../../../Containers/DocsNotificationsProvider'
import { useApplication } from '../../../Containers/ApplicationProvider'
import type { UserState } from '@proton/docs-core'
import type { SyncedEditorState } from '@proton/docs-shared'
import { useContactEmails } from '@proton/mail/contactEmails/hooks'
import { useUser } from '@proton/account/user/hooks'

/**
 * Render this component somewhere so that hook changes are published to the event bus so classes can react to them.
 *
 * Only usable by the private app.
 */
export function PrivateHookChangesToEvents() {
  const { userState, syncedEditorState } = useApplication()

  usePrivateHooksToEvents({ userState, syncedEditorState })

  return null
}

export function usePrivateHooksToEvents({
  userState,
  syncedEditorState,
}: {
  userState: UserState
  syncedEditorState: SyncedEditorState
}) {
  const { emailTitleEnabled, emailNotificationsEnabled } = useDocsNotifications()

  const [user] = useUser()

  const [contactEmails] = useContactEmails()

  useEffect(() => {
    syncedEditorState.setProperty('userName', user.DisplayName)
  }, [user, syncedEditorState])

  useEffect(() => {
    syncedEditorState.setProperty('contactEmails', contactEmails ?? [])
  }, [contactEmails, syncedEditorState])

  useEffect(() => {
    userState.setProperty('userAccountEmailDocTitleEnabled', emailTitleEnabled ?? false)
  }, [emailTitleEnabled, userState])

  useEffect(() => {
    userState.setProperty('userAccountEmailNotificationsEnabled', emailNotificationsEnabled ?? false)
  }, [emailNotificationsEnabled, userState])

  return null
}
