import { useEffect } from 'react'
import { useDocsNotifications } from '../../../__utils/notifications-context'
import { useApplication } from '~/utils/application-context'
import type { UserState } from '@proton/docs-core'
import type { SyncedEditorState } from '@proton/docs-shared'
import { useContactEmails } from '@proton/mail/store/contactEmails/hooks'
import { useUser } from '@proton/account/user/hooks'

/**
 * Ensures that hook changes are published to the event bus so classes can react to them.
 */
export function PrivateHookChangesToEvents() {
  const { userState, syncedEditorState } = useApplication()

  usePrivateHooksToEvents({ userState, syncedEditorState })

  return null
}

function usePrivateHooksToEvents({
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
    syncedEditorState.setProperty('userName', user.DisplayName || user.Name || user.Email)
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
