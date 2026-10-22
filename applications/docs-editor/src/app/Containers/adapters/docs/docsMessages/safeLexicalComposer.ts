import { c } from 'ttag'
import type { DocsMessages } from '../../../Docs/public'

export function createSafeLexicalComposerMessages(): Pick<DocsMessages, 'safeLexicalComposer'> {
  return {
    safeLexicalComposer: {
      somethingWentWrong: c('Info').t`Something went wrong:`,
    },
  }
}
