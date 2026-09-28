import { DocxElementParser } from './DocxElementParser'
import type { DocxToLexicalInfo } from '../DocxToLexicalInfo'

export class VmlParser extends DocxElementParser {
  async parse(): Promise<DocxToLexicalInfo[]> {
    return this.parseChildren()
  }
}
