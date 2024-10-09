export type SuggestionType =
  | 'insert'
  | 'delete'
  | 'property-change'
  | 'split'
  | 'join'
  | 'link-change'
  | 'style-change'
  | 'image-change'

export type SuggestionSummaryType =
  | SuggestionType
  | 'replace'
  | 'add-link'
  | 'delete-link'
  | 'insert-image'
  | 'delete-image'
