import type { SuggestionType } from '@proton/docs-shared'
import type { ElementFormatType } from 'lexical'
import type { BlockType } from '../BlockTypePlugin'
import type { ListInfo } from '../CustomList/$getListInfo'

export enum ProtonNodeTypes {
  Suggestion = 'suggestion',
}

export const SuggestionTypesThatCanBeEmpty: SuggestionType[] = [
  'split',
  'join',
  'indent-change',
  'insert-table',
  'delete-table',
  'insert-table-row',
  'duplicate-table-row',
  'delete-table-row',
  'insert-table-column',
  'delete-table-column',
  'duplicate-table-column',
  'block-type-change',
  'align-change',
]

export const SuggestionTypesThatAffectWholeParent: SuggestionType[] = [
  'indent-change',
  'insert-table',
  'delete-table',
  'insert-table-row',
  'duplicate-table-row',
  'delete-table-row',
  'insert-table-column',
  'delete-table-column',
  'duplicate-table-column',
  'block-type-change',
  'align-change',
]

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

export type BlockTypeChangeSuggestionProperties = {
  initialBlockType: BlockType
  initialFormatType?: ElementFormatType
  initialIndent?: number
  listInfo?: ListInfo
}

export type IndentChangeSuggestionProperties = {
  indent: number
}

export type PropertyChangeSuggestionProperties = {
  __format: number
}

export type LinkChangeSuggestionProperties = {
  __url: string | null
}

export type AlignChangeSuggestionProperties = {
  initialFormatType: ElementFormatType
}
