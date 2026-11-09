import { c } from 'ttag'
import type { DocsMessages } from '@proton-docs/docs-editor'

export function createSafeLexicalComposerMessages(): Pick<DocsMessages, 'safeLexicalComposer'> {
  return {
    safeLexicalComposer: {
      somethingWentWrong: c('Info').t`Something went wrong:`,
    },
  }
}
