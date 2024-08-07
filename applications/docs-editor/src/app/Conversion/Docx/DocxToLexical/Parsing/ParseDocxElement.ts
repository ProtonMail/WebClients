import { GetParserForElement as GetParserForElement } from './GetParserForElement'
import type { DocxToLexicalInfo } from './DocxToLexicalInfo'
import type { OpenXmlElement, WordDocument } from 'docx-preview-cjs'

export const ParseDocxElements = async (
  elements: OpenXmlElement[],
  doc: WordDocument,
): Promise<DocxToLexicalInfo[]> => {
  if (!elements || !elements.length) {
    return []
  }

  const results: DocxToLexicalInfo[] = []

  for (const element of elements) {
    const parser = GetParserForElement(element, doc)
    if (!parser) {
      continue
    }

    const result = await parser.parse()
    if (result) {
      results.push(...result)
    }
  }

  return results
}
