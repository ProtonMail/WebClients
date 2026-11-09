import { c } from 'ttag'
import type { DocsMessages } from '@proton-docs/docs-editor'

export function createDocsLayoutMessages(): Pick<DocsMessages, 'docsLayout'> {
  return {
    docsLayout: {
      resizeOutline: c('Label').t`Resize outline`,
    },
  }
}
