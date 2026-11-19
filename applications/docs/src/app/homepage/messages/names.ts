import { c } from 'ttag'

export function createNamesMessages() {
  return {
    names: {
      me: c('Info').t`Me`,
      unknownUser: c('Label').t`Unknown user`,
      undecryptable: c('Label').t`⚠️ Undecryptable name`,
    },
  }
}
