import { createHeadlessEditor } from '@lexical/headless'
import type { ParagraphNode, TextNode } from 'lexical'
import { $getSelection, $isRangeSelection, $setSelection } from 'lexical'
import { $createParagraphNode, $createRangeSelection, $createTextNode, $getRoot, $isTextNode } from 'lexical'
import type { Logger } from '@proton/utils/logs'
import { AllNodes } from '../../AllNodes'
import { $formatTextAsSuggestion } from './formatTextAsSuggestion'
import type { ProtonNode } from './ProtonNode'
import { $isSuggestionNode } from './ProtonNode'
import type { PropertyChangeSuggestionProperties } from './Types'
import { assert } from './TestUtils'

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
    describe('Single node fully selected', () => {
      beforeEach(() => {
        update(() => {
          const paragraph = $createParagraphNode()
          const text = $createTextNode('Foo')
          paragraph.append(text)
          $getRoot().append(paragraph)

          text.select(0, 'Foo'.length)
          $formatTextAsSuggestion('bold', onSuggestionCreation, logger)
        })
      })

      testEditorState('paragraph should have 1 child', () => {
        const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()
        expect(paragraph.getChildrenSize()).toBe(1)
      })

      testEditorState('child should be suggestion', () => {
        const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()
        const suggestion = paragraph.getChildAtIndex<ProtonNode>(0)!
        expect($isSuggestionNode(suggestion)).toBe(true)
        expect(suggestion.getSuggestionTypeOrThrow()).toBe('property-change')
        const props = suggestion.__properties.nodePropertiesChanged as PropertyChangeSuggestionProperties
        expect(props.__format).toBe(0)
      })

      testEditorState('new format should be applied', () => {
        const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()
        const suggestion = paragraph.getChildAtIndex<ProtonNode>(0)!
        const text = suggestion.getFirstChildOrThrow<TextNode>()
        expect($isTextNode(text)).toBe(true)
        expect(text.getFormat()).toBe(1)
      })

      testEditorState('selection should be intact', () => {
        const selection = $getSelection()
        assert($isRangeSelection(selection), 'Expected range selection')
        const text = $getRoot().getFirstDescendant()
        assert($isTextNode(text), 'Expected text node')
        const anchor = selection.anchor
        const focus = selection.focus
        expect(anchor).toMatchObject({
          key: text.__key,
          type: 'text',
          offset: 0,
        })
        expect(focus).toMatchObject({
          key: text.__key,
          type: 'text',
          offset: text.getTextContentSize(),
        })
      })
    })

    describe('Single node partially selected', () => {
      beforeEach(() => {
        update(() => {
          const paragraph = $createParagraphNode()
          const text = $createTextNode('FooBar')
          paragraph.append(text)
          $getRoot().append(paragraph)

          text.select(2, 4)
          $formatTextAsSuggestion('bold', onSuggestionCreation, logger)
        })
      })

      testEditorState('paragraph should have 3 children', () => {
        const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()
        expect(paragraph.getChildrenSize()).toBe(3)
      })

      testEditorState('1st child should be text node without format', () => {
        const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()
        const text = paragraph.getChildAtIndex<ProtonNode>(0)!
        expect($isTextNode(text)).toBe(true)
        expect(text.getTextContent()).toBe('Fo')
        expect(text.getFormat()).toBe(0)
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

      testEditorState('3rd child should be text node without format', () => {
        const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()
        const text = paragraph.getChildAtIndex<ProtonNode>(2)!
        expect($isTextNode(text)).toBe(true)
        expect(text.getTextContent()).toBe('ar')
        expect(text.getFormat()).toBe(0)
      })

      testEditorState('selection should be intact', () => {
        const selection = $getSelection()
        assert($isRangeSelection(selection), 'Expected range selection')
        const text = $getRoot()
          .getFirstChildOrThrow<ParagraphNode>()
          .getChildAtIndex<ProtonNode>(1)!
          .getFirstChildOrThrow<TextNode>()
        assert($isTextNode(text), 'Expected text node')
        const anchor = selection.anchor
        const focus = selection.focus
        expect(anchor).toMatchObject({
          key: text.__key,
          type: 'text',
          offset: 0,
        })
        expect(focus).toMatchObject({
          key: text.__key,
          type: 'text',
          offset: text.getTextContentSize(),
        })
      })
    })
  })

  describe('Basic format change + reset to original', () => {
    describe('Single node fully selected', () => {
      beforeEach(() => {
        update(() => {
          const paragraph = $createParagraphNode()
          const text = $createTextNode('Foo')
          paragraph.append(text)
          $getRoot().append(paragraph)

          text.select(0, 'Foo'.length)
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

      testEditorState('selection should be intact', () => {
        const selection = $getSelection()
        assert($isRangeSelection(selection), 'Expected range selection')
        const text = $getRoot().getFirstChildOrThrow<ParagraphNode>().getFirstChildOrThrow<TextNode>()
        assert($isTextNode(text), 'Expected text node')
        const anchor = selection.anchor
        const focus = selection.focus
        expect(anchor).toMatchObject({
          key: text.__key,
          type: 'text',
          offset: 0,
        })
        expect(focus).toMatchObject({
          key: text.__key,
          type: 'text',
          offset: text.getTextContentSize(),
        })
      })
    })

    describe('Single node partially selected', () => {
      beforeEach(() => {
        update(() => {
          const paragraph = $createParagraphNode()
          const text = $createTextNode('FooBar')
          paragraph.append(text)
          $getRoot().append(paragraph)

          text.select(2, 4)
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

      testEditorState('selection should be intact', () => {
        const selection = $getSelection()
        assert($isRangeSelection(selection), 'Expected range selection')
        const text = $getRoot().getFirstChildOrThrow<ParagraphNode>().getFirstChildOrThrow<TextNode>()
        assert($isTextNode(text), 'Expected text node')
        const anchor = selection.anchor
        const focus = selection.focus
        expect(anchor).toMatchObject({
          key: text.__key,
          type: 'text',
          offset: 2,
        })
        expect(focus).toMatchObject({
          key: text.__key,
          type: 'text',
          offset: 4,
        })
      })
    })
  })

  describe('Multiple changes', () => {
    describe('Single node fully selected', () => {
      beforeEach(() => {
        update(() => {
          const paragraph = $createParagraphNode()
          const text = $createTextNode('Foo')
          paragraph.append(text)
          $getRoot().append(paragraph)

          text.select(0, 'Foo'.length)
          $formatTextAsSuggestion('bold', onSuggestionCreation, logger)
          $formatTextAsSuggestion('italic', onSuggestionCreation, logger)
        })
      })

      testEditorState('paragraph should have 1 child', () => {
        const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()
        expect(paragraph.getChildrenSize()).toBe(1)
      })

      testEditorState('child should be suggestion', () => {
        const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()
        const suggestion = paragraph.getChildAtIndex<ProtonNode>(0)!
        expect($isSuggestionNode(suggestion)).toBe(true)
        expect(suggestion.getSuggestionTypeOrThrow()).toBe('property-change')
        const props = suggestion.__properties.nodePropertiesChanged as PropertyChangeSuggestionProperties
        expect(props.__format).toBe(0)
      })

      testEditorState('both formats should be applied', () => {
        const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()
        const suggestion = paragraph.getChildAtIndex<ProtonNode>(0)!
        const text = suggestion.getFirstChildOrThrow<TextNode>()
        expect($isTextNode(text)).toBe(true)
        expect(text.getFormat()).toBe(3)
      })

      testEditorState('selection should be intact', () => {
        const selection = $getSelection()
        assert($isRangeSelection(selection), 'Expected range selection')
        const text = $getRoot().getFirstDescendant()
        assert($isTextNode(text), 'Expected text node')
        const anchor = selection.anchor
        const focus = selection.focus
        expect(anchor).toMatchObject({
          key: text.__key,
          type: 'text',
          offset: 0,
        })
        expect(focus).toMatchObject({
          key: text.__key,
          type: 'text',
          offset: text.getTextContentSize(),
        })
      })
    })

    describe('Single node partially selected', () => {
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
          $formatTextAsSuggestion('italic', onSuggestionCreation, logger)
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

      testEditorState('both formats should be applied', () => {
        const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()
        const suggestion = paragraph.getChildAtIndex<ProtonNode>(1)!
        const text = suggestion.getFirstChildOrThrow<TextNode>()
        expect($isTextNode(text)).toBe(true)
        expect(text.getFormat()).toBe(3)
      })

      testEditorState('selection should be intact', () => {
        const selection = $getSelection()
        assert($isRangeSelection(selection), 'Expected range selection')
        const text = $getRoot()
          .getFirstChildOrThrow<ParagraphNode>()
          .getChildAtIndex<ProtonNode>(1)!
          .getFirstChildOrThrow<TextNode>()
        assert($isTextNode(text), 'Expected text node')
        const anchor = selection.anchor
        const focus = selection.focus
        expect(anchor).toMatchObject({
          key: text.__key,
          type: 'text',
          offset: 0,
        })
        expect(focus).toMatchObject({
          key: text.__key,
          type: 'text',
          offset: text.getTextContentSize(),
        })
      })
    })
  })

  describe('Across text nodes with different formats', () => {
    describe('Different format from existing ones', () => {
      beforeEach(() => {
        update(() => {
          const paragraph = $createParagraphNode()
          const text = $createTextNode('Foobar')
          const text2 = $createTextNode('Lorem').toggleFormat('bold')
          paragraph.append(text, text2)
          $getRoot().append(paragraph)

          const selection = $createRangeSelection()
          selection.anchor.set(text.__key, 'Foo'.length, 'text')
          selection.focus.set(text2.__key, 'Lor'.length, 'text')
          $setSelection(selection)

          $formatTextAsSuggestion('italic', onSuggestionCreation, logger)
        })
      })

      testEditorState('paragraph should be split into 4', () => {
        const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()
        expect(paragraph.getChildrenSize()).toBe(4)
      })

      testEditorState('2nd child should be suggestion', () => {
        const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()
        const suggestion = paragraph.getChildAtIndex<ProtonNode>(1)!
        expect($isSuggestionNode(suggestion)).toBe(true)
        expect(suggestion.getSuggestionTypeOrThrow()).toBe('property-change')
        const props = suggestion.__properties.nodePropertiesChanged as PropertyChangeSuggestionProperties
        expect(props.__format).toBe(0)
      })

      testEditorState('should create separate suggestion node for existing format', () => {
        const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()
        const suggestion = paragraph.getChildAtIndex<ProtonNode>(2)!
        expect($isSuggestionNode(suggestion)).toBe(true)
        expect(suggestion.getSuggestionTypeOrThrow()).toBe('property-change')
        const props = suggestion.__properties.nodePropertiesChanged as PropertyChangeSuggestionProperties
        expect(props.__format).toBe(1)
      })

      testEditorState('2nd child text should only have new format', () => {
        const suggestion = $getRoot().getFirstChildOrThrow<ParagraphNode>().getChildAtIndex<ProtonNode>(1)!
        const text = suggestion.getFirstChildOrThrow<TextNode>()
        expect($isTextNode(text)).toBe(true)
        expect(text.getFormat()).toBe(2)
      })

      testEditorState('3rd child text should have new format + existing', () => {
        const suggestion = $getRoot().getFirstChildOrThrow<ParagraphNode>().getChildAtIndex<ProtonNode>(2)!
        const text = suggestion.getFirstChildOrThrow<TextNode>()
        expect($isTextNode(text)).toBe(true)
        expect(text.getFormat()).toBe(3)
      })

      testEditorState('selection should be intact', () => {
        const selection = $getSelection()
        assert($isRangeSelection(selection), 'Expected range selection')
        const anchor = selection.anchor
        const anchorText = $getRoot()
          .getFirstChildOrThrow<ParagraphNode>()
          .getChildAtIndex<ProtonNode>(1)!
          .getFirstChildOrThrow<TextNode>()
        expect(anchor).toMatchObject({
          key: anchorText.__key,
          type: 'text',
          offset: 0,
        })
        const focusText = $getRoot()
          .getFirstChildOrThrow<ParagraphNode>()
          .getChildAtIndex<ProtonNode>(2)!
          .getFirstChildOrThrow<TextNode>()
        const focus = selection.focus
        expect(focus).toMatchObject({
          key: focusText.__key,
          type: 'text',
          offset: focusText.getTextContentSize(),
        })
      })
    })

    describe('Same format as one of existing ones', () => {
      beforeEach(() => {
        update(() => {
          const paragraph = $createParagraphNode()
          const text = $createTextNode('Foobar')
          const text2 = $createTextNode('Lorem').toggleFormat('bold')
          paragraph.append(text, text2)
          $getRoot().append(paragraph)

          const selection = $createRangeSelection()
          selection.anchor.set(text.__key, 'Foo'.length, 'text')
          selection.focus.set(text2.__key, 'Lor'.length, 'text')
          $setSelection(selection)

          $formatTextAsSuggestion('bold', onSuggestionCreation, logger)
        })
      })

      testEditorState('paragraph should be split into 4', () => {
        const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()
        expect(paragraph.getChildrenSize()).toBe(4)
      })

      testEditorState('2nd child should be suggestion', () => {
        const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()
        const suggestion = paragraph.getChildAtIndex<ProtonNode>(1)!
        expect($isSuggestionNode(suggestion)).toBe(true)
        expect(suggestion.getSuggestionTypeOrThrow()).toBe('property-change')
        const props = suggestion.__properties.nodePropertiesChanged as PropertyChangeSuggestionProperties
        expect(props.__format).toBe(0)
      })

      testEditorState('should create separate suggestion node for existing format', () => {
        const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()
        const suggestion = paragraph.getChildAtIndex<ProtonNode>(2)!
        expect($isSuggestionNode(suggestion)).toBe(true)
        expect(suggestion.getSuggestionTypeOrThrow()).toBe('property-change')
        const props = suggestion.__properties.nodePropertiesChanged as PropertyChangeSuggestionProperties
        expect(props.__format).toBe(1)
      })

      testEditorState('2nd child text should have new format', () => {
        const suggestion = $getRoot().getFirstChildOrThrow<ParagraphNode>().getChildAtIndex<ProtonNode>(1)!
        const text = suggestion.getFirstChildOrThrow<TextNode>()
        expect($isTextNode(text)).toBe(true)
        expect(text.getFormat()).toBe(1)
      })

      testEditorState('3rd child text should keep existing format', () => {
        const suggestion = $getRoot().getFirstChildOrThrow<ParagraphNode>().getChildAtIndex<ProtonNode>(2)!
        const text = suggestion.getFirstChildOrThrow<TextNode>()
        expect($isTextNode(text)).toBe(true)
        expect(text.getFormat()).toBe(1)
      })

      testEditorState('selection should be intact', () => {
        const selection = $getSelection()
        assert($isRangeSelection(selection), 'Expected range selection')
        const anchor = selection.anchor
        const anchorText = $getRoot()
          .getFirstChildOrThrow<ParagraphNode>()
          .getChildAtIndex<ProtonNode>(1)!
          .getFirstChildOrThrow<TextNode>()
        expect(anchor).toMatchObject({
          key: anchorText.__key,
          type: 'text',
          offset: 0,
        })
        const focusText = $getRoot()
          .getFirstChildOrThrow<ParagraphNode>()
          .getChildAtIndex<ProtonNode>(2)!
          .getFirstChildOrThrow<TextNode>()
        const focus = selection.focus
        expect(focus).toMatchObject({
          key: focusText.__key,
          type: 'text',
          offset: focusText.getTextContentSize(),
        })
      })
    })
  })
})
