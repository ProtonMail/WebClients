import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import type { LexicalEditor } from 'lexical'
import { $createParagraphNode, $createTabNode, $createTextNode, $getRoot, $isParagraphNode, $isTabNode } from 'lexical'
import type { Root } from 'react-dom/client'
import { createRoot } from 'react-dom/client'
import { AllNodes } from '../AllNodes'
import { ProtonContentEditable } from '../ContentEditable/ProtonContentEditable'
import * as ReactTestUtils from '../Utils/react-test-utils'
import { assertCondition } from './Suggestions/TestUtils'
import { FixBrokenTabNode } from './FixBrokenTabNode'

describe('FixBrokenListItemPlugin', () => {
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
          <FixBrokenTabNode />
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

  describe('should fix tab nodes that have non-tab text content', () => {
    beforeEach(async () => {
      await update(() => {
        const paragraph = $createParagraphNode()
        const text1 = $createTextNode('Hello')
        const tab1 = $createTabNode()
        const tab2 = $createTabNode()
        const tab2writable = tab2.getWritable()
        tab2writable.__text = 'a'
        const text2 = $createTextNode('World')
        paragraph.append(text1, tab1, tab2, text2)
        $getRoot().append(paragraph)
      })
      await Promise.resolve().then()
      await new Promise((r) => setTimeout(r, 20)) // Wait for the plugin to fix the tab nodes
    })

    test('should fix tab nodes', () => {
      editor!.read(() => {
        const paragraph = $getRoot().getFirstChildOrThrow()
        assertCondition($isParagraphNode(paragraph))

        const children = paragraph.getChildren()
        expect(children.length).toBe(4)

        expect(children[0].getTextContent()).toBe('Hello')
        expect($isTabNode(children[1])).toBe(true)
        expect(children[1].getTextContent()).toBe('\t')
        expect($isTabNode(children[2])).toBe(true)
        expect(children[2].getTextContent()).toBe('\t')
        expect(children[3].getTextContent()).toBe('aWorld')
      })
    })
  })
})
