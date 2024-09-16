export enum ProtonNodeTypes {
  Suggestion = 'suggestion',
}

export type SuggestionID = string

export type SuggestionType = 'insert' | 'delete' | 'property-change' | 'split' | 'join'

export type SuggestionProperties = {
  nodeType: ProtonNodeTypes.Suggestion
  suggestionID: string
  suggestionType: SuggestionType
  /**
   * Pre-suggestion values for node properties
   * @example `__format` Used to store text format
   */
  nodePropertiesChanged?: Record<string, any>
}
