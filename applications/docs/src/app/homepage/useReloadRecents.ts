import { useCallback } from 'react'
import { useHomepageMessages } from './messages/HomepageMessagesProvider'

import { useHomepageView } from './homepageViewContext'

export function useReloadRecents() {
  const { updateRecentDocuments, reloadInvitations, createNotification } = useHomepageView()
  const messages = useHomepageMessages().loading

  return useCallback(async () => {
    reloadInvitations()
    await updateRecentDocuments()
    createNotification({
      text: messages.recentsUpdated,
    })
  }, [updateRecentDocuments, reloadInvitations, createNotification, messages])
}
