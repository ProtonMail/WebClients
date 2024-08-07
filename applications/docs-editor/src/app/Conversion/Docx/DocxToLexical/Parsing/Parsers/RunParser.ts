import type { WmlText, WmlRun } from 'docx-preview-cjs'
import type { TextFormatType } from 'lexical'
import { DocxElementParser } from './DocxElementParser'
import type { DocxToLexicalInfo } from '../DocxToLexicalInfo'
import { ParseDocxElements } from '../ParseDocxElement'

export class RunParser extends DocxElementParser {
  async parse(): Promise<DocxToLexicalInfo[]> {
    const results: DocxToLexicalInfo[] = []

    for (const child of this.children) {
      if (child.type === 'text') {
        results.push(this.parseAsText(child as WmlText))
      } else {
        const parsed = await ParseDocxElements([child], this.doc)
        results.push(...parsed)
      }
    }

    return results
  }

  private parseAsText(textElement: WmlText): DocxToLexicalInfo {
    const lexicalInfo: DocxToLexicalInfo = {
      type: 'text',
      text: textElement.text,
    }

    const formats: TextFormatType[] = []
    let cssText = ''

    if (this.element.cssStyle) {
      if (this.element.cssStyle['font-weight'] === 'bold') {
        formats.push('bold')
      }
      if (this.element.cssStyle['font-style'] === 'italic') {
        formats.push('italic')
      }
      if (this.element.cssStyle['text-decoration'] === 'underline') {
        formats.push('underline')
      }
      if (this.element.cssStyle['font-size']) {
        cssText += `font-size: ${this.element.cssStyle['font-size']};`
      }
      if (this.element.cssStyle.color) {
        cssText += `color: ${this.element.cssStyle.color};`
      }
      if (this.element.cssStyle['background-color']) {
        cssText += `background-color: ${this.element.cssStyle['background-color']};`
      }
    }

    const topLevelStyles = this.getStyles()
    for (const topLevelStyle of topLevelStyles) {
      const cssStylesContainer = topLevelStyle.styles
      for (const stylesRecord of cssStylesContainer) {
        const values = stylesRecord.values
        for (const [key, value] of Object.entries(values)) {
          const newEntry = `${key}: ${value};`
          cssText += newEntry
        }
      }
    }

    if ((this.element as WmlRun).verticalAlign === 'sub') {
      formats.push('subscript')
    } else if ((this.element as WmlRun).verticalAlign === 'sup') {
      formats.push('superscript')
    }

    lexicalInfo.formats = formats
    lexicalInfo.cssText = cssText
    return lexicalInfo
  }
}
