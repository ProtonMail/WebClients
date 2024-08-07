import { DocxElementParser } from './DocxElementParser'
import type { DocxToLexicalInfo } from '../DocxToLexicalInfo'
import { ParseDocxElements } from '../ParseDocxElement'

export class RowParser extends DocxElementParser {
  async parse(): Promise<DocxToLexicalInfo[]> {
    const parsedChildren = await ParseDocxElements(this.children, this.doc)

    return [
      {
        type: 'table-row',
        children: parsedChildren,
      },
    ]
  }
}
