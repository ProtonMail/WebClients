import type { LexicalEditor, ParagraphNode } from 'lexical'
import { $isTextNode } from 'lexical'
import {
  $createTextNode,
  COMMAND_PRIORITY_CRITICAL,
  INDENT_CONTENT_COMMAND,
  INSERT_TAB_COMMAND,
  OUTDENT_CONTENT_COMMAND,
} from 'lexical'
import { $createParagraphNode, $getRoot } from 'lexical'
import { AllNodes } from '../../AllNodes'
import type { Root } from 'react-dom/client'
import { createRoot } from 'react-dom/client'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import React, { useEffect } from 'react'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ProtonContentEditable } from '../../ContentEditable/ProtonContentEditable'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import * as ReactTestUtils from '../../Utils/react-test-utils'
import type { Logger } from '@proton/utils/logs'
import type { ProtonNode } from './ProtonNode'
import { $createSuggestionNode } from './ProtonNode'
import { $isSuggestionNode } from './ProtonNode'
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin'
import { mergeRegister } from '@lexical/utils'
import { $handleIndentOutdentAsSuggestion } from './handleIndentOutdent'
import type { ListItemNode, ListNode } from '@lexical/list'
import { $createListItemNode, $createListNode, $isListItemNode, $isListNode } from '@lexical/list'

