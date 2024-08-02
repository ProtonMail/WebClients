import type { OpenXmlElement, WordDocument } from 'docx-preview-cjs'
import { ParagraphParser } from './ParagraphParser'

describe('ParagraphParser', () => {
  it('should return empty array if children have no real contents to avoid an empty space-taking lexical P element', async () => {
    const element = {
      children: [],
    } as unknown as OpenXmlElement
    const doc = {} as WordDocument

    const parser = new ParagraphParser(element, doc)
    const result = await parser.parse()

    expect(result).toHaveLength(0)
  })
})
