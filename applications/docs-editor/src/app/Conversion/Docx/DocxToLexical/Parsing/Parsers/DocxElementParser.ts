import type { OpenXmlElement, WordDocument, IDomStyle } from 'docx-preview-cjs'
import type { DocxToLexicalInfo } from '../DocxToLexicalInfo'

/** Parses a Docx element into a Lexical information node */
export abstract class DocxElementParser<T extends OpenXmlElement = OpenXmlElement> {
  constructor(
    protected readonly element: T,
    protected readonly doc: WordDocument,
  ) {}

  abstract parse(): Promise<DocxToLexicalInfo[]>

  get children(): OpenXmlElement[] {
    return this.element.children ?? []
  }

  getStyles(): IDomStyle[] {
    const styles: IDomStyle[] = []

    if (this.element.parent?.styleName) {
      const parentStyles = this.findStyleByName(this.element.parent.styleName)
      if (parentStyles) {
        styles.push(parentStyles)
      }
    }

    if (this.element.styleName) {
      const thisStyles = this.findStyleByName(this.element.styleName)
      if (thisStyles) {
        styles.push(thisStyles)
      }
    }

    return styles
  }

  findStyleByName(name: string): IDomStyle | undefined {
    const styles = this.doc.stylesPart.styles

    const matching = styles.find((style) => style.name === name)

    return matching
  }
}
