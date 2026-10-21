import { colorMenuMessages } from '../Components/ColorMenu'
import { emojiMessages } from '../Plugins/emoji/emojiMessages'
import { alignmentMenuOptionsMessages } from '../Toolbar/AlignmentMenuOptions'
import { toolbarMessages } from '../Toolbar/Toolbar'

function createDefaultDocsMessages() {
  return {
    ...emojiMessages,
    ...alignmentMenuOptionsMessages,
    ...toolbarMessages,
    ...colorMenuMessages,
  }
}

export const defaultDocsMessages = /* @__PURE__ */ createDefaultDocsMessages()
