import { c } from 'ttag'

import type { HomepageMessages } from '~/homepage'

export function createHeaderMessages(): Pick<HomepageMessages, 'header'> {
  return {
    header: {
      search: c('Action').t`Search`,
      searchRecents: c('Action').t`Search recents`,
      searchRecentDocuments: c('Action').t`Search recent documents`,
      searchRecentSpreadsheets: c('Action').t`Search recent spreadsheets`,
      recents: c('Info').t`Recents`,
      trash: c('Info').t`Trash`,
      // Copied from Proton's `Hamburger` (packages/components/components/sidebar/Hamburger.tsx).
      openNavigation: c('Action').t`Open navigation`,
      closeNavigation: c('Action').t`Close navigation`,
      // Copied from Proton's `PrivateAppContainer` (packages/components/containers/app/PrivateAppContainer.tsx).
      skipToMainContent: c('Action').t`Skip to main content`,
    },
  }
}
