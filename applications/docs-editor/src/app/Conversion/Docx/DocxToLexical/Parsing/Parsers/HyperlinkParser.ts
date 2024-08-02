import type { WmlHyperlink } from 'docx-preview-cjs'
import { DocxElementParser } from './DocxElementParser'
import type { DocxToLexicalInfo } from '../DocxToLexicalInfo'
import { ParseDocxElements } from '../ParseDocxElement'

export class HyperlinkParser extends DocxElementParser<WmlHyperlink> {
  async parse(): Promise<DocxToLexicalInfo[]> {
    const rel = this.doc.documentPart.rels.find((rel: any) => rel.id === this.element.id)

    const parsedChildren = await ParseDocxElements(this.children, this.doc)

    return [
      {
        type: 'link',
        href: rel?.target || '',
        children: parsedChildren,
      },
    ]
  }
}
