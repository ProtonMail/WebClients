import type { DocsMessages } from '../../../Docs/public'
import { createColorMenuMessages } from './colorMenu'
import { createCommentsMessages } from './comments'
import { createEmojiMessages } from './emoji'
import { createSuggestionsMessages } from './suggestions'
import { createToolbarMessages } from './toolbar'

/** Recreate after the host activates a locale. All feature groups are mandatory. */
export function createDocsMessages(): DocsMessages {
  return {
    ...createEmojiMessages(),
    ...createToolbarMessages(),
    ...createColorMenuMessages(),
    ...createCommentsMessages(),
    ...createSuggestionsMessages(),
  }
}
