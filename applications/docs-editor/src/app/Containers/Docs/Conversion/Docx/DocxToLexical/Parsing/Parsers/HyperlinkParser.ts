import type { WmlHyperlink } from 'docx-preview-cjs'
import { DocxElementParser } from './DocxElementParser'
import type { DocxToLexicalInfo } from '../DocxToLexicalInfo'

export class HyperlinkParser extends DocxElementParser<WmlHyperlink> {
  async parse(): Promise<DocxToLexicalInfo[]> {
    const rel = this.doc.documentPart.rels.find((rel: any) => rel.id === this.element.id)

    const parsedChildren = await this.parseChildren()

    return [
      {
        type: 'link',
        href: rel?.target || '',
        children: parsedChildren,
      },
    ]
  }
}
