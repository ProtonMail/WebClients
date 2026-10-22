import type { DocsMessages } from '../../../Docs/public'
import { createColorMenuMessages } from './colorMenu'
import { createCommentsMessages } from './comments'
import { createDocsLayoutMessages } from './docsLayout'
import { createEditorLoadMessages } from './editorLoad'
import { createEmojiMessages } from './emoji'
import { createImageMessages } from './image'
import { createLinkMessages } from './link'
import { createPageBreakMessages } from './pageBreak'
import { createPasteMessages } from './paste'
import { createSafeLexicalComposerMessages } from './safeLexicalComposer'
import { createShortcutKbdMessages } from './shortcutKbd'
import { createSuggestionsMessages } from './suggestions'
import { createTableOfContentsMessages } from './tableOfContents'
import { createTableMessages } from './table'
import { createToolbarMessages } from './toolbar'

/** Recreate after the host activates a locale. All feature groups are mandatory. */
export function createDocsMessages(): DocsMessages {
  return {
    ...createEmojiMessages(),
    ...createToolbarMessages(),
    ...createColorMenuMessages(),
    ...createCommentsMessages(),
    ...createSuggestionsMessages(),
    ...createTableOfContentsMessages(),
    ...createTableMessages(),
    ...createLinkMessages(),
    ...createImageMessages(),
    ...createPasteMessages(),
    ...createEditorLoadMessages(),
    ...createPageBreakMessages(),
    ...createSafeLexicalComposerMessages(),
    ...createDocsLayoutMessages(),
    ...createShortcutKbdMessages(),
  }
}
