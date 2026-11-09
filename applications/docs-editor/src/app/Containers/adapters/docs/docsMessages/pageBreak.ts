import { c } from 'ttag'
import type { DocsMessages } from '@proton-docs/docs-editor'

export function createPageBreakMessages(): Pick<DocsMessages, 'pageBreak'> {
  return {
    pageBreak: {
      label: c('Label').t`Page break`,
    },
  }
}
