import { c } from 'ttag'
import type { DocsMessages } from '../../../Docs/public'

export function createSuggestionsMessages(): Pick<DocsMessages, 'suggestions'> {
  return {
    suggestions: {
      codeBlocksNotSupported: c('Warning').t`Making suggestions inside code blocks is not supported`,
      languageNotSupportedTitle: c('Title').t`Language not supported`,
      languageNotSupportedMessage: c('Info')
        .t`The language you're using isn’t currently supported in suggestion mode. Please switch to edit mode or change the language.`,
    },
  }
}
