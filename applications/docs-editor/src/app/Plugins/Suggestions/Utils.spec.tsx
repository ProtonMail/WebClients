import type { LexicalEditor, ParagraphNode, TextNode } from 'lexical'
import { $createRangeSelection, $isTextNode } from 'lexical'
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
import type { Logger } from '@proton/utils/logs'
import type { ProtonNode } from './ProtonNode'
import { $isSuggestionNode } from './ProtonNode'
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin'
import { $wrapSelectionInSuggestionNode } from './Utils'
import type { LinkNode } from '@lexical/link'
import { $createLinkNode, $isLinkNode } from '@lexical/link'

describe('$wrapSelectionInSuggestionNode', () => {
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

  const logger = {
    info: jest.fn(),
  } as unknown as Logger

  describe('Should split and wrap text node', () => {
    let paragraph!: ParagraphNode

    beforeEach(async () => {
      await update(() => {
        const root = $getRoot()
        root.clear()
        paragraph = $createParagraphNode()
        const text = $createTextNode('Hello')
        root.append(paragraph.append(text))
        const selection = text.select(1, 4)

        $wrapSelectionInSuggestionNode(selection, selection.isBackward(), 'test', 'insert', logger)
      })
    })

    test('text node should be split into 3 nodes', () => {
      editor!.read(() => {
        expect(paragraph.getChildrenSize()).toBe(3)
      })
    })

    test('first node should be text node with content "H"', () => {
      editor!.read(() => {
        const firstNode = paragraph.getChildAtIndex<TextNode>(0)
        expect(firstNode?.getTextContent()).toBe('H')
      })
    })

    test('second node should be suggestion node', () => {
      editor!.read(() => {
        const secondNode = paragraph.getChildAtIndex<ProtonNode>(1)
        expect($isSuggestionNode(secondNode)).toBe(true)
        expect(secondNode?.getTextContent()).toBe('ell')
      })
    })

    test('third node should be text node with content "o"', () => {
      editor!.read(() => {
        const thirdNode = paragraph.getChildAtIndex<TextNode>(2)
        expect(thirdNode?.getTextContent()).toBe('o')
      })
    })
  })

  describe('Should wrap inline element node as a whole if fully selected', () => {
    let paragraph!: ParagraphNode

    beforeEach(async () => {
      await update(() => {
        const root = $getRoot()
        root.clear()
        paragraph = $createParagraphNode()
        const text = $createTextNode('Hello')
        const link = $createLinkNode('test').append($createTextNode('Link'))
        const text2 = $createTextNode('World')
        root.append(paragraph.append(text, link, text2))
        const selection = $createRangeSelection()
        selection.anchor.set(text.__key, 2, 'text')
        selection.focus.set(text2.__key, 2, 'text')

        $wrapSelectionInSuggestionNode(selection, selection.isBackward(), 'test', 'insert', logger)
      })
    })

    test('paragraph should have 3 children', () => {
      editor!.read(() => {
        expect(paragraph.getChildrenSize()).toBe(3)
      })
    })

    test('first child should be text with "He"', () => {
      editor!.read(() => {
        const node = paragraph.getChildAtIndex<TextNode>(0)
        expect($isTextNode(node)).toBe(true)
        expect(node?.getTextContent()).toBe('He')
      })
    })

    test('third child should be text with "rld"', () => {
      editor!.read(() => {
        const node = paragraph.getChildAtIndex<TextNode>(2)
        expect($isTextNode(node)).toBe(true)
        expect(node?.getTextContent()).toBe('rld')
      })
    })

    test('second child should be suggestion', () => {
      editor!.read(() => {
        const node = paragraph.getChildAtIndex<ProtonNode>(1)
        expect($isSuggestionNode(node)).toBe(true)
      })
    })

    test('suggestion should have 3 children', () => {
      editor!.read(() => {
        const node = paragraph.getChildAtIndex<ProtonNode>(1)
        expect(node?.getChildrenSize()).toBe(3)
      })
    })

    test('link node should be fully wrapped', () => {
      editor!.read(() => {
        const suggestion = paragraph.getChildAtIndex<ProtonNode>(1)
        const link = suggestion?.getChildAtIndex(1)
        expect($isLinkNode(link)).toBe(true)
      })
    })
  })

  describe('Should not wrap inline element node as a whole if not fully selected', () => {
    let paragraph!: ParagraphNode

    beforeEach(async () => {
      await update(() => {
        const root = $getRoot()
        root.clear()
        paragraph = $createParagraphNode()
        const text = $createTextNode('Hello')
        const linkText = $createTextNode('Link')
        const link = $createLinkNode('test').append(linkText)
        root.append(paragraph.append(text, link))
        const selection = $createRangeSelection()
        selection.anchor.set(text.__key, 2, 'text')
        selection.focus.set(linkText.__key, 0, 'text')

        $wrapSelectionInSuggestionNode(selection, selection.isBackward(), 'test', 'insert', logger)
      })
    })

    test('paragraph should have 3 children', () => {
      editor!.read(() => {
        expect(paragraph.getChildrenSize()).toBe(3)
      })
    })

    test('first child should be text with "He"', () => {
      editor!.read(() => {
        const node = paragraph.getChildAtIndex<TextNode>(0)
        expect($isTextNode(node)).toBe(true)
        expect(node?.getTextContent()).toBe('He')
      })
    })

    test('second child should be suggestion', () => {
      editor!.read(() => {
        const node = paragraph.getChildAtIndex<ProtonNode>(1)
        expect($isSuggestionNode(node)).toBe(true)
      })
    })

    test('suggestion should have split text', () => {
      editor!.read(() => {
        const node = paragraph.getChildAtIndex<ProtonNode>(1)
        expect(node?.getChildrenSize()).toBe(1)
        expect(node?.getTextContent()).toBe('llo')
      })
    })

    test('third child should be link node', () => {
      editor!.read(() => {
        const node = paragraph.getChildAtIndex<LinkNode>(2)
        expect($isLinkNode(node)).toBe(true)
        expect($isTextNode(node?.getFirstChild())).toBe(true)
        expect(node?.getTextContent()).toBe('Link')
      })
    })
  })
})
