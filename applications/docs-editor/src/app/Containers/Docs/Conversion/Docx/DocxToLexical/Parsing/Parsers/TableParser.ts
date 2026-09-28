import { DocxElementParser } from './DocxElementParser'
import type { DocxToLexicalInfo } from '../DocxToLexicalInfo'

export class TableParser extends DocxElementParser {
  async parse(): Promise<DocxToLexicalInfo[]> {
    const parsedChildren = await this.parseChildren()

    return [
      {
        type: 'table',
        children: parsedChildren,
      },
    ]
  }
}
