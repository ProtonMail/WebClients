import { c } from 'ttag'

import type { HomepageMessages } from '~/homepage'

// `goTo` is copied from packages/shared/lib/i18n/ttag.ts: the same msgid, parameter name included, keeps its
// translations.
export function createSidebarMessages(): Pick<HomepageMessages, 'sidebar'> {
  return {
    sidebar: {
      new: c('Action').t`New`,
      recents: c('Info').t`Recents`,
      updateRecentDocuments: c('Info').t`Update recent documents`,
      all: c('Info').t`All`,
      documents: c('Info').t`Documents`,
      spreadsheets: c('Info').t`Spreadsheets`,
      trash: c('Info').t`Trash`,
      goTo: (planOrAppName: string) => c('Action').t`Go to ${planOrAppName}`,
      // translator: Label for the primary navigation for screen readers. Omit the word "navigation" as it's announced in the landmarks menu as "Main navigation" automatically.
      navigationLabel: c('Label').t`Main`,
      // translator: This is a hidden headline for users with screen readers to highlight the main navigation
      navigationHeading: c('Label').t`Navigation`,
      // Copied from Proton's `Hamburger` (packages/components/components/sidebar/Hamburger.tsx).
      closeNavigation: c('Action').t`Close navigation`,
    },
  }
}
