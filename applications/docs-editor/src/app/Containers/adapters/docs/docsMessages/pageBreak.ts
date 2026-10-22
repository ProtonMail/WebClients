import { c } from 'ttag'
import type { DocsMessages } from '../../../Docs/public'

export function createPageBreakMessages(): Pick<DocsMessages, 'pageBreak'> {
  return {
    pageBreak: {
      label: c('Label').t`Page break`,
    },
  }
}
