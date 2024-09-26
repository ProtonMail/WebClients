import type { ElementNode, LexicalEditor, ParagraphNode, RangeSelection, TextNode } from 'lexical'
import {
  $insertNodes,
  $isParagraphNode,
  $isTabNode,
  $isTextNode,
  $nodesOfType,
  $setSelection,
  COMMAND_PRIORITY_CRITICAL,
  SELECTION_INSERT_CLIPBOARD_NODES_COMMAND,
} from 'lexical'
import { $createParagraphNode, $createTextNode, $getRoot, $getSelection, $isRangeSelection } from 'lexical'
import { AllNodes } from '../../AllNodes'
import { $handleBeforeInputEvent } from './handleBeforeInputEvent'
import { ProtonNode } from './ProtonNode'
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
import type { ListItemNode } from '@lexical/list'
import { $createListItemNode, $createListNode } from '@lexical/list'
import { $selectionInsertClipboardNodes } from './selectionInsertClipboardNodes'
import type { Logger } from '@proton/utils/logs'

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
  const logger = {
    info: jest.fn(),
  } as unknown as Logger

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

    describe('Insert text next to insert-suggestion sibling', () => {
      let paragraph: ParagraphNode
      let suggestion: ProtonNode

      beforeEach(async () => {
        await update(() => {
          paragraph = $createParagraphNode().append($createTextNode('Hello'))
          suggestion = $createSuggestionNode('test', 'insert').append($createTextNode('World'))
          paragraph.append(suggestion)
          $getRoot().append(paragraph)
        })
      })

      describe('Previous sibling', () => {
        beforeEach(async () => {
          await update(() => {
            suggestion.selectEnd()
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
        })

        test('paragraph should only have 2 children', () => {
          editor!.read(() => {
            expect(paragraph.getChildrenSize()).toBe(2)
            expect($isTextNode(paragraph.getFirstChild())).toBe(true)
            expect($isSuggestionNode(paragraph.getLastChild())).toBe(true)
          })
        })

        test('inserted text should be merged at the end', () => {
          editor!.read(() => {
            expect(suggestion.getTextContent()).toBe('World!')
          })
        })

        test('selection should be at end of suggestion', () => {
          editor!.read(() => {
            const selection = $getSelection() as RangeSelection
            expect($isRangeSelection(selection)).toBe(true)
            expect(selection.isCollapsed()).toBe(true)
            const suggestionTextNode = suggestion.getFirstChildOrThrow()
            const focus = selection.focus.getNode()
            expect(focus.is(suggestionTextNode)).toBe(true)
            expect(selection.focus.offset).toBe(suggestionTextNode.getTextContentSize())
          })
        })
      })

      describe('Next sibling', () => {
        beforeEach(async () => {
          await update(() => {
            suggestion.selectStart()
            $handleBeforeInputEvent(
              editor!,
              {
                inputType: 'insertText',
                data: 'F',
                dataTransfer: null,
              } as InputEvent,
              onSuggestionCreation,
            )
            $handleBeforeInputEvent(
              editor!,
              {
                inputType: 'insertText',
                data: 'o',
                dataTransfer: null,
              } as InputEvent,
              onSuggestionCreation,
            )
            $handleBeforeInputEvent(
              editor!,
              {
                inputType: 'insertText',
                data: 'o',
                dataTransfer: null,
              } as InputEvent,
              onSuggestionCreation,
            )
          })
        })

        test('paragraph should only have 2 children', () => {
          editor!.read(() => {
            expect(paragraph.getChildrenSize()).toBe(2)
            expect($isTextNode(paragraph.getFirstChild())).toBe(true)
            expect($isSuggestionNode(paragraph.getLastChild())).toBe(true)
          })
        })

        test('inserted text should be merged at the start', () => {
          editor!.read(() => {
            expect(suggestion.getTextContent()).toBe('FooWorld')
          })
        })

        test('selection should be after the inserted text', () => {
          editor!.read(() => {
            const selection = $getSelection() as RangeSelection
            expect($isRangeSelection(selection)).toBe(true)
            expect(selection.isCollapsed()).toBe(true)
            const suggestionTextNode = suggestion.getFirstChildOrThrow()
            const focus = selection.focus.getNode()
            expect(focus.is(suggestionTextNode)).toBe(true)
            expect(selection.focus.offset).toBe('Foo'.length)
          })
        })
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

    describe('Insert paragraph', () => {
      let initialParagraph: ParagraphNode

      beforeEach(async () => {
        await update(() => {
          initialParagraph = $createParagraphNode().append($createTextNode('Hello'))
          $getRoot().append(initialParagraph)
        })
      })

      describe('At start of block', () => {
        beforeEach(async () => {
          await update(() => {
            initialParagraph.selectStart()
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
        })

        test('root should have 2 children', () => {
          editor!.read(() => {
            expect($getRoot().getChildrenSize()).toBe(2)
          })
        })

        test('first paragraph should have split node only', () => {
          editor!.read(() => {
            const root = $getRoot()
            const paragraph1 = root.getChildAtIndex<ElementNode>(0)
            expect($isParagraphNode(paragraph1)).toBe(true)
            expect(paragraph1?.getChildrenSize()).toBe(1)
            const child = paragraph1?.getFirstChild<ProtonNode>()
            expect($isSuggestionNode(child)).toBe(true)
            expect(child?.getSuggestionTypeOrThrow()).toBe('split')
          })
        })

        test('second paragraph should have text', () => {
          editor!.read(() => {
            const root = $getRoot()
            const paragraph2 = root.getChildAtIndex<ElementNode>(1)
            expect($isParagraphNode(paragraph2)).toBe(true)
            expect($isTextNode(paragraph2?.getFirstChild())).toBe(true)
            expect(paragraph2?.getTextContent()).toBe('Hello')
          })
        })
      })

      describe('In middle of block', () => {
        beforeEach(async () => {
          await update(() => {
            initialParagraph.getFirstChildOrThrow<TextNode>().select(3, 3)
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
        })

        test('root should have 2 children', () => {
          editor!.read(() => {
            expect($getRoot().getChildrenSize()).toBe(2)
          })
        })

        test('first paragraph should have part of initial text and split node', () => {
          editor!.read(() => {
            const paragraph1 = $getRoot().getChildAtIndex<ElementNode>(0)
            expect($isParagraphNode(paragraph1)).toBe(true)
            expect(paragraph1?.getChildrenSize()).toBe(2)
            const text = paragraph1?.getFirstChild()
            expect($isTextNode(text)).toBe(true)
            expect(text?.getTextContent()).toBe('Hel')
            const suggestion = paragraph1?.getLastChildOrThrow<ProtonNode>()
            expect($isSuggestionNode(suggestion)).toBe(true)
            expect(suggestion?.getSuggestionTypeOrThrow()).toBe('split')
          })
        })

        test('second paragraph should have rest of initial text', () => {
          editor!.read(() => {
            const paragraph2 = $getRoot().getChildAtIndex<ElementNode>(1)
            expect($isParagraphNode(paragraph2)).toBe(true)
            expect(paragraph2?.getTextContent()).toBe('lo')
          })
        })
      })

      describe('At end of block', () => {
        beforeEach(async () => {
          await update(() => {
            initialParagraph.selectEnd()
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
        })

        test('root should have 2 children', () => {
          editor!.read(() => {
            expect($getRoot().getChildrenSize()).toBe(2)
          })
        })

        test('first paragraph should have text and split node', () => {
          editor!.read(() => {
            const paragraph1 = $getRoot().getChildAtIndex<ElementNode>(0)
            expect($isParagraphNode(paragraph1)).toBe(true)
            expect($isTextNode(paragraph1?.getFirstChild())).toBe(true)
            expect($isSuggestionNode(paragraph1?.getLastChild())).toBe(true)
            expect(paragraph1?.getLastChildOrThrow<ProtonNode>().getSuggestionTypeOrThrow()).toBe('split')
          })
        })

        test('second paragraph should be empty', () => {
          editor!.read(() => {
            const paragraph2 = $getRoot().getChildAtIndex<ElementNode>(1)
            expect($isParagraphNode(paragraph2)).toBe(true)
            expect(paragraph2?.getChildrenSize()).toBe(0)
          })
        })

        test('consecutive splits should use same ID', async () => {
          await update(() => {
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
            const nodes = $nodesOfType(ProtonNode).filter($isSuggestionNode)
            expect(nodes.length).toBe(2)
            const first = nodes[0]
            const second = nodes[1]
            expect(first.getSuggestionIdOrThrow()).toBe(second.getSuggestionIdOrThrow())
          })
        })

        test('non-consecutive splits should not use same ID', async () => {
          await update(() => {
            $insertNodes([$createTextNode('World')])
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
            const nodes = $nodesOfType(ProtonNode).filter($isSuggestionNode)
            expect(nodes.length).toBe(2)
            const first = nodes[0]
            const second = nodes[1]
            expect(first.getSuggestionIdOrThrow()).not.toBe(second.getSuggestionIdOrThrow())
          })
        })
      })
    })

    describe('Plaintext-only data transfer', () => {
      let commandDisposer!: () => void

      beforeEach(async () => {
        commandDisposer = editor!.registerCommand(
          SELECTION_INSERT_CLIPBOARD_NODES_COMMAND,
          ({ nodes }) => $selectionInsertClipboardNodes(nodes, onSuggestionCreation, logger),
          COMMAND_PRIORITY_CRITICAL,
        )
        const dataTransfer = {
          getData: (format) => {
            if (format === 'text/plain') {
              return 'Hello\tWorld\nParagraph'
            }
            return ''
          },
        } as DataTransfer
        await update(() => {
          $handleBeforeInputEvent(
            editor!,
            {
              inputType: 'insertFromPaste',
              data: null,
              dataTransfer,
            } as InputEvent,
            onSuggestionCreation,
          )
        })
      })

      test('root should have 2 paragraphs', () => {
        editor!.read(() => {
          const root = $getRoot()
          const children = root.getChildren()
          expect(children.length).toBe(2)
          expect(children.every($isParagraphNode)).toBe(true)
        })
      })

      test('first paragraph should have text, tab, text nodes inside a suggestion', () => {
        editor!.read(() => {
          const paragraph = $getRoot().getChildAtIndex<ParagraphNode>(0)
          expect(paragraph?.getChildrenSize()).toBe(1)

          const child = paragraph?.getFirstChild<ProtonNode>()
          expect($isSuggestionNode(child)).toBe(true)

          expect($isTextNode(child?.getChildAtIndex(0))).toBe(true)
          expect($isTabNode(child?.getChildAtIndex(1))).toBe(true)
          expect($isTextNode(child?.getChildAtIndex(2))).toBe(true)
        })
      })

      test('second paragraph should have text node inside suggestion', () => {
        editor!.read(() => {
          const paragraph = $getRoot().getChildAtIndex<ParagraphNode>(1)
          expect(paragraph?.getChildrenSize()).toBe(1)

          const child = paragraph?.getFirstChild<ProtonNode>()
          expect($isSuggestionNode(child)).toBe(true)

          expect($isTextNode(child?.getChildAtIndex(0))).toBe(true)
        })
      })

      afterEach(() => {
        commandDisposer()
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

    describe('Join', () => {
      describe('Backspacing at start of block', () => {
        beforeEach(async () => {
          await update(() => {
            const paragraph1 = $createParagraphNode().append($createTextNode('Hello'))
            const paragraph2 = $createParagraphNode().append($createTextNode('World'))
            $getRoot().append(paragraph1, paragraph2)
            paragraph2.selectStart()
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
        })

        test('root should have 2 children', () => {
          editor!.read(() => {
            const root = $getRoot()
            expect(root.getChildrenSize()).toBe(2)
          })
        })

        test('first paragraph should have text and join node', () => {
          editor!.read(() => {
            const paragraph1 = $getRoot().getChildAtIndex<ElementNode>(0)
            expect($isParagraphNode(paragraph1)).toBe(true)
            expect($isTextNode(paragraph1?.getFirstChild())).toBe(true)
            expect($isSuggestionNode(paragraph1?.getLastChild())).toBe(true)
            expect(paragraph1?.getLastChildOrThrow<ProtonNode>().getSuggestionTypeOrThrow()).toBe('join')
          })
        })

        test('second paragraph should only have text', async () => {
          editor!.read(() => {
            const paragraph2 = $getRoot().getChildAtIndex<ElementNode>(1)
            expect($isParagraphNode(paragraph2)).toBe(true)
            expect(paragraph2?.getTextContent()).toBe('World')
          })
        })
      })

      describe('Backspacing at start of non-block non-inline element', () => {
        let paragraphNode!: ParagraphNode
        let normalListItem1!: ListItemNode

        beforeEach(async () => {
          await update(() => {
            const root = $getRoot()
            paragraphNode = $createParagraphNode().append($createTextNode('Paragraph'))
            root.append(paragraphNode)
            normalListItem1 = $createListItemNode().append($createTextNode('List Item 1'))
            const nestedListItem1 = $createListItemNode().append($createTextNode('Nested List Item 1'))
            const list = $createListNode('bullet').append(
              normalListItem1,
              $createListItemNode().append($createListNode('bullet').append(nestedListItem1)),
            )
            root.append(list)
            nestedListItem1.selectStart()
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
        })

        test('root should have 2 children', () => {
          editor!.read(() => {
            const root = $getRoot()
            expect(root.getChildrenSize()).toBe(2)
          })
        })

        test('paragraph should only have text', () => {
          editor!.read(() => {
            expect(paragraphNode.getChildrenSize()).toBe(1)
          })
        })

        test('normal list item 1 to have text and join node', async () => {
          editor!.read(() => {
            expect(normalListItem1.getChildrenSize()).toBe(2)
            expect($isTextNode(normalListItem1.getChildAtIndex(0))).toBe(true)
            expect($isSuggestionNode(normalListItem1.getChildAtIndex(1))).toBe(true)
          })
        })
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
