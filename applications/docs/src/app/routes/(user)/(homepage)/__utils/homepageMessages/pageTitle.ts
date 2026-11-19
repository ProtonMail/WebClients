import { c } from 'ttag'

import type { HomepageMessages } from '~/homepage'

export function createPageTitleMessages(): Pick<HomepageMessages, 'pageTitle'> {
  return {
    pageTitle: {
      searching: c('Page title').t`Searching`,
      recents: c('Page title').t`Recents`,
      trash: c('Page title').t`Trash`,
    },
  }
}
