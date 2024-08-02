import type { ListType } from '@lexical/list'
import type { HeadingTagType } from '@lexical/rich-text'
import type { ElementFormatType, TextFormatType } from 'lexical'

/**
 * Represents an intermediary state of conversion from docx to Lexical, where we prepare the information
 * for Lexical to convert into a real LexicalNode. So the below is a custom information format we define.
 */
export type DocxToLexicalInfo = (
  | {
      type: 'paragraph'
      format?: ElementFormatType
      indentLevel?: number
    }
  | {
      type: 'heading'
      tagType: HeadingTagType
      format?: ElementFormatType
      indentLevel?: number
    }
  | {
      type: 'image'
      src: string
    }
  | {
      type: 'link'
      href: string
    }
  | {
      type: 'text'
      text: string
      cssText?: string
      formats?: TextFormatType[]
    }
  | {
      type: 'table'
    }
  | {
      type: 'table-row'
    }
  | {
      type: 'table-cell'
      backgroundColor?: string
      width?: number
    }
  | {
      type: 'list-item'
      listType: ListType
      checked: boolean | undefined
    }
) & {
  children?: DocxToLexicalInfo[]
}
