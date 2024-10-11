import type { SuggestionType } from '@proton/docs-shared'

export enum ProtonNodeTypes {
  Suggestion = 'suggestion',
}

export const SuggestionTypesThatCanBeEmpty: SuggestionType[] = ['split', 'join', 'indent-change']

export const SuggestionTypesThatAffectWholeParent: SuggestionType[] = ['indent-change']

export const TextEditingSuggestionTypes: SuggestionType[] = ['insert', 'delete', 'split', 'join']

export type SuggestionID = string

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
