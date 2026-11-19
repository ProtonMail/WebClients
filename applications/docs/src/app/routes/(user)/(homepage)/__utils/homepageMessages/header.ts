import { c } from 'ttag'

import type { HomepageMessages } from '~/homepage'

export function createHeaderMessages(): Pick<HomepageMessages, 'header'> {
  return {
    header: {
      title: c('Title').t`Docs`,
      search: c('Action').t`Search`,
      searchRecents: c('Action').t`Search recents`,
      searchRecentDocuments: c('Action').t`Search recent documents`,
      searchRecentSpreadsheets: c('Action').t`Search recent spreadsheets`,
      recents: c('Info').t`Recents`,
      trash: c('Info').t`Trash`,
    },
  }
}
