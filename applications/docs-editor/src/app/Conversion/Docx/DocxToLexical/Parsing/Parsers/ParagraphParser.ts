import type { ListType } from '@lexical/list'
import type { HeadingTagType } from '@lexical/rich-text'
import type { WmlParagraph } from 'docx-preview-cjs'
import type { ElementFormatType } from 'lexical'
import { DocxElementParser } from './DocxElementParser'
import type { DocxToLexicalInfo } from '../DocxToLexicalInfo'
import { ParseDocxElements } from '../ParseDocxElement'

export class ParagraphParser extends DocxElementParser {
  async parse(): Promise<DocxToLexicalInfo[]> {
    const parsedChildren = await ParseDocxElements(this.children, this.doc)
    if (parsedChildren.length === 0) {
      return []
    }

    let elementFormat: ElementFormatType | undefined
    if (this.element.cssStyle && this.element.cssStyle['text-align']) {
      elementFormat = this.element.cssStyle['text-align'] as ElementFormatType
    }

    let indentLevel: number | undefined
    if (this.element.cssStyle && this.element.cssStyle['margin-left'] && this.element.cssStyle['text-indent']) {
      const marginLeft = parseInt(this.element.cssStyle['margin-left'])
      const parsedLevel = marginLeft / 36
      if (parsedLevel) {
        indentLevel = Math.floor(parsedLevel)
      }
    }

    if (this.element.styleName && this.element.styleName.startsWith('Heading')) {
      const level = parseInt(this.element.styleName.replace('Heading', ''), 10)
      const clampedLevel = Math.max(1, Math.min(6, level))

      const node: DocxToLexicalInfo = {
        type: 'heading',
        tagType: `h${clampedLevel}` as HeadingTagType,
        format: elementFormat,
        children: parsedChildren,
        indentLevel,
      }

      return [node]
    }

    if ((this.element as WmlParagraph).numbering) {
      const castChild = this.element as WmlParagraph
      const { id } = castChild.numbering
      let listType: ListType = 'bullet'

      if (id === '2') {
        listType = 'number'
      } else if (id === '3') {
        listType = 'check'
      }

      let checked: boolean | undefined

      if (
        listType === 'check' &&
        this.element.children?.some((child) => child.cssStyle && child.cssStyle['text-decoration'] === 'line-through')
      ) {
        checked = true
      }

      return [
        {
          type: 'list-item',
          listType,
          children: parsedChildren,
          checked,
        },
      ]
    }

    return [
      {
        type: 'paragraph',
        format: elementFormat,
        children: parsedChildren,
        indentLevel,
      },
    ]
  }
}
