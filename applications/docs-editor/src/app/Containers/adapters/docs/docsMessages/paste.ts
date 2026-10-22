import { c } from 'ttag'
import type { DocsMessages } from '../../../Docs/public'

export function createPasteMessages(): Pick<DocsMessages, 'paste'> {
  return {
    paste: {
      tooLarge: c('Info')
        .t`The content you are attempting to paste is too large to be pasted at once. Try again by pasting in smaller pieces at a time.`,
      invalidCharacters: c('Info').t`This paste was blocked because the text contains invalid characters.`,
    },
  }
}
