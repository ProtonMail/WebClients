import { c } from 'ttag'
import type { DocsMessages } from '../../../Docs/public'

export function createTableOfContentsMessages(): Pick<DocsMessages, 'tableOfContents'> {
  return {
    tableOfContents: {
      outline: c('Title').t`Outline`,
      openOutline: c('Action').t`Open outline`,
      closeOutline: c('Action').t`Close outline`,
      newBadge: c('Info').t`NEW`,
      moreOptions: c('Action').t`More options`,
      copyLink: c('Action').t`Copy link`,
    },
  }
}
