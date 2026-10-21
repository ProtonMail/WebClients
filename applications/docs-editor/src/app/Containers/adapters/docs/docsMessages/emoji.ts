import { c } from 'ttag'
import type { DocsMessages } from '../../../Docs/public'

export function createEmojiMessages(): Pick<DocsMessages, 'emoji'> {
  return {
    emoji: {
      insert: c('Action').t`Insert emoji`,
      suggestions: c('Label').t`Emoji suggestions`,
      search: c('Label').t`Search emoji`,
      searchResults: c('Label').t`Search results`,
      recent: c('Label').t`Recent`,
      grid: c('Label').t`Emoji`,
      loading: c('Info').t`Loading emoji…`,
      noResults: c('Info').t`No emoji found`,
      loadFailed: c('Error').t`Could not load emoji. Close the picker and try again.`,
      categories: {
        people: c('Emoji category').t`Smileys and people`,
        nature: c('Emoji category').t`Animals and nature`,
        foods: c('Emoji category').t`Food and drink`,
        activity: c('Emoji category').t`Activities`,
        places: c('Emoji category').t`Travel and places`,
        objects: c('Emoji category').t`Objects`,
        symbols: c('Emoji category').t`Symbols`,
        flags: c('Emoji category').t`Flags`,
      },
    },
  }
}
