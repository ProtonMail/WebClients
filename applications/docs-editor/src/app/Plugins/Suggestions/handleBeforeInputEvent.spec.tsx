import type { ElementNode, LexicalCommand, LexicalEditor, ParagraphNode, RangeSelection } from 'lexical'
import { $createRangeSelection, TextNode } from 'lexical'
import { OUTDENT_CONTENT_COMMAND } from 'lexical'
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
import type { ListItemNode, ListNode } from '@lexical/list'
import { $isListItemNode } from '@lexical/list'
import { $createListItemNode, $createListNode, $isListNode } from '@lexical/list'
import { $selectionInsertClipboardNodes } from './selectionInsertClipboardNodes'
import type { Logger } from '@proton/utils/logs'
import { $createHorizontalRuleNode, $isHorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode'
import { assertCondition } from './TestUtils'
import type { TableCellNode, TableRowNode } from '@lexical/table'
import {
  $createTableCellNode,
  $createTableNode,
  $createTableNodeWithDimensions,
  $createTableRowNode,
  TableCellHeaderStates,
} from '@lexical/table'
import { $insertFirst, mergeRegister } from '@lexical/utils'
import type { BlockTypeChangeSuggestionProperties } from './Types'
import { LINK_CHANGE_COMMAND, ProtonLinkPlugin } from '../Link/LinkPlugin'
import { $handleLinkChangeSuggestion } from './handleLinkChangeSuggestion'
import { $isLinkNode } from '@lexical/link'

polyfillSelectionRelatedThingsForTests()

describe('$handleBeforeInputEvent', () => {
  let container: HTMLElement
  let reactRoot: Root
  let editor: LexicalEditor | null = null
  let dispatchCommandSpy: jest.SpyInstance<boolean, [type: LexicalCommand<unknown>, payload: unknown], any>

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
          <ProtonLinkPlugin />
        </LexicalComposer>
      )
    }

    await ReactTestUtils.act(async () => {
      reactRoot.render(<TestBase />)
      await Promise.resolve().then()
    })

    dispatchCommandSpy = jest.spyOn(editor!, 'dispatchCommand')

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

  function testEditorState(name: string, fn: () => void) {
    test(name, () => {
      editor!.read(fn)
    })
  }

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
          logger,
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
              logger,
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
              logger,
            )
            $handleBeforeInputEvent(
              editor!,
              {
                inputType: 'insertText',
                data: 'o',
                dataTransfer: null,
              } as InputEvent,
              onSuggestionCreation,
              logger,
            )
            $handleBeforeInputEvent(
              editor!,
              {
                inputType: 'insertText',
                data: 'o',
                dataTransfer: null,
              } as InputEvent,
              onSuggestionCreation,
              logger,
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
          logger,
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

    test('should insert text into existing delete suggestion and move selection accordingly', async () => {
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
          logger,
        )
      })
      editor!.read(() => {
        const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()
        expect(paragraph.getChildrenSize()).toBe(2)
        const suggestionNode = paragraph.getChildAtIndex<ProtonNode>(1)
        expect($isSuggestionNode(suggestionNode)).toBe(true)
        expect(suggestionNode?.getSuggestionTypeOrThrow()).toBe('delete')
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
        const suggestionNode = $createSuggestionNode(suggestionID, 'property-change').append($createTextNode('World'))
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
          logger,
        )
      })
      editor!.read(() => {
        const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()
        expect(paragraph.getChildrenSize()).toBe(4)
        const suggestionNode1 = paragraph.getChildAtIndex<ProtonNode>(1)
        expect($isSuggestionNode(suggestionNode1)).toBe(true)
        expect(suggestionNode1?.getTextContent()).toBe('Wor')
        expect(suggestionNode1?.getSuggestionTypeOrThrow()).toBe('property-change')
        const suggestionNode2 = paragraph.getChildAtIndex<ProtonNode>(2)
        expect($isSuggestionNode(suggestionNode2)).toBe(true)
        expect(suggestionNode2?.getTextContent()).toBe('new')
        expect(suggestionNode2?.getSuggestionTypeOrThrow()).toBe('insert')
        const suggestionNode3 = paragraph.getChildAtIndex<ProtonNode>(3)
        expect($isSuggestionNode(suggestionNode3)).toBe(true)
        expect(suggestionNode3?.getTextContent()).toBe('ld')
        expect(suggestionNode3?.getSuggestionTypeOrThrow()).toBe('property-change')
      })
    })

    describe('Insert paragraph', () => {
      describe('Inside paragraph', () => {
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
                logger,
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
                logger,
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
                logger,
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
                logger,
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
                logger,
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

      describe('Inside empty list item', () => {
        describe('Nested list', () => {
          beforeEach(async () => {
            await update(() => {
              const root = $getRoot()
              const listItem = $createListItemNode()
              const list = $createListNode('bullet').append(listItem)
              root.append(list)
              listItem.setIndent(1)
              listItem.selectEnd()
            })
            await update(() => {
              $handleBeforeInputEvent(
                editor!,
                {
                  inputType: 'insertParagraph',
                  data: null,
                  dataTransfer: null,
                } as InputEvent,
                onSuggestionCreation,
                logger,
              )
            })
          })

          test('root should have 1 child', () => {
            editor!.read(() => {
              expect($getRoot().getChildrenSize()).toBe(1)
            })
          })

          test('only child should be non-nested list', () => {
            editor!.read(() => {
              const list = $getRoot().getFirstChildOrThrow<ListNode>()
              expect($isListNode(list)).toBe(true)
              const listItem = list.getFirstChildOrThrow<ListItemNode>()
              expect($isListItemNode(listItem)).toBe(true)
              expect(listItem.getChildrenSize()).toBe(1)
            })
          })

          test('list item should have indent-change suggestion', () => {
            editor!.read(() => {
              const listItem = $getRoot().getFirstChildOrThrow<ListNode>().getFirstChildOrThrow<ListItemNode>()
              const suggestion = listItem.getFirstChildOrThrow<ProtonNode>()
              expect($isSuggestionNode(suggestion)).toBe(true)
              expect(suggestion.getSuggestionTypeOrThrow()).toBe('indent-change')
              expect(suggestion.__properties.nodePropertiesChanged!.indent).toBe(1)
            })
          })
        })

        describe('Non-nested list', () => {
          beforeEach(async () => {
            await update(() => {
              const root = $getRoot()
              const listItem = $createListItemNode()
              const list = $createListNode('bullet').append(listItem)
              root.append(list)
              listItem.selectEnd()
            })
            await update(() => {
              $handleBeforeInputEvent(
                editor!,
                {
                  inputType: 'insertParagraph',
                  data: null,
                  dataTransfer: null,
                } as InputEvent,
                onSuggestionCreation,
                logger,
              )
            })
          })

          test('root should have 1 child', () => {
            editor!.read(() => {
              expect($getRoot().getChildrenSize()).toBe(1)
            })
          })

          test('only child should be paragraph', () => {
            editor!.read(() => {
              expect($isParagraphNode($getRoot().getFirstChild())).toBe(true)
            })
          })

          test('list item should have block-type-change suggestion', () => {
            editor!.read(() => {
              const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()
              const suggestion = paragraph.getFirstChildOrThrow<ProtonNode>()
              expect($isSuggestionNode(suggestion)).toBe(true)
              expect(suggestion.getSuggestionTypeOrThrow()).toBe('block-type-change')
              expect(suggestion.__properties.nodePropertiesChanged!.initialBlockType).toBe('bullet')
            })
          })
        })

        describe('Has empty suggestion(s)', () => {
          beforeEach(async () => {
            await update(() => {
              const root = $getRoot()
              const listItem = $createListItemNode().append(
                $createSuggestionNode('test', 'align-change'),
                $createSuggestionNode('test', 'indent-change'),
              )
              const list = $createListNode('bullet').append(listItem)
              root.append(list)
              listItem.selectEnd()
            })
            await update(() => {
              $handleBeforeInputEvent(
                editor!,
                {
                  inputType: 'insertParagraph',
                  data: null,
                  dataTransfer: null,
                } as InputEvent,
                onSuggestionCreation,
                logger,
              )
            })
          })

          test('root should have 1 child', () => {
            editor!.read(() => {
              expect($getRoot().getChildrenSize()).toBe(1)
            })
          })

          test('only child should be paragraph', () => {
            editor!.read(() => {
              expect($isParagraphNode($getRoot().getFirstChild())).toBe(true)
            })
          })

          test('paragraph should have block-type-change suggestion', () => {
            editor!.read(() => {
              const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()
              const suggestion = paragraph.getFirstChildOrThrow<ProtonNode>()
              expect($isSuggestionNode(suggestion)).toBe(true)
              expect(suggestion.getSuggestionTypeOrThrow()).toBe('block-type-change')
              expect(suggestion.__properties.nodePropertiesChanged!.initialBlockType).toBe('bullet')
            })
          })

          test('paragraph should have existing suggestions', () => {
            editor!.read(() => {
              const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()
              const suggestion1 = paragraph.getChildAtIndex<ProtonNode>(1)!
              expect($isSuggestionNode(suggestion1)).toBe(true)
              expect(suggestion1.getSuggestionTypeOrThrow()).toBe('align-change')
              const suggestion2 = paragraph.getChildAtIndex<ProtonNode>(2)!
              expect($isSuggestionNode(suggestion2)).toBe(true)
              expect(suggestion2.getSuggestionTypeOrThrow()).toBe('indent-change')
            })
          })
        })
      })
    })

    describe('Plaintext-only data transfer', () => {
      describe('Non-URL text', () => {
        let commandDisposer!: () => void

        beforeEach(async () => {
          commandDisposer = editor!.registerCommand(
            SELECTION_INSERT_CLIPBOARD_NODES_COMMAND,
            ({ nodes }) => $selectionInsertClipboardNodes(nodes, onSuggestionCreation, logger),
            COMMAND_PRIORITY_CRITICAL,
          )
          const dataTransfer = {
            getData: (format: string) => {
              if (format === 'text/plain') {
                return 'Hello\tWorld\nParagraph'
              }
              return ''
            },
            types: [],
          } as unknown as DataTransfer
          await update(() => {
            $getRoot().select()
            $handleBeforeInputEvent(
              editor!,
              {
                inputType: 'insertFromPaste',
                data: null,
                dataTransfer,
              } as InputEvent,
              onSuggestionCreation,
              logger,
            )
          })
        })

        afterEach(() => {
          commandDisposer()
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
      })

      describe('URL text', () => {
        let commandDisposer!: () => void

        const word = 'Proton'
        const url = 'https://proton.me/'

        beforeEach(async () => {
          commandDisposer = mergeRegister(
            editor!.registerCommand(
              SELECTION_INSERT_CLIPBOARD_NODES_COMMAND,
              ({ nodes }) => $selectionInsertClipboardNodes(nodes, onSuggestionCreation, logger),
              COMMAND_PRIORITY_CRITICAL,
            ),
            editor!.registerCommand(
              LINK_CHANGE_COMMAND,
              (payload) => $handleLinkChangeSuggestion(editor!, payload, logger, onSuggestionCreation),
              COMMAND_PRIORITY_CRITICAL,
            ),
          )
          const dataTransfer = {
            getData: (format: string) => {
              if (format === 'text/plain') {
                return url
              }
              return ''
            },
            types: [],
          } as unknown as DataTransfer
          await update(() => {
            $getRoot().select()
            $handleBeforeInputEvent(
              editor!,
              {
                inputType: 'insertFromPaste',
                data: null,
                dataTransfer,
              } as InputEvent,
              onSuggestionCreation,
              logger,
            )
          })
          await update(() => {
            const paragraph = $createParagraphNode()
            const text = $createTextNode(word)
            $getRoot().append(paragraph.append(text))
            $setSelection(text.select(0, text.__text.length))
          })
          await update(() => {
            $handleBeforeInputEvent(
              editor!,
              {
                inputType: 'insertFromPaste',
                data: null,
                dataTransfer,
              } as InputEvent,
              onSuggestionCreation,
              logger,
            )
          })
        })

        test('root should have 1 paragraph', () => {
          editor!.read(() => {
            const root = $getRoot()
            const children = root.getChildren()
            expect(children.length).toBe(2)
            expect(children.every($isParagraphNode)).toBe(true)
          })
        })

        test('first paragraph should have link inside insert suggestion', () => {
          editor!.read(() => {
            const paragraph = $getRoot().getChildAtIndex<ParagraphNode>(0)
            expect(paragraph?.getChildrenSize()).toBe(1)

            const child = paragraph?.getFirstChild<ProtonNode>()
            assertCondition($isSuggestionNode(child))
            expect(child.getSuggestionTypeOrThrow()).toBe('insert')

            const link = child?.getFirstChild()
            assertCondition($isLinkNode(link))
            expect(link.getURL()).toBe(url)

            const text = link.getFirstChild()
            assertCondition($isTextNode(text))
            expect(text.getTextContent()).toBe(url)
          })
        })

        test('second paragraph should have link-change suggestion', () => {
          editor!.read(() => {
            const paragraph = $getRoot().getChildAtIndex<ParagraphNode>(1)
            expect(paragraph?.getChildrenSize()).toBe(1)

            const child = paragraph?.getFirstChild<ProtonNode>()
            assertCondition($isSuggestionNode(child))
            expect(child.exportJSON()).toMatchObject({
              properties: {
                suggestionType: 'link-change',
                nodePropertiesChanged: {
                  __url: null,
                },
              },
            })

            const link = child?.getFirstChild()
            assertCondition($isLinkNode(link))
            expect(link.getURL()).toBe(url)

            const text = link.getFirstChild()
            assertCondition($isTextNode(text))
            expect(text.getTextContent()).toBe(word)
          })
        })

        afterEach(() => {
          commandDisposer()
        })
      })
    })

    describe('Inline code', () => {
      describe('Outside of suggestion', () => {
        let paragraph: ParagraphNode
        let inlineCodeOutsideOfSuggestion: TextNode

        beforeEach(async () => {
          await update(() => {
            inlineCodeOutsideOfSuggestion = $createTextNode('Foo').toggleFormat('code')
            paragraph = $createParagraphNode().append(inlineCodeOutsideOfSuggestion)
            $getRoot().append(paragraph)
          })
        })

        describe('Inserting non-whitespace text should split node and create suggestion', () => {
          beforeEach(async () => {
            await update(() => {
              inlineCodeOutsideOfSuggestion.select(1, 1)
              $handleBeforeInputEvent(
                editor!,
                {
                  inputType: 'insertText',
                  data: 'Baz',
                  dataTransfer: null,
                } as InputEvent,
                onSuggestionCreation,
                logger,
              )
            })
          })

          test('paragraph should have 3 children', () => {
            editor!.read(() => {
              expect(paragraph.getChildrenSize()).toBe(3)
            })
          })

          test('first and last node should be text nodes', () => {
            editor!.read(() => {
              const first = paragraph.getFirstChild()
              const last = paragraph.getLastChild()
              expect($isTextNode(first)).toBe(true)
              expect($isTextNode(last)).toBe(true)
            })
          })

          test('middle node should be suggestion with inserted text', () => {
            editor!.read(() => {
              const suggestion = paragraph.getChildAtIndex<ProtonNode>(1)
              expect($isSuggestionNode(suggestion)).toBe(true)
              expect(suggestion?.getSuggestionTypeOrThrow()).toBe('insert')
              const text = suggestion?.getFirstChild<TextNode>()
              expect($isTextNode(text)).toBe(true)
              expect(text?.getTextContent()).toBe('Baz')
            })
          })
        })

        describe('Inserting whitespace at end should create suggestion after node', () => {
          beforeEach(async () => {
            await update(() => {
              inlineCodeOutsideOfSuggestion.selectEnd()
              $handleBeforeInputEvent(
                editor!,
                {
                  inputType: 'insertText',
                  data: ' ',
                  dataTransfer: null,
                } as InputEvent,
                onSuggestionCreation,
                logger,
              )
            })
          })

          test('paragraph should have 2 children', () => {
            editor!.read(() => {
              expect(paragraph.getChildrenSize()).toBe(2)
            })
          })

          test('first child should be text node with all existing text', () => {
            editor!.read(() => {
              const first = paragraph.getFirstChild()
              expect($isTextNode(first)).toBe(true)
              expect(first?.getTextContent()).toBe('Foo')
            })
          })

          test('last child should be suggestion with whitespace text node', () => {
            editor!.read(() => {
              const last = paragraph.getLastChild<ProtonNode>()
              expect($isSuggestionNode(last)).toBe(true)
              expect(last?.getSuggestionTypeOrThrow()).toBe('insert')
              const text = last?.getFirstChild()
              expect($isTextNode(text)).toBe(true)
              expect(text?.getTextContent()).toBe(' ')
            })
          })
        })
      })

      describe('Inside of insert-suggestion', () => {
        let paragraph: ParagraphNode
        let inlineCodeInsideInsertSuggestion: TextNode

        beforeEach(async () => {
          await update(() => {
            inlineCodeInsideInsertSuggestion = $createTextNode('Bar').toggleFormat('code')
            paragraph = $createParagraphNode().append(
              $createSuggestionNode('test', 'insert').append(inlineCodeInsideInsertSuggestion),
            )
            $getRoot().append(paragraph)
          })
        })

        describe('Inserting non-whitespace text should just insert it', () => {
          beforeEach(async () => {
            await update(() => {
              inlineCodeInsideInsertSuggestion.select(1, 1)
              $handleBeforeInputEvent(
                editor!,
                {
                  inputType: 'insertText',
                  data: 'Baz',
                  dataTransfer: null,
                } as InputEvent,
                onSuggestionCreation,
                logger,
              )
            })
          })

          test('paragraph should have one child', () => {
            editor!.read(() => {
              expect(paragraph.getChildrenSize()).toBe(1)
            })
          })

          test('suggestion should contain inserted text', () => {
            editor!.read(() => {
              const suggestion = paragraph.getFirstChild<ProtonNode>()
              expect($isSuggestionNode(suggestion)).toBe(true)
              expect(suggestion?.getChildrenSize()).toBe(1)
              expect(suggestion?.getTextContent()).toBe('BBazar')
            })
          })

          test('selection should be in correct place', () => {
            editor!.read(() => {
              const selection = $getSelection() as RangeSelection
              expect($isRangeSelection(selection)).toBe(true)
              expect(selection.isCollapsed()).toBe(true)
              expect(selection.focus.key).toBe(inlineCodeInsideInsertSuggestion.__key)
              expect(selection.focus.offset).toBe(4)
            })
          })
        })

        describe('Inserting whitespace at end should insert it as separate text node after current', () => {
          beforeEach(async () => {
            await update(() => {
              inlineCodeInsideInsertSuggestion.selectEnd()
              $handleBeforeInputEvent(
                editor!,
                {
                  inputType: 'insertText',
                  data: ' ',
                  dataTransfer: null,
                } as InputEvent,
                onSuggestionCreation,
                logger,
              )
            })
          })

          test('paragraph should have one child', () => {
            editor!.read(() => {
              expect(paragraph.getChildrenSize()).toBe(1)
            })
          })

          test('suggestion should have 2 children', () => {
            editor!.read(() => {
              const suggestion = paragraph.getFirstChild<ProtonNode>()
              expect(suggestion?.getChildrenSize()).toBe(2)
            })
          })

          test('whitespace should be added as separate text node', () => {
            editor!.read(() => {
              const suggestion = paragraph.getFirstChild<ProtonNode>()
              const first = suggestion?.getFirstChild<TextNode>()
              expect($isTextNode(first)).toBe(true)
              expect(first?.hasFormat('code')).toBe(true)
              expect(first?.getTextContent()).toBe('Bar')
              const second = suggestion?.getLastChild<TextNode>()
              expect($isTextNode(second)).toBe(true)
              expect(second?.hasFormat('code')).toBe(false)
              expect(second?.getTextContent()).toBe(' ')
            })
          })
        })
      })
    })

    describe('Inside existing empty suggestion', () => {
      describe('Existing suggestion is inside non-inline leaf element', () => {
        beforeEach(async () => {
          await update(() => {
            const paragraph = $createParagraphNode()
            const emptySuggestion = $createSuggestionNode('test', 'align-change')
            paragraph.append(emptySuggestion)
            $getRoot().append(paragraph)
            paragraph.selectStart()
          })
          await update(() => {
            $handleBeforeInputEvent(
              editor!,
              {
                inputType: 'insertText',
                data: 'foo',
                dataTransfer: null,
              } as InputEvent,
              onSuggestionCreation,
              logger,
            )
          })
        })

        testEditorState('paragraph should have 2 children', () => {
          const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()
          expect(paragraph.getChildrenSize()).toBe(2)
        })

        testEditorState('new suggestion should be inserted after existing', () => {
          const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()
          const newSuggestion = paragraph.getChildAtIndex(1)
          assertCondition($isSuggestionNode(newSuggestion))
          expect(newSuggestion.getSuggestionTypeOrThrow()).toBe('insert')
          expect(newSuggestion.getChildrenSize()).toBe(1)
          const text = newSuggestion.getFirstChildOrThrow()
          assertCondition($isTextNode(text))
          expect(text.getTextContent()).toBe('foo')
        })
      })

      describe('Existing suggestion has non-inline leaf element sibling', () => {
        beforeEach(async () => {
          await update(() => {
            const table = $createTableNodeWithDimensions(1, 1)
            const cell = table.getFirstChildOrThrow<TableRowNode>().getFirstChildOrThrow<TableCellNode>()
            const emptySuggestion = $createSuggestionNode('test', 'align-change')
            $insertFirst(cell, emptySuggestion)
            $getRoot().append(table)
            cell.selectStart()
          })
          await update(() => {
            $handleBeforeInputEvent(
              editor!,
              {
                inputType: 'insertText',
                data: 'foo',
                dataTransfer: null,
              } as InputEvent,
              onSuggestionCreation,
              logger,
            )
          })
        })

        testEditorState('paragraph should have 1 child', () => {
          const paragraph = $getRoot().getFirstDescendant()!.getParentOrThrow<TableCellNode>().getChildAtIndex(1)
          assertCondition($isParagraphNode(paragraph))
          expect(paragraph.getChildrenSize()).toBe(1)
        })

        testEditorState('new suggestion should be inserted in paragraph', () => {
          const paragraph = $getRoot().getFirstDescendant()!.getParentOrThrow<TableCellNode>().getChildAtIndex(1)
          assertCondition($isParagraphNode(paragraph))
          const newSuggestion = paragraph.getFirstChild()
          assertCondition($isSuggestionNode(newSuggestion))
          expect(newSuggestion.getSuggestionTypeOrThrow()).toBe('insert')
          expect(newSuggestion.getChildrenSize()).toBe(1)
          const text = newSuggestion.getFirstChildOrThrow()
          assertCondition($isTextNode(text))
          expect(text.getTextContent()).toBe('foo')
        })
      })

      describe('Existing suggestion doesnt have non-inline leaf element sibling', () => {
        beforeEach(async () => {
          await update(() => {
            const table = $createTableNode()
            const row = $createTableRowNode()
            const cell = $createTableCellNode(TableCellHeaderStates.NO_STATUS)
            table.append(row.append(cell))
            const emptySuggestion = $createSuggestionNode('test', 'align-change')
            $insertFirst(cell, emptySuggestion)
            $getRoot().append(table)
            cell.selectStart()
          })
          await update(() => {
            $handleBeforeInputEvent(
              editor!,
              {
                inputType: 'insertText',
                data: 'foo',
                dataTransfer: null,
              } as InputEvent,
              onSuggestionCreation,
              logger,
            )
          })
        })

        testEditorState('paragraph should be created after existing suggestion', () => {
          const existingSuggestion = $getRoot().getFirstDescendant()
          assertCondition(
            $isSuggestionNode(existingSuggestion) && existingSuggestion.getSuggestionTypeOrThrow() === 'align-change',
          )
          const paragraph = existingSuggestion.getParentOrThrow<TableCellNode>().getChildAtIndex(1)
          assertCondition($isParagraphNode(paragraph))
          expect(paragraph.getChildrenSize()).toBe(1)
        })

        testEditorState('new suggestion should be inserted in paragraph', () => {
          const paragraph = $getRoot().getFirstDescendant()!.getParentOrThrow<TableCellNode>().getChildAtIndex(1)
          assertCondition($isParagraphNode(paragraph))
          const newSuggestion = paragraph.getFirstChild()
          assertCondition($isSuggestionNode(newSuggestion))
          expect(newSuggestion.getSuggestionTypeOrThrow()).toBe('insert')
          expect(newSuggestion.getChildrenSize()).toBe(1)
          const text = newSuggestion.getFirstChildOrThrow()
          assertCondition($isTextNode(text))
          expect(text.getTextContent()).toBe('foo')
        })
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
          logger,
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
          logger,
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
          logger,
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
          logger,
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
          logger,
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
              logger,
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

      describe('Backspacing at start of list item', () => {
        describe('Nested list item', () => {
          beforeEach(async () => {
            await update(() => {
              const paragraph = $createParagraphNode().append($createTextNode('1'))
              const list = $createListNode('number').append($createListItemNode().append($createTextNode('2')))
              const nestedItem = $createListItemNode().append($createTextNode('3'))
              list.append(nestedItem)
              $getRoot().append(paragraph, list)
              nestedItem.setIndent(1)
              nestedItem.selectStart()
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
                logger,
              )
            })
          })

          test('OUTDENT_CONTENT_COMMAND should be dispatched', () => {
            expect(dispatchCommandSpy).toHaveBeenCalledWith(OUTDENT_CONTENT_COMMAND, undefined)
          })
        })

        describe('Non-nested list item', () => {
          beforeEach(async () => {
            await update(() => {
              const paragraph = $createParagraphNode().append($createTextNode('1'))
              const firstListItem = $createListItemNode().append($createTextNode('2'))
              const list = $createListNode('number').append(
                firstListItem,
                $createListItemNode().append($createTextNode('3')),
              )
              $getRoot().append(paragraph, list)
              firstListItem.selectStart()
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
                logger,
              )
            })
          })

          testEditorState('paragraph should have text and join nodes', () => {
            const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()
            expect(paragraph.getChildrenSize()).toBe(2)
            expect($isTextNode(paragraph.getFirstChild())).toBe(true)
            const suggestion = paragraph.getLastChildOrThrow<ProtonNode>()
            expect($isSuggestionNode(suggestion)).toBe(true)
            expect(suggestion.getSuggestionTypeOrThrow()).toBe('join')
          })

          testEditorState('selection should be collapsed before join node', () => {
            const selection = $getSelection()
            if (!$isRangeSelection(selection)) {
              throw new Error('Expected range')
            }
            expect(selection.isCollapsed()).toBe(true)
            const text = $getRoot().getFirstChildOrThrow<ParagraphNode>().getFirstChildOrThrow<TextNode>()
            const focus = selection.focus
            expect(focus.offset).toBe(text.getTextContentSize())
            expect(focus.getNode().is(text)).toBe(true)
          })
        })
      })

      describe('Backspacing when previous block is empty', () => {
        describe('Previous block is previous sibling', () => {
          beforeEach(async () => {
            await update(() => {
              const p1 = $createParagraphNode().append($createTextNode(''))
              const p2 = $createParagraphNode().append($createTextNode('a'))
              $getRoot().append(p1, p2)
              p2.selectStart()
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
                logger,
              )
            })
          })

          testEditorState('previous block should have join suggestion', () => {
            const p1 = $getRoot().getFirstChildOrThrow<ParagraphNode>()
            const join = p1.getFirstChildOrThrow<ProtonNode>()
            expect($isSuggestionNode(join)).toBe(true)
            expect(join.getSuggestionTypeOrThrow()).toBe('join')
          })

          testEditorState('selection should at start of 1st paragraph', () => {
            const p1 = $getRoot().getFirstChildOrThrow<ParagraphNode>()
            const selection = $getSelection()
            if (!$isRangeSelection(selection)) {
              throw new Error('Not a range')
            }
            expect(selection.isCollapsed()).toBe(true)
            const focus = selection.focus
            expect(focus.offset).toBe(0)
            expect(focus.getNode().is(p1.getFirstChild())).toBe(true)
          })
        })

        describe('Previous block is nested list item', () => {
          beforeEach(async () => {
            await update(() => {
              const list = $createListNode('bullet')
              const listItem = $createListItemNode()
              list.append(listItem)
              const p1 = $createParagraphNode().append($createTextNode(''))
              $getRoot().append(list, p1)
              listItem.setIndent(1)
              p1.selectStart()
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
                logger,
              )
            })
          })

          testEditorState('nested list item should have join suggestion', () => {
            const nestedList = $getRoot()
              .getFirstChildOrThrow<ListNode>()
              .getFirstChildOrThrow<ListItemNode>()
              .getFirstChildOrThrow<ListNode>()
            const nestedListItem = nestedList.getFirstChildOrThrow<ListItemNode>()
            const join = nestedListItem.getFirstChildOrThrow<ProtonNode>()
            expect($isSuggestionNode(join)).toBe(true)
            expect(join.getSuggestionTypeOrThrow()).toBe('join')
          })

          testEditorState('selection should at start of nested list item', () => {
            const nestedList = $getRoot()
              .getFirstChildOrThrow<ListNode>()
              .getFirstChildOrThrow<ListItemNode>()
              .getFirstChildOrThrow<ListNode>()
            const nestedListItem = nestedList.getFirstChildOrThrow<ListItemNode>()
            const selection = $getSelection()
            if (!$isRangeSelection(selection)) {
              throw new Error('Not a range')
            }
            expect(selection.isCollapsed()).toBe(true)
            const focus = selection.focus
            expect(focus.offset).toBe(0)
            expect(focus.getNode().is(nestedListItem.getFirstChild())).toBe(true)
          })
        })
      })

      describe('Backspacing when previous block has split suggestion', () => {
        describe('Previous block is previous sibling', () => {
          beforeEach(async () => {
            await update(() => {
              const p1 = $createParagraphNode().append($createTextNode('1'), $createSuggestionNode('test', 'split'))
              const p2 = $createParagraphNode().append($createTextNode('2'))
              $getRoot().append(p1, p2)
              p2.selectStart()
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
                logger,
              )
            })
          })

          testEditorState('root should have 1 child', () => {
            const root = $getRoot()
            expect(root.getChildrenSize()).toBe(1)
            expect($isParagraphNode(root.getFirstChild())).toBe(true)
          })

          testEditorState('split suggestion should be removed', () => {
            const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()
            expect(paragraph.getChildrenSize()).toBe(1)
            expect($isTextNode(paragraph.getFirstChild())).toBe(true)
          })

          testEditorState('content should be merged', () => {
            const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()
            expect(paragraph.getTextContent()).toBe('12')
          })

          testEditorState('selection should be between merged content', () => {
            const textNode = $getRoot().getFirstChildOrThrow<ParagraphNode>().getFirstChildOrThrow<TextNode>()
            const selection = $getSelection()
            if (!$isRangeSelection(selection)) {
              throw new Error('Not a range')
            }
            expect(selection.isCollapsed()).toBe(true)
            const focus = selection.focus
            expect(focus.offset).toBe(1)
            expect(focus.getNode().is(textNode)).toBe(true)
          })
        })

        describe('Previous block is nested list item', () => {
          beforeEach(async () => {
            await update(() => {
              const list = $createListNode('bullet')
              const listItem = $createListItemNode().append(
                $createTextNode('1'),
                $createSuggestionNode('test', 'split'),
              )
              list.append(listItem)
              const p1 = $createParagraphNode().append($createTextNode('2'))
              $getRoot().append(list, p1)
              listItem.setIndent(1)
              p1.selectStart()
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
                logger,
              )
            })
          })

          testEditorState('root should have 1 child', () => {
            const root = $getRoot()
            expect(root.getChildrenSize()).toBe(1)
            expect($isListNode(root.getFirstChild())).toBe(true)
          })

          testEditorState('split node should be removed', () => {
            const nestedListItem = $getRoot()
              .getFirstChildOrThrow<ListNode>()
              .getFirstChildOrThrow<ListItemNode>()
              .getFirstChildOrThrow<ListNode>()
              .getFirstChildOrThrow<ListItemNode>()
            expect(nestedListItem.getChildrenSize()).toBe(1)
            expect($isTextNode(nestedListItem.getFirstChild())).toBe(true)
          })

          testEditorState('content should be merged', () => {
            const nestedListItem = $getRoot()
              .getFirstChildOrThrow<ListNode>()
              .getFirstChildOrThrow<ListItemNode>()
              .getFirstChildOrThrow<ListNode>()
              .getFirstChildOrThrow<ListItemNode>()
            expect(nestedListItem.getTextContent()).toBe('12')
          })

          testEditorState('selection should be between merged content', () => {
            const nestedListItem = $getRoot()
              .getFirstChildOrThrow<ListNode>()
              .getFirstChildOrThrow<ListItemNode>()
              .getFirstChildOrThrow<ListNode>()
              .getFirstChildOrThrow<ListItemNode>()
            const textNode = nestedListItem.getFirstChildOrThrow<TextNode>()
            const selection = $getSelection()
            if (!$isRangeSelection(selection)) {
              throw new Error('Not a range')
            }
            expect(selection.isCollapsed()).toBe(true)
            const focus = selection.focus
            expect(focus.offset).toBe(1)
            expect(focus.getNode().is(textNode)).toBe(true)
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
          logger,
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
          logger,
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
          logger,
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

    test('should wrap prev divider when backspacing at start of block', async () => {
      await update(() => {
        const paragraph1 = $createParagraphNode().append($createTextNode('Hello'))
        const divider = $createHorizontalRuleNode()
        const paragraph2 = $createParagraphNode()
        const text = $createTextNode('World')
        paragraph2.append(text)
        $getRoot().append(paragraph1, divider, paragraph2)
        text.select(0, 0)
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
          logger,
        )
      })
      editor!.read(() => {
        const root = $getRoot()
        const suggestion = root.getChildAtIndex<ProtonNode>(1)!
        expect($isSuggestionNode(suggestion)).toBe(true)
        expect(suggestion.getSuggestionTypeOrThrow()).toBe('delete')

        expect(suggestion.getChildrenSize()).toBe(1)
        expect($isHorizontalRuleNode(suggestion.getFirstChild())).toBe(true)

        const selection = $getSelection()
        expect(selection?.isCollapsed()).toBe(true)

        const anchor = selection?.getStartEndPoints()![0]
        const anchorNode = anchor!.getNode()
        const firstParagraph = root.getFirstChildOrThrow<ParagraphNode>()
        expect(anchorNode.is(firstParagraph)).toBe(true)
        expect(anchor!.offset).toBe(firstParagraph.getChildrenSize())
      })
    })

    test('should actually delete divider inserted as suggestion when backspacing at start of block', async () => {
      await update(() => {
        const paragraph1 = $createParagraphNode().append($createTextNode('Hello'))
        const divider = $createSuggestionNode('test', 'insert').append($createHorizontalRuleNode())
        const paragraph2 = $createParagraphNode()
        const text = $createTextNode('World')
        paragraph2.append(text)
        $getRoot().append(paragraph1, divider, paragraph2)
        text.select(0, 0)
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
          logger,
        )
      })
      editor!.read(() => {
        const root = $getRoot()
        expect(root.getChildrenSize()).toBe(2)

        for (const child of root.getChildren()) {
          expect($isParagraphNode(child)).toBe(true)
        }

        const selection = $getSelection()
        expect(selection?.isCollapsed()).toBe(true)
      })
    })

    describe('Existing suggestion', () => {
      describe('Insert suggestion', () => {
        beforeEach(async () => {
          await update(() => {
            const text = $createTextNode('Hello')
            const suggestion = $createSuggestionNode('test', 'insert')
            suggestion.append(text)
            $getRoot().append($createParagraphNode().append(suggestion))
            text.select(2, 4)
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
              logger,
            )
          })
        })

        testEditorState('paragraph should have single insert suggestion', () => {
          const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()
          expect(paragraph.getChildrenSize()).toBe(1)
          const suggestion = paragraph.getFirstChildOrThrow()
          assertCondition($isSuggestionNode(suggestion))
          expect(suggestion.getSuggestionTypeOrThrow()).toBe('insert')
        })

        testEditorState('suggestion should have single text node', () => {
          const suggestion = $getRoot().getFirstChildOrThrow<ParagraphNode>()?.getFirstChildOrThrow<ProtonNode>()
          expect(suggestion?.getChildrenSize()).toBe(1)
          expect($isTextNode(suggestion?.getFirstChild())).toBe(true)
        })

        testEditorState('text should actually be deleted from suggestion', () => {
          const text = $getRoot()
            .getFirstChildOrThrow<ParagraphNode>()
            ?.getFirstChildOrThrow<ProtonNode>()
            .getFirstChildOrThrow<TextNode>()
          expect(text.getTextContent()).toBe('Heo')
        })
      })

      describe('Delete suggestion', () => {
        beforeEach(async () => {
          await update(() => {
            const text = $createTextNode('Hello')
            const suggestion = $createSuggestionNode('test', 'delete')
            suggestion.append(text)
            $getRoot().append($createParagraphNode().append(suggestion))
            text.select(2, 4)
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
              logger,
            )
          })
        })

        testEditorState('paragraph should have single delete suggestion', () => {
          const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()
          expect(paragraph.getChildrenSize()).toBe(1)
          const suggestion = paragraph.getFirstChildOrThrow()
          assertCondition($isSuggestionNode(suggestion))
          expect(suggestion.getSuggestionTypeOrThrow()).toBe('delete')
        })

        testEditorState('suggestion should have single text node', () => {
          const suggestion = $getRoot().getFirstChildOrThrow<ParagraphNode>()?.getFirstChildOrThrow<ProtonNode>()
          expect(suggestion?.getChildrenSize()).toBe(1)
          expect($isTextNode(suggestion?.getFirstChild())).toBe(true)
        })

        testEditorState('text should not be deleted from suggestion', () => {
          const text = $getRoot()
            .getFirstChildOrThrow<ParagraphNode>()
            ?.getFirstChildOrThrow<ProtonNode>()
            .getFirstChildOrThrow<TextNode>()
          expect(text.getTextContent()).toBe('Hello')
        })
      })

      describe('Replace suggestion', () => {
        beforeEach(async () => {
          await update(() => {
            const deleteText = $createTextNode('Hello')
            const deleteSuggestion = $createSuggestionNode('test', 'delete')
            deleteSuggestion.append(deleteText)
            const insertText = $createTextNode('World')
            const insertSuggestion = $createSuggestionNode('test', 'insert')
            insertSuggestion.append(insertText)
            $getRoot().append($createParagraphNode().append(deleteSuggestion, insertSuggestion))
            const selection = $createRangeSelection()
            selection.anchor.set(deleteText.__key, 0, 'text')
            selection.focus.set(insertText.__key, insertText.getTextContentSize(), 'text')
            $setSelection(selection)
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
              logger,
            )
          })
        })

        testEditorState('paragraph should have delete and insert suggestion nodes', () => {
          const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()
          expect(paragraph.getChildrenSize()).toBe(2)
          const deleteSuggestion = paragraph.getChildAtIndex(0)
          assertCondition($isSuggestionNode(deleteSuggestion))
          expect(deleteSuggestion.getSuggestionTypeOrThrow()).toBe('delete')
          const insertSuggestion = paragraph.getChildAtIndex(1)
          assertCondition($isSuggestionNode(insertSuggestion))
          expect(insertSuggestion.getSuggestionTypeOrThrow()).toBe('insert')
        })

        testEditorState('text should not be deleted from suggestion', () => {
          const textNodes = $nodesOfType(TextNode)
          const first = textNodes[0]
          expect(first.getTextContent()).toBe('Hello')
          const second = textNodes[1]
          expect(second.getTextContent()).toBe('World')
        })
      })
    })

    describe('Start of block', () => {
      describe('Indented block', () => {
        beforeEach(async () => {
          await update(() => {
            const paragraph = $createParagraphNode().append($createTextNode('Hello')).setIndent(2)
            $getRoot().append(paragraph)
            paragraph.selectStart()
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
              logger,
            )
            $handleBeforeInputEvent(
              editor!,
              {
                inputType: 'deleteContentBackward',
                data: null,
                dataTransfer: null,
              } as InputEvent,
              onSuggestionCreation,
              logger,
            )
          })
        })

        test('OUTDENT_CONTENT_COMMAND should be dispatched twice', () => {
          expect(dispatchCommandSpy).toHaveBeenCalledWith(OUTDENT_CONTENT_COMMAND, undefined)
          expect(dispatchCommandSpy).toHaveBeenCalledTimes(2)
        })
      })

      describe('Non-indented empty list item', () => {
        describe('Actually empty', () => {
          beforeEach(async () => {
            await update(() => {
              const list = $createListNode('bullet')
              const li = $createListItemNode()
              $getRoot().append(list.append(li))
              li.selectStart()
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
                logger,
              )
            })
          })

          testEditorState('list item should be changed to paragraph', () => {
            const paragraph = $getRoot().getFirstChild()
            expect($isParagraphNode(paragraph)).toBe(true)
          })

          testEditorState('paragraph should have block-type-change suggestion', () => {
            const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()
            const firstChild = paragraph.getFirstChild()
            assertCondition($isSuggestionNode(firstChild))
            expect(firstChild.getSuggestionTypeOrThrow()).toBe('block-type-change')
            const props = firstChild.getSuggestionChangedProperties<BlockTypeChangeSuggestionProperties>()
            assertCondition(props !== undefined)
            expect(props.initialBlockType).toBe('bullet')
          })
        })
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
          logger,
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

    test('should not wrap existing selection with "delete" if inserting data transfer', async () => {
      const commandDisposer: () => void = editor!.registerCommand(
        SELECTION_INSERT_CLIPBOARD_NODES_COMMAND,
        () => true,
        COMMAND_PRIORITY_CRITICAL,
      )
      await update(() => {
        const paragraph = $createParagraphNode()
        const textNode = $createTextNode('Hello world')
        paragraph.append(textNode)
        $getRoot().append(paragraph)
        textNode.select(3, 8)
      })
      const dataTransfer = {
        getData: (format: string) => {
          if (format === 'text/plain') {
            return 'Hello\tWorld\nParagraph'
          }
          return ''
        },
        types: ['text/plain'],
      } as unknown as DataTransfer
      await update(() => {
        $handleBeforeInputEvent(
          editor!,
          {
            inputType: 'insertFromPaste',
            data: null,
            dataTransfer,
          } as InputEvent,
          onSuggestionCreation,
          logger,
        )
      })
      editor!.read(() => {
        const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()
        expect(paragraph.getChildrenSize()).toBe(1)
        expect($isTextNode(paragraph.getFirstChild())).toBe(true)
      })
      commandDisposer()
    })

    describe('insertReplacementText', () => {
      describe('Existing insert suggestion', () => {
        let text!: TextNode

        beforeEach(async () => {
          await update(() => {
            const paragraph = $createParagraphNode()
            text = $createTextNode('This wrogn word')
            paragraph.append($createSuggestionNode('test', 'insert').append(text))
            text.select(6, 6)
            $getRoot().append(paragraph)
          })
          await update(() => {
            const textNode = editor!.getElementByKey(text.__key)?.childNodes[0]
            if (!textNode) {
              throw new Error('No element')
            }
            const startOffset = 'This '.length
            const endOffset = startOffset + 'wrogn'.length
            $handleBeforeInputEvent(
              editor!,
              {
                inputType: 'insertReplacementText',
                data: 'wrong',
                dataTransfer: null,
                getTargetRanges: () => {
                  return [
                    new StaticRange({
                      startContainer: textNode,
                      startOffset,
                      endContainer: textNode,
                      endOffset,
                    }),
                  ]
                },
              } as InputEvent,
              onSuggestionCreation,
              logger,
            )
          })
        })

        test('Existing text node should be updated with correct text', () => {
          editor!.read(() => {
            expect(text.getTextContent()).toBe('This wrong word')
          })
        })

        test('Selection should be moved to end of inserted word', () => {
          editor!.read(() => {
            const selection = $getSelection()
            if (!$isRangeSelection(selection)) {
              throw new Error('Selection is not range selection')
            }
            expect(selection.anchor.key).toBe(selection.focus.key)
            expect(selection.anchor.offset).toBe(selection.focus.offset)
            expect(selection.anchor.offset).toBe('This wrong'.length)
          })
        })
      })
    })

    describe('Existing replace suggestion', () => {
      beforeEach(async () => {
        await update(() => {
          const deleteText = $createTextNode('Hello')
          const deleteSuggestion = $createSuggestionNode('test', 'delete')
          deleteSuggestion.append(deleteText)
          const insertText = $createTextNode('World')
          const insertSuggestion = $createSuggestionNode('test', 'insert')
          insertSuggestion.append(insertText)
          $getRoot().append($createParagraphNode().append(deleteSuggestion, insertSuggestion))
          const selection = $createRangeSelection()
          selection.anchor.set(deleteText.__key, 0, 'text')
          selection.focus.set(insertText.__key, insertText.getTextContentSize(), 'text')
          $setSelection(selection)
        })
        await update(() => {
          $handleBeforeInputEvent(
            editor!,
            {
              inputType: 'insertText',
              data: 'foo',
              dataTransfer: null,
            } as InputEvent,
            onSuggestionCreation,
            logger,
          )
        })
      })

      testEditorState('paragraph should have delete and insert suggestion nodes', () => {
        const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()
        expect(paragraph.getChildrenSize()).toBe(2)
        const deleteSuggestion = paragraph.getChildAtIndex(0)
        assertCondition($isSuggestionNode(deleteSuggestion))
        expect(deleteSuggestion.getSuggestionTypeOrThrow()).toBe('delete')
        const insertSuggestion = paragraph.getChildAtIndex(1)
        assertCondition($isSuggestionNode(insertSuggestion))
        expect(insertSuggestion.getSuggestionTypeOrThrow()).toBe('insert')
      })

      testEditorState('original text should not be deleted', () => {
        const textNodes = $nodesOfType(TextNode)
        const first = textNodes[0]
        expect(first.getTextContent()).toContain('Hello')
        const second = textNodes[1]
        expect(second.getTextContent()).toContain('World')
      })
    })
  })
})
