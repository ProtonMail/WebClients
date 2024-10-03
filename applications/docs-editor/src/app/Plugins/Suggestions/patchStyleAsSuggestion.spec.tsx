import type { LexicalEditor, ParagraphNode } from 'lexical'
import { $createRangeSelection, $setSelection, TextNode } from 'lexical'
import { $nodesOfType } from 'lexical'
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
import { ProtonNode } from './ProtonNode'
import { $isSuggestionNode } from './ProtonNode'
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin'
import { $patchStyleAsSuggestion } from './patchStyleAsSuggestion'
import { getStyleObjectFromCSS } from '@lexical/selection'

describe('$patchStyleAsSuggestion', () => {
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

  const onSuggestionCreation = jest.fn()
  const logger = {
    info: jest.fn(),
  } as unknown as Logger

  describe('Single node selected', () => {
    beforeEach(async () => {
      await update(() => {
        const root = $getRoot()
        root.clear()
        const paragraph = $createParagraphNode()
        const text = $createTextNode('Hello').setStyle('font-size: 16px;')
        root.append(paragraph.append(text))
        text.select(0, 5)

        $patchStyleAsSuggestion('font-size', '12px', onSuggestionCreation, logger)
      })
    })

    test('should wrap node in suggestion', () => {
      editor!.read(() => {
        const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()
        const suggestion = paragraph.getFirstChildOrThrow<ProtonNode>()
        expect($isSuggestionNode(suggestion)).toBe(true)
        expect(suggestion.getSuggestionTypeOrThrow()).toBe('style-change')
      })
    })

    test('suggestion should have initial value', () => {
      editor!.read(() => {
        const suggestion = $nodesOfType(ProtonNode)[0]
        const changedProperties = suggestion.__properties.nodePropertiesChanged
        expect(changedProperties).toBeTruthy()
        expect(changedProperties?.['font-size']).toBe('16px')
      })
    })

    test('text node should have new value', () => {
      editor!.read(() => {
        const text = $nodesOfType(TextNode)[0]
        const style = getStyleObjectFromCSS(text.getStyle())
        expect(style['font-size']).toBe('12px')
      })
    })
  })

  describe('Multiple nodes selected', () => {
    beforeEach(async () => {
      await update(() => {
        const root = $getRoot()
        root.clear()
        const paragraph = $createParagraphNode()
        const text = $createTextNode('Hello').setStyle('font-size: 16px;')
        const text2 = $createTextNode('World')
        root.append(paragraph.append(text, text2))

        const selection = $createRangeSelection()
        selection.anchor.set(text.__key, 2, 'text')
        selection.focus.set(text2.__key, 3, 'text')

        $setSelection(selection)

        $patchStyleAsSuggestion('font-size', '12px', onSuggestionCreation, logger)
      })
    })

    test('should split text', () => {
      editor!.read(() => {
        const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()
        expect(paragraph.getChildAtIndex(0)?.getTextContent()).toBe('He')
        expect(paragraph.getChildAtIndex(1)?.getTextContent()).toBe('llo')
        expect(paragraph.getChildAtIndex(2)?.getTextContent()).toBe('Wor')
        expect(paragraph.getChildAtIndex(3)?.getTextContent()).toBe('ld')
      })
    })

    test('should wrap nodes in suggestions', () => {
      editor!.read(() => {
        const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()
        const suggestion = paragraph.getChildAtIndex<ProtonNode>(1)
        expect($isSuggestionNode(suggestion)).toBe(true)
        expect(suggestion?.getSuggestionTypeOrThrow()).toBe('style-change')
        const suggestion2 = paragraph.getChildAtIndex<ProtonNode>(2)
        expect($isSuggestionNode(suggestion2)).toBe(true)
        expect(suggestion2?.getSuggestionTypeOrThrow()).toBe('style-change')
      })
    })

    test('suggestion nodes should have initial values', () => {
      editor!.read(() => {
        const suggestion1 = $nodesOfType(ProtonNode)[0]
        const changedProperties1 = suggestion1.__properties.nodePropertiesChanged
        expect(changedProperties1).toBeTruthy()
        expect(changedProperties1?.['font-size']).toBe('16px')

        const suggestion2 = $nodesOfType(ProtonNode)[1]
        const changedProperties2 = suggestion2.__properties.nodePropertiesChanged
        expect(changedProperties2).toBeTruthy()
        expect(changedProperties2?.['font-size']).toBeFalsy()
      })
    })

    test('text nodes should have new value', () => {
      editor!.read(() => {
        const text = $nodesOfType(TextNode)[1]
        const style = getStyleObjectFromCSS(text.getStyle())
        expect(style['font-size']).toBe('12px')

        const text2 = $nodesOfType(TextNode)[2]
        const style2 = getStyleObjectFromCSS(text2.getStyle())
        expect(style2['font-size']).toBe('12px')
      })
    })
  })
})