describe('$handleIndentOutdent', () => {
  let container: HTMLElement
  let reactRoot: Root
  let editor: LexicalEditor | null = null

  const onSuggestionCreation = jest.fn()
  const logger = {
    info: jest.fn(),
  } as unknown as Logger

  async function update(fn: () => void) {
    await ReactTestUtils.act(async () => {
      await editor!.update(fn)
    })
  }

  async function init() {
    function TestBase() {
      function TestPlugin() {
        ;[editor] = useLexicalComposerContext()
        useEffect(() => {
          if (!editor) {
            return
          }
          return mergeRegister(
            editor.registerCommand(
              INSERT_TAB_COMMAND,
              () => {
                return true
              },
              COMMAND_PRIORITY_CRITICAL,
            ),
            editor.registerCommand(
              INDENT_CONTENT_COMMAND,
              () => {
                return $handleIndentOutdentAsSuggestion('indent', onSuggestionCreation, logger)
              },
              COMMAND_PRIORITY_CRITICAL,
            ),
            editor.registerCommand(
              OUTDENT_CONTENT_COMMAND,
              () => {
                return $handleIndentOutdentAsSuggestion('outdent', onSuggestionCreation, logger)
              },
              COMMAND_PRIORITY_CRITICAL,
            ),
          )
        }, [])
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
          <LinkPlugin />
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

  describe('Indent', () => {
    describe('Paragraph', () => {
      beforeEach(async () => {
        await update(() => {
          const root = $getRoot()
          root.clear()

          const paragraph1 = $createParagraphNode().append($createTextNode('Test'))
          root.append(paragraph1)
          paragraph1.selectEnd()
          editor!.dispatchCommand(INDENT_CONTENT_COMMAND, undefined)

          const paragraph2 = $createParagraphNode().append(
            $createSuggestionNode('test', 'indent-change', {
              indent: 0,
            }),
            $createTextNode('Test'),
          )
          paragraph2.setIndent(1)
          root.append(paragraph2)
          paragraph2.selectEnd()
          editor!.dispatchCommand(INDENT_CONTENT_COMMAND, undefined)
        })
      })

      test('should indent paragraph1 to level 1', () => {
        editor!.read(() => {
          const paragraph1 = $getRoot().getChildAtIndex<ParagraphNode>(0)!
          expect(paragraph1.getIndent()).toBe(1)
        })
      })

      test('should insert indent-change suggestion node to paragraph1', () => {
        editor!.read(() => {
          const paragraph1 = $getRoot().getChildAtIndex<ParagraphNode>(0)!
          const suggestion = paragraph1.getFirstChildOrThrow<ProtonNode>()
          expect($isSuggestionNode(suggestion)).toBe(true)
          expect(suggestion.getSuggestionTypeOrThrow()).toBe('indent-change')
        })
      })

      test('should indent paragraph2 to level 2', () => {
        editor!.read(() => {
          const paragraph1 = $getRoot().getChildAtIndex<ParagraphNode>(1)!
          expect(paragraph1.getIndent()).toBe(2)
        })
      })

      test('should not add new indent-change suggestion node to paragraph2 as it already has one', () => {
        editor!.read(() => {
          const paragraph2 = $getRoot().getChildAtIndex<ParagraphNode>(1)!
          expect(paragraph2.getChildrenSize()).toBe(2)
          const suggestion = paragraph2.getFirstChildOrThrow<ProtonNode>()
          expect($isSuggestionNode(suggestion)).toBe(true)
          expect(suggestion.getSuggestionTypeOrThrow()).toBe('indent-change')
          expect($isTextNode(paragraph2.getLastChildOrThrow())).toBe(true)
        })
      })
    })

    describe('List item', () => {
      let list: ListNode
      let item1: ListItemNode
      let item2: ListItemNode
      let item3: ListItemNode

      beforeEach(async () => {
        await update(() => {
          const root = $getRoot()
          root.clear()

          list = $createListNode('number')
          item1 = $createListItemNode().append($createTextNode('1'))
          item2 = $createListItemNode().append($createTextNode('2'))
          item3 = $createListItemNode().append($createTextNode('3'))
          list.append(item1, item2, item3)
          root.append(list)

          item2.selectStart()
          editor!.dispatchCommand(INDENT_CONTENT_COMMAND, undefined)
        })
      })

      test('first item should be untouched', () => {
        editor!.read(() => {
          expect(item1.getChildrenSize()).toBe(1)
          expect($isTextNode(item1.getFirstChild())).toBe(true)
        })
      })

      test('should indent 2nd item by creating nested list', () => {
        editor!.read(() => {
          const item2 = list.getChildAtIndex<ListItemNode>(1)
          const nestedList = item2?.getLastChildOrThrow<ListNode>()
          expect($isListNode(nestedList)).toBe(true)
          const nestedListItem = nestedList?.getFirstChildOrThrow<ListItemNode>()
          expect($isListItemNode(nestedListItem)).toBe(true)
          expect(nestedListItem?.getIndent()).toBe(1)
        })
      })

      test('should create indent-change suggestion in nested list item', () => {
        editor!.read(() => {
          const item2 = list.getChildAtIndex<ListItemNode>(1)
          const nestedList = item2?.getLastChildOrThrow<ListNode>()
          const nestedListItem = nestedList?.getFirstChildOrThrow<ListItemNode>()
          const suggestion = nestedListItem?.getFirstChildOrThrow<ProtonNode>()
          expect($isSuggestionNode(suggestion)).toBe(true)
          expect(suggestion?.getSuggestionTypeOrThrow()).toBe('indent-change')
        })
      })

      test('last item should be untouched', () => {
        editor!.read(() => {
          expect(item3.getChildrenSize()).toBe(1)
          expect($isTextNode(item3.getFirstChild())).toBe(true)
        })
      })
    })
  })

  describe('Outdent', () => {
    describe('Paragraph', () => {
      beforeEach(async () => {
        await update(() => {
          const root = $getRoot()
          root.clear()

          const paragraph1 = $createParagraphNode().append($createTextNode('Test'))
          root.append(paragraph1)
          paragraph1.selectEnd()
          editor!.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined)

          const paragraph2 = $createParagraphNode().append($createTextNode('Test'))
          paragraph2.setIndent(1)
          root.append(paragraph2)
          paragraph2.selectEnd()
          editor!.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined)

          const paragraph3 = $createParagraphNode().append(
            $createSuggestionNode('test', 'indent-change', {
              indent: 1,
            }),
            $createTextNode('Test'),
          )
          paragraph3.setIndent(2)
          root.append(paragraph3)
          paragraph3.selectEnd()
          editor!.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined)
        })
      })

      test('should do nothing for paragraph1 as its already at level 0', () => {
        editor!.read(() => {
          const paragraph1 = $getRoot().getChildAtIndex<ParagraphNode>(0)!
          expect(paragraph1.getIndent()).toBe(0)
          expect(paragraph1.getChildrenSize()).toBe(1)
          expect($isTextNode(paragraph1.getFirstChild())).toBe(true)
        })
      })

      test('should outdent paragraph2 to level 0', () => {
        editor!.read(() => {
          const paragraph2 = $getRoot().getChildAtIndex<ParagraphNode>(1)!
          expect(paragraph2.getIndent()).toBe(0)
        })
      })

      test('should insert indent-change suggestion node to paragraph2', () => {
        editor!.read(() => {
          const paragraph2 = $getRoot().getChildAtIndex<ParagraphNode>(1)!
          const suggestion = paragraph2.getFirstChildOrThrow<ProtonNode>()
          expect($isSuggestionNode(suggestion)).toBe(true)
          expect(suggestion.getSuggestionTypeOrThrow()).toBe('indent-change')
        })
      })

      test('should outdent paragraph3 to level 1', () => {
        editor!.read(() => {
          const paragraph3 = $getRoot().getChildAtIndex<ParagraphNode>(2)!
          expect(paragraph3.getIndent()).toBe(1)
        })
      })

      test('should not add new indent-change suggestion node to paragraph3 as it already has one', () => {
        editor!.read(() => {
          const paragraph3 = $getRoot().getChildAtIndex<ParagraphNode>(2)!
          expect(paragraph3.getChildrenSize()).toBe(2)
          const suggestion = paragraph3.getFirstChildOrThrow<ProtonNode>()
          expect($isSuggestionNode(suggestion)).toBe(true)
          expect(suggestion.getSuggestionTypeOrThrow()).toBe('indent-change')
          expect($isTextNode(paragraph3.getLastChildOrThrow())).toBe(true)
        })
      })
    })

    describe('List item', () => {
      let list: ListNode
      let item1: ListItemNode
      let item2: ListItemNode
      let item3: ListItemNode

      beforeEach(async () => {
        await update(() => {
          const root = $getRoot()
          root.clear()

          list = $createListNode('number')
          item1 = $createListItemNode().append($createTextNode('1'))
          item2 = $createListItemNode().append($createTextNode('2'))
          item3 = $createListItemNode().append($createTextNode('3'))
          list.append(item1, item2, item3)
          root.append(list)

          item2.setIndent(1)
          item2.selectEnd()
          editor!.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined)
        })
      })

      test('first item should be untouched', () => {
        editor!.read(() => {
          expect(item1.getChildrenSize()).toBe(1)
          expect($isTextNode(item1.getFirstChild())).toBe(true)
        })
      })

      test('should outdent 2nd item by un-nesting list', () => {
        editor!.read(() => {
          const item2 = list.getChildAtIndex<ListItemNode>(1)
          expect(item2?.getIndent()).toBe(0)
          expect(item2?.getChildrenSize()).toBe(2)
          expect($isSuggestionNode(item2?.getFirstChild())).toBe(true)
          expect($isTextNode(item2?.getLastChild())).toBe(true)
        })
      })

      test('should create indent-change suggestion in 2nd item', () => {
        editor!.read(() => {
          const suggestion = item2.getFirstChild<ProtonNode>()
          expect($isSuggestionNode(suggestion)).toBe(true)
          expect(suggestion?.getSuggestionTypeOrThrow()).toBe('indent-change')
        })
      })

      test('last item should be untouched', () => {
        editor!.read(() => {
          expect(item3.getChildrenSize()).toBe(1)
          expect($isTextNode(item3.getFirstChild())).toBe(true)
        })
      })
    })
  })
})
