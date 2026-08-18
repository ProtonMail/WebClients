import { DocxElementParser } from './DocxElementParser'
import type { DocxToLexicalInfo } from '../DocxToLexicalInfo'

export class RowParser extends DocxElementParser {
  async parse(): Promise<DocxToLexicalInfo[]> {
    const parsedChildren = await this.parseChildren()

    return [
      {
        type: 'table-row',
        children: parsedChildren,
      },
    ]
  }
}
