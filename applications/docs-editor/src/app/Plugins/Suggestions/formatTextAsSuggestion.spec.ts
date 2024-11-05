import { createHeadlessEditor } from '@lexical/headless'
import type { ParagraphNode, TextNode } from 'lexical'
import { $createParagraphNode, $createTextNode, $getRoot, $isTextNode } from 'lexical'
import type { Logger } from '@proton/utils/logs'
import { AllNodes } from '../../AllNodes'
import { $formatTextAsSuggestion } from './formatTextAsSuggestion'
import type { ProtonNode } from './ProtonNode'
import { $isSuggestionNode } from './ProtonNode'
import type { PropertyChangeSuggestionProperties } from './Types'

const onSuggestionCreation = jest.fn()
const logger = {
  info: jest.fn(),
} as unknown as Logger

describe('$formatTextAsSuggestion', () => {
  const editor = createHeadlessEditor({
    nodes: AllNodes,
    onError: console.error,
  })

  function update(fn: () => void) {
    editor.update(fn, {
      discrete: true,
    })
  }

  beforeEach(() => {
    update(() => {
      const root = $getRoot()
      root.clear()
    })
  })

  function testEditorState(name: string, fn: () => void) {
    test(name, () => {
      editor.read(fn)
    })
  }

  describe('Basic format change', () => {
    beforeEach(() => {
      update(() => {
        const paragraph = $createParagraphNode()
        const text = $createTextNode('Foo Bar Baz')
        paragraph.append(text)
        $getRoot().append(paragraph)

        const startOffset = 'Foo '.length
        const endOffset = startOffset + 'Bar'.length
        text.select(startOffset, endOffset)
        $formatTextAsSuggestion('bold', onSuggestionCreation, logger)
      })
    })

    testEditorState('paragraph should be split into 3', () => {
      const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()
      expect(paragraph.getChildrenSize()).toBe(3)
    })

    testEditorState('2nd child should be suggestion', () => {
      const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()
      const suggestion = paragraph.getChildAtIndex<ProtonNode>(1)!
      expect($isSuggestionNode(suggestion)).toBe(true)
      expect(suggestion.getSuggestionTypeOrThrow()).toBe('property-change')
      const props = suggestion.__properties.nodePropertiesChanged as PropertyChangeSuggestionProperties
      expect(props.__format).toBe(0)
    })

    testEditorState('new format should be applied', () => {
      const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()
      const suggestion = paragraph.getChildAtIndex<ProtonNode>(1)!
      const text = suggestion.getFirstChildOrThrow<TextNode>()
      expect($isTextNode(text)).toBe(true)
      expect(text.getFormat()).toBe(1)
    })
  })

  describe('Basic format change + reset to original', () => {
    beforeEach(() => {
      update(() => {
        const paragraph = $createParagraphNode()
        const text = $createTextNode('Foo Bar Baz')
        paragraph.append(text)
        $getRoot().append(paragraph)

        const startOffset = 'Foo '.length
        const endOffset = startOffset + 'Bar'.length
        text.select(startOffset, endOffset)
        $formatTextAsSuggestion('bold', onSuggestionCreation, logger)

        $formatTextAsSuggestion('bold', onSuggestionCreation, logger)
      })
    })

    testEditorState('paragraph should have single text node', () => {
      const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()
      expect(paragraph.getChildrenSize()).toBe(1)
      expect($isTextNode(paragraph.getFirstChild())).toBe(true)
    })

    testEditorState('text node should have original format', () => {
      const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()
      const text = paragraph.getFirstChildOrThrow<TextNode>()
      expect(text.getFormat()).toBe(0)
    })
  })
})
