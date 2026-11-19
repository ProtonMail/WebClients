import { c } from 'ttag'

import type { HomepageMessages } from '~/homepage'

export function createNamesMessages(): Pick<HomepageMessages, 'names'> {
  return {
    names: {
      me: c('Info').t`Me`,
      unknownUser: c('Label').t`Unknown user`,
      undecryptable: c('Label').t`⚠️ Undecryptable name`,
    },
  }
}
