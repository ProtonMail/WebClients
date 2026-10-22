import { colorMenuMessages } from '../Components/ColorMenu'
import { commentsMessages } from '../Plugins/Comments/commentsMessages'
import { emojiMessages } from '../Plugins/emoji/emojiMessages'
import { suggestionsMessages } from '../Plugins/Suggestions/suggestionsMessages'
import { alignmentMenuOptionsMessages } from '../Toolbar/AlignmentMenuOptions'
import { toolbarMessages } from '../Toolbar/Toolbar'

function createDefaultDocsMessages() {
  return {
    ...emojiMessages,
    ...alignmentMenuOptionsMessages,
    ...toolbarMessages,
    ...colorMenuMessages,
    ...commentsMessages,
    ...suggestionsMessages,
  }
}

export const defaultDocsMessages = /* @__PURE__ */ createDefaultDocsMessages()
