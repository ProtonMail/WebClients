import { c } from 'ttag'

export function createLoadingMessages() {
  return {
    loading: {
      loading: c('Info').t`Loading`,
      myFilesFailed: c('Error').t`Failed to load 'My files' folder`,
      recentsFailed: c('Error').t`Failed to load recent documents`,
      someRecentsFailed: c('Error').t`Some documents could not be loaded`,
      someTrashedFailed: c('Error').t`Some trashed documents could not be loaded`,
      recentsUpdated: c('Notification').t`Recent documents updated`,
    },
  }
}
