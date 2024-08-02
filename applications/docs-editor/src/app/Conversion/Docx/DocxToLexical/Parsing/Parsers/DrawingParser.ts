import type { IDomImage } from 'docx-preview-cjs'
import { DocxElementParser } from './DocxElementParser'
import type { DocxToLexicalInfo } from '../DocxToLexicalInfo'

export class DrawingParser extends DocxElementParser {
  async parse(): Promise<DocxToLexicalInfo[]> {
    const firstChild = this.children[0] as IDomImage
    if (!firstChild || firstChild.type !== 'image') {
      return []
    }

    const src = await this.doc.loadDocumentImage(firstChild.src)

    return [
      {
        type: 'image',
        src,
      },
    ]
  }
}
