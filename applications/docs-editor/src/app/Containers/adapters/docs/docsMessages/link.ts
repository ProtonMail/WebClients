import { c } from 'ttag'
import type { DocsMessages } from '../../../Docs/public'

export function createLinkMessages(): Pick<DocsMessages, 'link'> {
  return {
    link: {
      textLabel: c('Label').t`Link text`,
      textPlaceholder: c('Placeholder').t`Text`,
      urlLabel: c('Label').t`Link URL`,
      urlPlaceholder: c('Placeholder').t`Paste link`,
      cancel: c('Action').t`Cancel`,
      apply: c('Action').t`Apply`,
      copy: c('Action').t`Copy link`,
      edit: c('Action').t`Edit link`,
      remove: c('Action').t`Remove link`,
    },
  }
}
