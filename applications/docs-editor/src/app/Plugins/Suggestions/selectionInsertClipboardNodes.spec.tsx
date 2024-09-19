import type { LexicalEditor, ParagraphNode, TextNode, ElementNode } from 'lexical'
import { $isParagraphNode, $isTextNode } from 'lexical'
import { $createParagraphNode, $createTextNode, $getRoot } from 'lexical'
import { AllNodes } from '../../AllNodes'
import type { Root } from 'react-dom/client'
import { createRoot } from 'react-dom/client'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import React from 'react'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ProtonContentEditable } from '../../ContentEditable/ProtonContentEditable'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import * as ReactTestUtils from '../../Utils/react-test-utils'
import { $selectionInsertClipboardNodes } from './selectionInsertClipboardNodes'
import { $createLinkNode } from '@lexical/link'
import type { Logger } from '@proton/utils/logs'
import type { ProtonNode } from './ProtonNode'
import { $isSuggestionNode } from './ProtonNode'
import { $createHeadingNode, $isHeadingNode } from '@lexical/rich-text'
import { polyfillSelectionRelatedThingsForTests } from './TestUtils'

polyfillSelectionRelatedThingsForTests()

describe('$selectionInsertClipboardNodes', () => {
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

  describe('Inserting into empty paragraph', () => {
    beforeEach(async () => {
      await update(() => {
        const root = $getRoot()
        root.clear()
        const paragraph = $createParagraphNode()
        root.append(paragraph)
        paragraph.selectEnd()
      })
    })

    describe('Inserting inline nodes', () => {
      beforeEach(async () => {
        await update(() => {
          const nodes = [
            $createTextNode('Hello '),
            $createLinkNode('example.com').append($createTextNode('World')),
            $createTextNode('!'),
          ]
          $selectionInsertClipboardNodes(nodes, onSuggestionCreation, logger)
        })
      })

      test('root should only have a single child', async () => {
        editor!.read(() => {
          expect($getRoot().getChildrenSize()).toBe(1)
        })
      })

      test('paragraph should only have a single child which is the suggestion', async () => {
        editor!.read(() => {
          const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()
          expect(paragraph.getChildrenSize()).toBe(1)
          const suggestion = paragraph.getFirstChildOrThrow<ProtonNode>()
          expect($isSuggestionNode(suggestion)).toBe(true)
          expect(suggestion.getChildrenSize()).toBe(3)
          expect(suggestion.getTextContent()).toBe('Hello World!')
        })
      })
    })

    describe('Inserting non-inline nodes', () => {
      beforeEach(async () => {
        await update(() => {
          const nodes = [
            $createHeadingNode('h1').append($createTextNode('Heading')),
            $createParagraphNode().append($createTextNode('Paragraph')),
          ]
          $selectionInsertClipboardNodes(nodes, onSuggestionCreation, logger)
        })
      })

      test('root should have 2 children', () => {
        editor!.read(() => {
          const root = $getRoot()
          expect(root.getChildrenSize()).toBe(2)
        })
      })

      test('first child should be a heading with the suggestion', () => {
        editor!.read(() => {
          const heading = $getRoot().getChildAtIndex<ElementNode>(0)
          expect($isHeadingNode(heading)).toBe(true)
          const suggestion = heading?.getFirstChildOrThrow<ProtonNode>()
          expect($isSuggestionNode(suggestion)).toBe(true)
        })
      })

      test('second child should be a paragraph with suggestion', () => {
        editor!.read(() => {
          const paragraph = $getRoot().getChildAtIndex<ElementNode>(1)
          expect($isParagraphNode(paragraph)).toBe(true)
          const suggestion = paragraph?.getFirstChildOrThrow<ProtonNode>()
          expect($isSuggestionNode(suggestion)).toBe(true)
        })
      })
    })
  })

  describe('Inserting into non-empty paragraph', () => {
    beforeEach(async () => {
      await update(() => {
        const paragraph = $createParagraphNode().append($createTextNode('Existing '))
        $getRoot().append(paragraph)
        paragraph.selectEnd()
      })
    })

    describe('Inserting inline nodes', () => {
      beforeEach(async () => {
        await update(() => {
          const nodes = [
            $createTextNode('Hello '),
            $createLinkNode('example.com').append($createTextNode('World')),
            $createTextNode('!'),
          ]
          $selectionInsertClipboardNodes(nodes, onSuggestionCreation, logger)
        })
      })

      test('root should have 1 child', async () => {
        editor!.read(() => {
          expect($getRoot().getChildrenSize()).toBe(1)
        })
      })

      test('paragraph should have 2 children', async () => {
        editor!.read(() => {
          const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()
          expect(paragraph.getChildrenSize()).toBe(2)
        })
      })

      test('first child should be text, second should be suggestion', async () => {
        editor!.read(() => {
          const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()

          expect($isTextNode(paragraph.getFirstChildOrThrow())).toBe(true)

          const suggestion = paragraph.getLastChildOrThrow<ProtonNode>()
          expect($isSuggestionNode(suggestion)).toBe(true)

          expect(suggestion.getChildrenSize()).toBe(3)
          expect(suggestion.getTextContent()).toBe('Hello World!')
        })
      })
    })

    describe('Inserting non-inline nodes', () => {
      beforeEach(async () => {
        await update(() => {
          const nodes = [
            $createHeadingNode('h1').append($createTextNode('Heading')),
            $createParagraphNode().append($createTextNode('Paragraph')),
          ]
          $selectionInsertClipboardNodes(nodes, onSuggestionCreation, logger)
        })
      })

      test('root should have 2 children', async () => {
        editor!.read(() => {
          const root = $getRoot()
          expect(root.getChildrenSize()).toBe(2)
        })
      })

      test('inserted heading should be merged with existing paragraph before creating suggestion', async () => {
        editor!.read(() => {
          const firstParagraph = $getRoot().getChildAtIndex<ElementNode>(0)
          expect($isParagraphNode(firstParagraph)).toBe(true)
          expect(firstParagraph?.getTextContent()).toBe('Existing Heading')
        })
      })

      test('first paragraph should have existing text node and wrapped suggestion', async () => {
        editor!.read(() => {
          const firstParagraph = $getRoot().getChildAtIndex<ElementNode>(0)
          const textNode = firstParagraph?.getFirstChild()
          expect($isTextNode(textNode)).toBe(true)
          expect(textNode?.getTextContent()).toBe('Existing ')
          const suggestion = firstParagraph?.getLastChild()
          expect($isSuggestionNode(suggestion)).toBe(true)
          expect(suggestion?.getTextContent()).toBe('Heading')
        })
      })

      test('second paragraph should only have suggestion', async () => {
        editor!.read(() => {
          const secondParagraph = $getRoot().getChildAtIndex<ElementNode>(1)
          expect($isParagraphNode(secondParagraph)).toBe(true)
          expect($isSuggestionNode(secondParagraph?.getFirstChildOrThrow())).toBe(true)
        })
      })
    })
  })

  describe('Replacing existing selection', () => {
    beforeEach(async () => {
      await update(() => {
        const paragraph = $createParagraphNode().append($createTextNode('Hello Existing World'))
        $getRoot().append(paragraph)
      })
    })

    describe('Inline nodes', () => {
      describe('Forward selection', () => {
        beforeEach(async () => {
          await update(() => {
            $getRoot()
              .getFirstChildOrThrow<ParagraphNode>()
              .getFirstChildOrThrow<TextNode>()
              .select(6, 6 + 8) // select "Existing" as forward selection
            const nodes = [
              $createTextNode('Hello '),
              $createLinkNode('example.com').append($createTextNode('World')),
              $createTextNode('!'),
            ]
            $selectionInsertClipboardNodes(nodes, onSuggestionCreation, logger)
          })
        })

        test('root should have 1 child', async () => {
          editor!.read(() => {
            expect($getRoot().getChildrenSize()).toBe(1)
          })
        })

        test('paragraph should have 4 children', async () => {
          editor!.read(() => {
            const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()
            expect(paragraph.getChildrenSize()).toBe(4)
          })
        })

        test('first and last child should be regular text', async () => {
          editor!.read(() => {
            const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()
            const first = paragraph.getFirstChild()
            const last = paragraph.getLastChild()
            expect($isTextNode(first)).toBe(true)
            expect($isTextNode(last)).toBe(true)
          })
        })

        test('delete suggestion should be before insert', async () => {
          editor!.read(() => {
            const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()

            const deleteSuggestion = paragraph.getChildAtIndex<ProtonNode>(1)
            expect($isSuggestionNode(deleteSuggestion)).toBe(true)
            expect(deleteSuggestion?.getSuggestionTypeOrThrow()).toBe('delete')

            const insert = paragraph.getChildAtIndex<ProtonNode>(2)
            expect($isSuggestionNode(insert)).toBe(true)
            expect(insert?.getChildrenSize()).toBe(3)
            expect(insert?.getTextContent()).toBe('Hello World!')
          })
        })
      })

      describe('Backward selection', () => {
        beforeEach(async () => {
          await update(() => {
            $getRoot()
              .getFirstChildOrThrow<ParagraphNode>()
              .getFirstChildOrThrow<TextNode>()
              .select(6 + 8, 6) // select "Existing" as forward selection
            const nodes = [
              $createTextNode('Hello '),
              $createLinkNode('example.com').append($createTextNode('World')),
              $createTextNode('!'),
            ]
            $selectionInsertClipboardNodes(nodes, onSuggestionCreation, logger)
          })
        })

        test('root should have 1 child', async () => {
          editor!.read(() => {
            expect($getRoot().getChildrenSize()).toBe(1)
          })
        })

        test('paragraph should have 4 children', async () => {
          editor!.read(() => {
            const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()
            expect(paragraph.getChildrenSize()).toBe(4)
          })
        })

        test('first and last child should be regular text', async () => {
          editor!.read(() => {
            const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()
            const first = paragraph.getFirstChild()
            const last = paragraph.getLastChild()
            expect($isTextNode(first)).toBe(true)
            expect($isTextNode(last)).toBe(true)
          })
        })

        test('insert suggestion should be before delete', async () => {
          editor!.read(() => {
            const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()

            const insert = paragraph.getChildAtIndex<ProtonNode>(1)
            expect($isSuggestionNode(insert)).toBe(true)
            expect(insert?.getChildrenSize()).toBe(3)
            expect(insert?.getTextContent()).toBe('Hello World!')

            const deleteSuggestion = paragraph.getChildAtIndex<ProtonNode>(2)
            expect($isSuggestionNode(deleteSuggestion)).toBe(true)
            expect(deleteSuggestion?.getSuggestionTypeOrThrow()).toBe('delete')
          })
        })
      })
    })

    describe('Non-inline nodes', () => {
      describe('Forward selection', () => {
        beforeEach(async () => {
          await update(() => {
            $getRoot()
              .getFirstChildOrThrow<ParagraphNode>()
              .getFirstChildOrThrow<TextNode>()
              .select(6, 6 + 8)
            const nodes = [
              $createHeadingNode('h1').append($createTextNode('Heading')),
              $createParagraphNode().append($createTextNode('Paragraph')),
            ]
            $selectionInsertClipboardNodes(nodes, onSuggestionCreation, logger)
          })
        })

        test('root should have 2 children', async () => {
          editor!.read(() => {
            const root = $getRoot()
            expect(root.getChildrenSize()).toBe(2)
          })
        })

        test('first paragraph should have 3 children', async () => {
          editor!.read(() => {
            const paragraph = $getRoot().getChildAtIndex<ParagraphNode>(0)
            expect(paragraph?.getChildrenSize()).toBe(3)
          })
        })

        test('first paragraph should have text, delete and then insert', async () => {
          editor!.read(() => {
            const paragraph = $getRoot().getChildAtIndex<ParagraphNode>(0)

            const text = paragraph?.getChildAtIndex(0)
            expect($isTextNode(text)).toBe(true)

            const deleteSuggestion = paragraph?.getChildAtIndex<ProtonNode>(1)
            expect($isSuggestionNode(deleteSuggestion)).toBe(true)
            expect(deleteSuggestion?.getSuggestionTypeOrThrow()).toBe('delete')

            const firstInsert = paragraph?.getChildAtIndex<ProtonNode>(2)
            expect($isSuggestionNode(firstInsert)).toBe(true)
            expect(firstInsert?.getSuggestionTypeOrThrow()).toBe('insert')
          })
        })

        test('second paragraph should have insert and then text', async () => {
          editor!.read(() => {
            const secondParagraph = $getRoot().getChildAtIndex<ParagraphNode>(1)
            expect(secondParagraph?.getChildrenSize()).toBe(2)
            expect($isSuggestionNode(secondParagraph?.getFirstChildOrThrow())).toBe(true)
            expect($isTextNode(secondParagraph?.getLastChildOrThrow())).toBe(true)
          })
        })
      })

      describe('Backward selection', () => {
        beforeEach(async () => {
          await update(() => {
            $getRoot()
              .getFirstChildOrThrow<ParagraphNode>()
              .getFirstChildOrThrow<TextNode>()
              .select(6 + 8, 6)
            const nodes = [
              $createHeadingNode('h1').append($createTextNode('Heading')),
              $createParagraphNode().append($createTextNode('Paragraph')),
            ]
            $selectionInsertClipboardNodes(nodes, onSuggestionCreation, logger)
          })
        })

        test('root should have 2 children', async () => {
          editor!.read(() => {
            const root = $getRoot()
            expect(root.getChildrenSize()).toBe(2)
          })
        })

        test('first paragraph should have 2 children', async () => {
          editor!.read(() => {
            const paragraph = $getRoot().getChildAtIndex<ParagraphNode>(0)
            expect(paragraph?.getChildrenSize()).toBe(2)
          })
        })

        test('first paragraph should have text and then insert', async () => {
          editor!.read(() => {
            const paragraph = $getRoot().getChildAtIndex<ParagraphNode>(0)
            expect($isTextNode(paragraph?.getFirstChild())).toBe(true)
            const suggestion = paragraph?.getChildAtIndex<ProtonNode>(1)
            expect($isSuggestionNode(suggestion)).toBe(true)
            expect(suggestion?.getSuggestionTypeOrThrow()).toBe('insert')
          })
        })

        test('second paragraph should have 3 children', async () => {
          editor!.read(() => {
            const secondParagraph = $getRoot().getChildAtIndex<ParagraphNode>(1)
            expect(secondParagraph?.getChildrenSize()).toBe(3)
          })
        })

        test('second paragraph should have insert, delete and text', async () => {
          editor!.read(() => {
            const secondParagraph = $getRoot().getChildAtIndex<ParagraphNode>(1)

            const suggestion2 = secondParagraph?.getChildAtIndex<ProtonNode>(0)
            expect($isSuggestionNode(suggestion2)).toBe(true)
            expect(suggestion2?.getSuggestionTypeOrThrow()).toBe('insert')

            const suggestion3 = secondParagraph?.getChildAtIndex<ProtonNode>(1)
            expect($isSuggestionNode(suggestion3)).toBe(true)
            expect(suggestion3?.getSuggestionTypeOrThrow()).toBe('delete')

            expect($isTextNode(secondParagraph?.getLastChild())).toBe(true)
          })
        })
      })
    })
  })
})
