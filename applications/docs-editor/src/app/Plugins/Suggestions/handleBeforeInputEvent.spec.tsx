import type { ElementNode, LexicalEditor, ParagraphNode, RangeSelection, TextNode } from 'lexical'
import { $isParagraphNode, $isTextNode, $setSelection } from 'lexical'
import { $createParagraphNode, $createTextNode, $getRoot, $getSelection, $isRangeSelection } from 'lexical'
import { AllNodes } from '../../AllNodes'
import { $handleBeforeInputEvent } from './handleBeforeInputEvent'
import type { ProtonNode } from './ProtonNode'
import { $createSuggestionNode, $isSuggestionNode } from './ProtonNode'
import { polyfillSelectionRelatedThingsForTests } from './TestUtils'
import type { Root } from 'react-dom/client'
import { createRoot } from 'react-dom/client'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import React from 'react'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ProtonContentEditable } from '../../ContentEditable/ProtonContentEditable'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import * as ReactTestUtils from '../../Utils/react-test-utils'

polyfillSelectionRelatedThingsForTests()

describe('$handleBeforeInputEvent', () => {
  let container: HTMLElement
  let reactRoot: Root
  let editor: LexicalEditor | null = null

  async function update(fn: () => void) {
    await ReactTestUtils.act(async () => {
      await editor!.update(fn)
    })
  }

  async function init() {
    function TestBase() {
      function TestPlugin() {
        ;[editor] = useLexicalComposerContext()
        return null
      }
      return (
        <LexicalComposer
          initialConfig={{
            namespace: 'test',
            nodes: AllNodes,
            onError: console.error,
          }}
        >
          <RichTextPlugin
            contentEditable={<ProtonContentEditable isSuggestionMode={true} />}
            placeholder={null}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <TestPlugin />
        </LexicalComposer>
      )
    }

    await ReactTestUtils.act(async () => {
      reactRoot.render(<TestBase />)
      await Promise.resolve().then()
    })

    await update(() => {
      $getRoot().clear()
    })

    await Promise.resolve().then()
  }

  beforeEach(async () => {
    container = document.createElement('div')
    document.body.appendChild(container)
    reactRoot = createRoot(container)
    await init()
  })

  afterEach(async () => {
    // Ensure we are clearing out any React state and running effects with
    // act
    await ReactTestUtils.act(async () => {
      reactRoot.unmount()
      await Promise.resolve().then()
    })
    document.body.removeChild(container)
  })

  const onSuggestionCreation = jest.fn()

  describe('Insertion', () => {
    test('should insert basic text', async () => {
      await update(() => {
        const paragraph = $createParagraphNode().append($createTextNode('Hello'))
        $getRoot().append(paragraph)
        paragraph.selectEnd()
        $handleBeforeInputEvent(
          editor!,
          {
            inputType: 'insertText',
            data: 'World',
            dataTransfer: null,
          } as InputEvent,
          onSuggestionCreation,
        )
      })
      editor!.read(() => {
        const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()
        expect(paragraph.getChildrenSize()).toBe(2)
        const suggestionNode = paragraph.getChildAtIndex(1)
        expect($isSuggestionNode(suggestionNode)).toBe(true)
        expect(suggestionNode?.getTextContent()).toBe('World')
      })
    })

    test('should merge with existing insertion suggestion sibling', async () => {
      const suggestionID = 'test'
      await update(() => {
        const paragraph = $createParagraphNode().append(
          $createTextNode('Hello'),
          $createSuggestionNode(suggestionID, 'insert').append($createTextNode('World')),
        )
        $getRoot().append(paragraph)
        paragraph.selectEnd()
        $handleBeforeInputEvent(
          editor!,
          {
            inputType: 'insertText',
            data: '!',
            dataTransfer: null,
          } as InputEvent,
          onSuggestionCreation,
        )
      })
      editor!.read(() => {
        const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()
        expect(paragraph.getChildrenSize()).toBe(2)
        const suggestionNode = paragraph.getChildAtIndex<ProtonNode>(1)
        expect($isSuggestionNode(suggestionNode)).toBe(true)
        expect(suggestionNode?.getSuggestionIdOrThrow()).toBe(suggestionID)
        expect(suggestionNode?.getTextContent()).toBe('World!')
      })
    })

    test('should insert text into existing insert suggestion and move selection accordingly', async () => {
      const suggestionID = 'test'
      await update(() => {
        const paragraph = $createParagraphNode().append($createTextNode('Hello'))
        const suggestionNode = $createSuggestionNode(suggestionID, 'insert').append($createTextNode('World'))
        paragraph.append(suggestionNode)
        $getRoot().append(paragraph)
        suggestionNode.getFirstChildOrThrow<TextNode>().select(3, 3) // Move selection to after 'r'
        $handleBeforeInputEvent(
          editor!,
          {
            inputType: 'insertText',
            data: 'new',
            dataTransfer: null,
          } as InputEvent,
          onSuggestionCreation,
        )
      })
      editor!.read(() => {
        const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()
        expect(paragraph.getChildrenSize()).toBe(2)
        const suggestionNode = paragraph.getChildAtIndex<ProtonNode>(1)
        expect($isSuggestionNode(suggestionNode)).toBe(true)
        expect(suggestionNode?.getSuggestionIdOrThrow()).toBe(suggestionID)
        expect(suggestionNode?.getTextContent()).toBe('Wornewld')
        const selection = $getSelection()
        expect($isRangeSelection(selection)).toBe(true)
        expect(selection?.isCollapsed()).toBe(true)
        expect((selection as RangeSelection).anchor.offset).toBe(6)
      })
    })

    test('should split existing non-insert suggestion when trying to insert into it', async () => {
      const suggestionID = 'test'
      await update(() => {
        const paragraph = $createParagraphNode().append($createTextNode('Hello'))
        const suggestionNode = $createSuggestionNode(suggestionID, 'delete').append($createTextNode('World'))
        paragraph.append(suggestionNode)
        $getRoot().append(paragraph)
        suggestionNode.getFirstChildOrThrow<TextNode>().select(3, 3) // Move selection to after 'r'
        $handleBeforeInputEvent(
          editor!,
          {
            inputType: 'insertText',
            data: 'new',
            dataTransfer: null,
          } as InputEvent,
          onSuggestionCreation,
        )
      })
      editor!.read(() => {
        const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()
        expect(paragraph.getChildrenSize()).toBe(4)
        const suggestionNode1 = paragraph.getChildAtIndex<ProtonNode>(1)
        expect($isSuggestionNode(suggestionNode1)).toBe(true)
        expect(suggestionNode1?.getTextContent()).toBe('Wor')
        expect(suggestionNode1?.getSuggestionTypeOrThrow()).toBe('delete')
        const suggestionNode2 = paragraph.getChildAtIndex<ProtonNode>(2)
        expect($isSuggestionNode(suggestionNode2)).toBe(true)
        expect(suggestionNode2?.getTextContent()).toBe('new')
        expect(suggestionNode2?.getSuggestionTypeOrThrow()).toBe('insert')
        const suggestionNode3 = paragraph.getChildAtIndex<ProtonNode>(3)
        expect($isSuggestionNode(suggestionNode3)).toBe(true)
        expect(suggestionNode3?.getTextContent()).toBe('ld')
        expect(suggestionNode3?.getSuggestionTypeOrThrow()).toBe('delete')
      })
    })

    test('should insert paragraph above current if at start of block', async () => {
      await update(() => {
        const paragraph = $createParagraphNode().append($createTextNode('Hello'))
        $getRoot().append(paragraph)
        paragraph.selectStart()
        $handleBeforeInputEvent(
          editor!,
          {
            inputType: 'insertParagraph',
            data: null,
            dataTransfer: null,
          } as InputEvent,
          onSuggestionCreation,
        )
      })
      editor!.read(() => {
        const root = $getRoot()
        expect(root.getChildrenSize()).toBe(2)
        const paragraph1 = root.getChildAtIndex<ElementNode>(0)
        expect($isParagraphNode(paragraph1)).toBe(true)
        expect($isSuggestionNode(paragraph1?.getFirstChild())).toBe(true)
        expect(paragraph1?.getFirstChildOrThrow<ProtonNode>().getSuggestionTypeOrThrow()).toBe('split')
        const paragraph2 = root.getChildAtIndex<ElementNode>(1)
        expect($isParagraphNode(paragraph2)).toBe(true)
        expect(paragraph2?.getTextContent()).toBe('Hello')
      })
    })

    test('should split paragraph when "insertParagraph" in the middle', async () => {
      await update(() => {
        const paragraph = $createParagraphNode().append($createTextNode('Hello'))
        $getRoot().append(paragraph)
        paragraph.getFirstChildOrThrow<TextNode>().select(3, 3)
        $handleBeforeInputEvent(
          editor!,
          {
            inputType: 'insertParagraph',
            data: null,
            dataTransfer: null,
          } as InputEvent,
          onSuggestionCreation,
        )
      })
      editor!.read(() => {
        const root = $getRoot()
        expect(root.getChildrenSize()).toBe(2)
        const paragraph1 = root.getChildAtIndex<ElementNode>(0)
        expect($isParagraphNode(paragraph1)).toBe(true)
        expect($isTextNode(paragraph1?.getFirstChild())).toBe(true)
        expect(paragraph1?.getFirstChildOrThrow().getTextContent()).toBe('Hel')
        expect($isSuggestionNode(paragraph1?.getLastChild())).toBe(true)
        expect(paragraph1?.getLastChildOrThrow<ProtonNode>().getSuggestionTypeOrThrow()).toBe('split')
        const paragraph2 = root.getChildAtIndex<ElementNode>(1)
        expect($isParagraphNode(paragraph2)).toBe(true)
        expect(paragraph2?.getTextContent()).toBe('lo')
      })
    })

    test('should insert paragraph below when "insertParagraph" at the end', async () => {
      await update(() => {
        const paragraph = $createParagraphNode().append($createTextNode('Hello'))
        $getRoot().append(paragraph)
        paragraph.selectEnd()
        $handleBeforeInputEvent(
          editor!,
          {
            inputType: 'insertParagraph',
            data: null,
            dataTransfer: null,
          } as InputEvent,
          onSuggestionCreation,
        )
      })
      editor!.read(() => {
        const root = $getRoot()
        expect(root.getChildrenSize()).toBe(2)
        const paragraph1 = root.getChildAtIndex<ElementNode>(0)
        expect($isParagraphNode(paragraph1)).toBe(true)
        expect($isTextNode(paragraph1?.getFirstChild())).toBe(true)
        expect($isSuggestionNode(paragraph1?.getLastChild())).toBe(true)
        expect(paragraph1?.getLastChildOrThrow<ProtonNode>().getSuggestionTypeOrThrow()).toBe('split')
        const paragraph2 = root.getChildAtIndex<ElementNode>(1)
        expect($isParagraphNode(paragraph2)).toBe(true)
        expect(paragraph2?.getChildrenSize()).toBe(0)
      })
    })
  })

  describe('Deletion', () => {
    test('should wrap selection with "delete" selection', async () => {
      await update(() => {
        const paragraph = $createParagraphNode()
        const textNode = $createTextNode('Hello')
        paragraph.append(textNode)
        $getRoot().append(paragraph)
        textNode.select(0, 5)
        $handleBeforeInputEvent(
          editor!,
          {
            inputType: 'deleteContentBackward',
            data: null,
            dataTransfer: null,
          } as InputEvent,
          onSuggestionCreation,
        )
      })
      editor!.read(() => {
        const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()
        expect(paragraph.getChildrenSize()).toBe(1)
        const deleteSuggestion = paragraph.getChildAtIndex<ProtonNode>(0)
        expect($isSuggestionNode(deleteSuggestion)).toBe(true)
        expect(deleteSuggestion?.getSuggestionTypeOrThrow()).toBe('delete')
        expect(deleteSuggestion?.getTextContent()).toBe('Hello')
      })
    })

    test('should select and wrap character backward and forward', async () => {
      await update(() => {
        const paragraph = $createParagraphNode()
        const textNode = $createTextNode('Hello')
        paragraph.append(textNode)
        $getRoot().append(paragraph)
        textNode.selectStart()
      })
      await update(() => {
        $handleBeforeInputEvent(
          editor!,
          {
            inputType: 'deleteContentForward',
            data: null,
            dataTransfer: null,
          } as InputEvent,
          onSuggestionCreation,
        )
      })
      await update(() => {
        $setSelection($getRoot().getFirstChildOrThrow<ParagraphNode>().getLastChildOrThrow<TextNode>().selectEnd())
      })
      await update(() => {
        $handleBeforeInputEvent(
          editor!,
          {
            inputType: 'deleteContentBackward',
            data: null,
            dataTransfer: null,
          } as InputEvent,
          onSuggestionCreation,
        )
      })
      editor!.read(() => {
        const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()
        expect(paragraph.getChildrenSize()).toBe(3)
        const suggestion1 = paragraph.getChildAtIndex<ProtonNode>(0)
        expect($isSuggestionNode(suggestion1)).toBe(true)
        expect(suggestion1?.getSuggestionTypeOrThrow()).toBe('delete')
        expect(suggestion1?.getTextContent()).toBe('H')
        const suggestion2 = paragraph.getChildAtIndex<ProtonNode>(2)
        expect($isSuggestionNode(suggestion2)).toBe(true)
        expect(suggestion2?.getSuggestionTypeOrThrow()).toBe('delete')
        expect(suggestion2?.getTextContent()).toBe('o')
      })
    })

    test('should select and wrap word backward and forward', async () => {
      await update(() => {
        const paragraph = $createParagraphNode()
        const textNode = $createTextNode('Hello World')
        paragraph.append(textNode)
        $getRoot().append(paragraph)
        textNode.selectStart()
      })
      await update(() => {
        $handleBeforeInputEvent(
          editor!,
          {
            inputType: 'deleteWordForward',
            data: null,
            dataTransfer: null,
          } as InputEvent,
          onSuggestionCreation,
        )
      })
      await update(() => {
        $getRoot().getFirstChildOrThrow<ParagraphNode>().getLastChildOrThrow<TextNode>().selectEnd()
      })
      await update(() => {
        $handleBeforeInputEvent(
          editor!,
          {
            inputType: 'deleteWordBackward',
            data: null,
            dataTransfer: null,
          } as InputEvent,
          onSuggestionCreation,
        )
      })
      editor!.read(() => {
        const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()
        expect(paragraph.getChildrenSize()).toBe(3)
        const suggestion1 = paragraph.getChildAtIndex<ProtonNode>(0)
        expect($isSuggestionNode(suggestion1)).toBe(true)
        expect(suggestion1?.getSuggestionTypeOrThrow()).toBe('delete')
        expect(suggestion1?.getTextContent()).toBe('Hello')
        const suggestion2 = paragraph.getChildAtIndex<ProtonNode>(2)
        expect($isSuggestionNode(suggestion2)).toBe(true)
        expect(suggestion2?.getSuggestionTypeOrThrow()).toBe('delete')
        expect(suggestion2?.getTextContent()).toBe('World')
      })
    })

    test('should create join suggestion when backspacing at start of block', async () => {
      await update(() => {
        const paragraph1 = $createParagraphNode().append($createTextNode('Hello'))
        const paragraph2 = $createParagraphNode().append($createTextNode('World'))
        $getRoot().append(paragraph1, paragraph2)
        paragraph2.selectStart()
        $handleBeforeInputEvent(
          editor!,
          {
            inputType: 'deleteContentBackward',
            data: null,
            dataTransfer: null,
          } as InputEvent,
          onSuggestionCreation,
        )
      })
      editor!.read(() => {
        const root = $getRoot()
        expect(root.getChildrenSize()).toBe(2)
        const paragraph1 = root.getChildAtIndex<ElementNode>(0)
        expect($isParagraphNode(paragraph1)).toBe(true)
        expect($isTextNode(paragraph1?.getFirstChild())).toBe(true)
        expect($isSuggestionNode(paragraph1?.getLastChild())).toBe(true)
        expect(paragraph1?.getLastChildOrThrow<ProtonNode>().getSuggestionTypeOrThrow()).toBe('join')
        const paragraph2 = root.getChildAtIndex<ElementNode>(1)
        expect($isParagraphNode(paragraph2)).toBe(true)
        expect(paragraph2?.getTextContent()).toBe('World')
      })
    })

    test('should actually remove text when deleting inside or around an existing suggestion', async () => {
      await update(() => {
        const suggestionID = Math.random().toString()
        const paragraph = $createParagraphNode()
        const text1 = $createTextNode('Hello ')
        const suggestion = $createSuggestionNode(suggestionID, 'insert').append($createTextNode('Test'))
        const text2 = $createTextNode(' World')
        paragraph.append(text1, suggestion, text2)
        $getRoot().append(paragraph)
        suggestion.getFirstChild<TextNode>()?.select(2, 2)
      })
      await update(() => {
        $handleBeforeInputEvent(
          editor!,
          {
            inputType: 'deleteContentBackward',
            data: null,
            dataTransfer: null,
          } as InputEvent,
          onSuggestionCreation,
        )
        $getRoot().getFirstChild<ParagraphNode>()?.getChildAtIndex(1)?.selectStart()
      })
      await update(() => {
        $handleBeforeInputEvent(
          editor!,
          {
            inputType: 'deleteContentForward',
            data: null,
            dataTransfer: null,
          } as InputEvent,
          onSuggestionCreation,
        )
        $getRoot().getFirstChild<ParagraphNode>()?.getChildAtIndex(1)?.selectEnd()
      })
      await update(() => {
        $handleBeforeInputEvent(
          editor!,
          {
            inputType: 'deleteContentBackward',
            data: null,
            dataTransfer: null,
          } as InputEvent,
          onSuggestionCreation,
        )
      })
      editor!.read(() => {
        const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()
        expect(paragraph.getChildrenSize()).toBe(3)
        const suggestion = paragraph.getChildAtIndex<ProtonNode>(1)
        expect($isSuggestionNode(suggestion)).toBe(true)
        expect(suggestion?.getChildrenSize()).toBe(1)
        expect(suggestion?.getTextContent()).toBe('s')
      })
    })
  })

  describe('Replace', () => {
    test('should wrap selection with "delete" suggestion and insert text', async () => {
      await update(() => {
        const paragraph = $createParagraphNode()
        const textNode = $createTextNode('Hello')
        paragraph.append(textNode)
        $getRoot().append(paragraph)
        textNode.select(0, 5)
        $handleBeforeInputEvent(
          editor!,
          {
            inputType: 'insertText',
            data: 'World',
            dataTransfer: null,
          } as InputEvent,
          onSuggestionCreation,
        )
      })
      editor!.read(() => {
        const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()
        expect(paragraph.getChildrenSize()).toBe(2)
        const deleteSuggestion = paragraph.getChildAtIndex<ProtonNode>(0)
        expect($isSuggestionNode(deleteSuggestion)).toBe(true)
        expect(deleteSuggestion?.getSuggestionTypeOrThrow()).toBe('delete')
        expect(deleteSuggestion?.getTextContent()).toBe('Hello')
        const insertSuggestion = paragraph.getChildAtIndex<ProtonNode>(1)
        expect($isSuggestionNode(insertSuggestion)).toBe(true)
        expect(insertSuggestion?.getSuggestionTypeOrThrow()).toBe('insert')
        expect(insertSuggestion?.getTextContent()).toBe('World')
      })
    })
  })
})
