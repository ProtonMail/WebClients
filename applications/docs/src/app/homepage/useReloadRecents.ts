import { useCallback } from 'react'
import { c } from 'ttag'

import { useHomepageView } from './homepageViewContext'

export function useReloadRecents() {
  const { updateRecentDocuments, reloadInvitations, createNotification } = useHomepageView()

  return useCallback(async () => {
    reloadInvitations()
    await updateRecentDocuments()
    createNotification({
      text: c('Notification').t`Recent documents updated`,
    })
  }, [updateRecentDocuments, reloadInvitations, createNotification])
}
