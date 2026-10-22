import { c } from 'ttag'
import type { DocsMessages } from '../../../Docs/public'

export function createEditorLoadMessages(): Pick<DocsMessages, 'editorLoad'> {
  return {
    editorLoad: {
      initializeFailed: c('Error').t`Failed to initialize editor due to unknown error.`,
      importWordFailed: c('Error').t`Failed to import Word document due to unknown error.`,
      importOdtFailed: c('Error').t`Failed to import OpenDocument file due to unknown error.`,
      importHtmlFailed: c('Error').t`Failed to import HTML due to unknown error.`,
      importMarkdownFailed: c('Error').t`Failed to import Markdown due to unknown error.`,
      unreadableWordDocument: c('Error')
        .t`Unable to convert Word document. Is it password protected? If so, please remove the password and try again.`,
    },
  }
}
