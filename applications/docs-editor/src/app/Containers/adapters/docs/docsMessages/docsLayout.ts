import { c } from 'ttag'
import type { DocsMessages } from '../../../Docs/public'

export function createDocsLayoutMessages(): Pick<DocsMessages, 'docsLayout'> {
  return {
    docsLayout: {
      resizeOutline: c('Label').t`Resize outline`,
    },
  }
}
