import { c } from 'ttag'

import type { HomepageMessages } from '~/homepage'

export function createSortMessages(): Pick<HomepageMessages, 'sort'> {
  return {
    sort: {
      sortBy: c('Action').t`Sort by`,
      changeSortOrder: c('Action').t`Change sort order`,
      options: {
        viewed: c('Sort menu options').t`Last viewed first`,
        name: c('Sort menu options').t`Name`,
        owner: c('Sort menu options').t`Created by`,
        location: c('Sort menu options').t`Location`,
        // TODO: re-enable once "last modified" is supported.
        // modified: c('Actions').t`Last modified first`,
      },
    },
  }
}
