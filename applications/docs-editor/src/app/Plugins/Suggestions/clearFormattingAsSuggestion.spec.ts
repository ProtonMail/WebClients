import { createHeadlessEditor } from '@lexical/headless'
import type {
  ParagraphNode,
  TextNode} from 'lexical';
import {
  $createParagraphNode,
  $createRangeSelection,
  $createTextNode,
  $getRoot,
  $isTextNode,
  $setSelection
} from 'lexical'
import { AllNodes } from '../../AllNodes'
import { $clearFormattingAsSuggestion } from './clearFormattingAsSuggestion'
import type { ProtonNode } from './ProtonNode';
import { $isSuggestionNode } from './ProtonNode'
import { $patchStyleText } from '@lexical/selection'

describe('$clearFormattingAsSuggestion', () => {
  const editor = createHeadlessEditor({
    nodes: AllNodes,
    onError: console.error,
  })

  const onSuggestionCreation = jest.fn()

  beforeEach(() => {
    editor.update(
      () => {
        const root = $getRoot()
        root.clear()

        const text = $createTextNode('Hello world').setFormat('bold')
        const paragraph = $createParagraphNode().append(text)
        root.append(paragraph)

        const firstSelection = text.select(2, 5) // select 'llo'
        firstSelection.formatText('italic')
        expect(paragraph.getChildrenSize()).toBe(3)

        const lastTextNode = paragraph.getLastChildOrThrow<TextNode>()
        const secondSelection = lastTextNode.select(0, 3) // select ' wo'
        $patchStyleText(secondSelection, {
          color: '#fff',
        })
        expect(paragraph.getChildrenSize()).toBe(4)

        const firstNodeToSelect = paragraph.getChildAtIndex<TextNode>(1)!
        const lastNodeToSelect = paragraph.getChildAtIndex<TextNode>(2)!

        const selectionToSuggest = $createRangeSelection() // select 'llo wo'
        selectionToSuggest.anchor.set(firstNodeToSelect.__key, 0, 'text')
        selectionToSuggest.focus.set(lastNodeToSelect.__key, lastNodeToSelect.getTextContentSize(), 'text')
        $setSelection(selectionToSuggest)
        $clearFormattingAsSuggestion(onSuggestionCreation)
      },
      {
        discrete: true,
      },
    )
  })

  const testEditorState = (name: string, fn: () => void) => {
    test(name, () => {
      editor.read(fn)
    })
  }

  testEditorState('paragraph should be split into 4 children', () => {
    const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()
    expect(paragraph.getChildrenSize()).toBe(4)

    const first = paragraph.getChildAtIndex(0)!
    expect($isTextNode(first)).toBe(true)

    const second = paragraph.getChildAtIndex<ProtonNode>(1)!
    expect($isSuggestionNode(second)).toBe(true)

    const third = paragraph.getChildAtIndex<ProtonNode>(2)!
    expect($isSuggestionNode(third)).toBe(true)

    const fourth = paragraph.getChildAtIndex(3)!
    expect($isTextNode(fourth)).toBe(true)
  })

  testEditorState('first and last text nodes should have original format', () => {
    const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()

    const first = paragraph.getChildAtIndex<TextNode>(0)!
    expect(first.hasFormat('bold')).toBe(true)

    const last = paragraph.getChildAtIndex<TextNode>(3)!
    expect(last.hasFormat('bold')).toBe(true)
  })

  testEditorState('second node should be suggestion', () => {
    const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()

    const second = paragraph.getChildAtIndex<ProtonNode>(1)!
    expect($isSuggestionNode(second)).toBe(true)
    expect(second.getSuggestionTypeOrThrow()).toBe('clear-formatting')
    expect(second.__properties.nodePropertiesChanged!.initialFormat).toBe(3)
    expect(second.__properties.nodePropertiesChanged!.initialStyle).toBe('')
  })

  testEditorState('third node should be suggestion', () => {
    const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()

    const third = paragraph.getChildAtIndex<ProtonNode>(2)!
    expect($isSuggestionNode(third)).toBe(true)
    expect(third.getSuggestionTypeOrThrow()).toBe('clear-formatting')
    expect(third.__properties.nodePropertiesChanged!.initialFormat).toBe(1)
    expect(third.__properties.nodePropertiesChanged!.initialStyle).toBe('color: #fff;')
  })

  testEditorState('second & third text nodes should have no format or style', () => {
    const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()

    const second = paragraph.getChildAtIndex<ProtonNode>(1)!.getFirstChildOrThrow<TextNode>()
    expect(second.getFormat()).toBe(0)
    expect(second.getStyle()).toBe('')

    const third = paragraph.getChildAtIndex<ProtonNode>(2)!.getFirstChildOrThrow<TextNode>()
    expect(third.getFormat()).toBe(0)
    expect(third.getStyle()).toBe('')
  })
})
