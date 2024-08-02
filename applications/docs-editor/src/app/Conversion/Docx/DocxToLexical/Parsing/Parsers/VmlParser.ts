import { DocxElementParser } from './DocxElementParser'
import type { DocxToLexicalInfo } from '../DocxToLexicalInfo'
import { ParseDocxElements } from '../ParseDocxElement'

export class VmlParser extends DocxElementParser {
  async parse(): Promise<DocxToLexicalInfo[]> {
    return ParseDocxElements(this.children, this.doc)
  }
}
