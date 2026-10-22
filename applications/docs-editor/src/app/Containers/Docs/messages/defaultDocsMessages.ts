import { colorMenuMessages } from '../Components/ColorMenu'
import { docsLayoutMessages } from '../Layout/DocsLayout'
import { editorLoadMessages } from '../Plugins/Collaboration/editorLoadMessages'
import { commentsMessages } from '../Plugins/Comments/commentsMessages'
import { emojiMessages } from '../Plugins/emoji/emojiMessages'
import { imageMessages } from '../Plugins/Image/imageMessages'
import { shortcutKbdMessages } from '../Plugins/KeyboardShortcuts/ShortcutKbd'
import { linkMessages } from '../Plugins/Link/linkMessages'
import { pageBreakMessages } from '../Plugins/PageBreak/PageBreakNode'
import { pasteMessages } from '../Plugins/pasteMessages'
import { suggestionsMessages } from '../Plugins/Suggestions/suggestionsMessages'
import { tableOfContentsMessages } from '../Plugins/TableOfContents/tableOfContentsMessages'
import { tableMessages } from '../Plugins/Table/tableMessages'
import { alignmentMenuOptionsMessages } from '../Toolbar/AlignmentMenuOptions'
import { toolbarMessages } from '../Toolbar/Toolbar'
import { safeLexicalComposerMessages } from '../Utils/SafeLexicalComposer'

function createDefaultDocsMessages() {
  return {
    ...emojiMessages,
    ...alignmentMenuOptionsMessages,
    ...toolbarMessages,
    ...colorMenuMessages,
    ...commentsMessages,
    ...suggestionsMessages,
    ...tableOfContentsMessages,
    ...tableMessages,
    ...linkMessages,
    ...imageMessages,
    ...pasteMessages,
    ...pageBreakMessages,
    ...editorLoadMessages,
    ...safeLexicalComposerMessages,
    ...docsLayoutMessages,
    ...shortcutKbdMessages,
  }
}

export const defaultDocsMessages = /* @__PURE__ */ createDefaultDocsMessages()
