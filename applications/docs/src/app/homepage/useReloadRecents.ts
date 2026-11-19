import { useCallback } from 'react'
import { createLoadingMessages } from './messages/loading'

import { useHomepageView } from './homepageViewContext'

export function useReloadRecents() {
  const { updateRecentDocuments, reloadInvitations, createNotification } = useHomepageView()

  return useCallback(async () => {
    reloadInvitations()
    await updateRecentDocuments()
    createNotification({
      text: createLoadingMessages().loading.recentsUpdated,
    })
  }, [updateRecentDocuments, reloadInvitations, createNotification])
}
