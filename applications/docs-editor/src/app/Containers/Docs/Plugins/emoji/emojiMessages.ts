export type EmojiMessages = {
  insert: string
  suggestions: string
  search: string
  searchResults: string
  recent: string
  grid: string
  loading: string
  noResults: string
  loadFailed: string
  categories: Record<string, string>
}

export const defaultEmojiMessages: EmojiMessages = {
  insert: 'Insert emoji',
  suggestions: 'Emoji suggestions',
  search: 'Search emoji',
  searchResults: 'Search results',
  recent: 'Recent',
  grid: 'Emoji',
  loading: 'Loading emoji…',
  noResults: 'No emoji found',
  loadFailed: 'Could not load emoji. Close the picker and try again.',
  categories: {
    people: 'Smileys and people',
    nature: 'Animals and nature',
    foods: 'Food and drink',
    activity: 'Activities',
    places: 'Travel and places',
    objects: 'Objects',
    symbols: 'Symbols',
    flags: 'Flags',
  },
}
