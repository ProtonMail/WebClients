import type { DocsMessages } from '../../../Docs/public'
import { createColorMenuMessages } from './colorMenu'
import { createEmojiMessages } from './emoji'
import { createToolbarMessages } from './toolbar'

/** Recreate after the host activates a locale. All feature groups are mandatory. */
export function createDocsMessages(): DocsMessages {
  return {
    ...createEmojiMessages(),
    ...createToolbarMessages(),
    ...createColorMenuMessages(),
  }
}
