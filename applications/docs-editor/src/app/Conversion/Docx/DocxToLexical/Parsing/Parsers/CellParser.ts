import { DocxElementParser } from './DocxElementParser'
import type { DocxToLexicalInfo } from '../DocxToLexicalInfo'
import { ParseDocxElements } from '../ParseDocxElement'

const PointToPxFactor = 1.3333333333333333

export class CellParser extends DocxElementParser {
  async parse(): Promise<DocxToLexicalInfo[]> {
    const parsedChildren = await ParseDocxElements(this.children, this.doc)

    const cell: DocxToLexicalInfo = {
      type: 'table-cell',
      children: parsedChildren,
    }

    if (this.element.cssStyle) {
      if (this.element.cssStyle['background-color']) {
        cell.backgroundColor = this.element.cssStyle['background-color']
      }

      if (this.element.cssStyle.width) {
        let width = parseFloat(this.element.cssStyle.width)
        if (isNaN(width)) {
          width = 0
        }

        const isPt = this.element.cssStyle.width.endsWith('pt')
        const widthInPx = isPt ? width * PointToPxFactor : width
        cell.width = widthInPx
      }
    }

    return [cell]
  }
}
