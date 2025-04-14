import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import type { LexicalEditor } from 'lexical'
import { $createTextNode, $getRoot, INSERT_PARAGRAPH_COMMAND, IS_BOLD } from 'lexical'
import type { Root } from 'react-dom/client'
import { createRoot } from 'react-dom/client'
import { AllNodes } from '../AllNodes'
import { ProtonContentEditable } from '../ContentEditable/ProtonContentEditable'
import * as ReactTestUtils from '../Utils/react-test-utils'
import { FixBrokenListItemPlugin } from './FixBrokenListItemPlugin'
import { $createListItemNode, $createListNode, $isListItemNode, $isListNode } from '@lexical/list'
import { assertCondition } from './Suggestions/TestUtils'
import { $createLinkNode } from '@lexical/link'

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
          <FixBrokenListItemPlugin />
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

  describe('list item with both nested list and text', () => {
    beforeEach(async () => {
      await update(() => {
        const list = $createListNode('bullet')
        const li1 = $createListItemNode().append($createTextNode('li1'))
        const li2 = $createListItemNode().append(
          $createListNode('number').append(
            $createListItemNode().append($createTextNode('nested li1')),
            $createListItemNode().append($createTextNode('nested li2')),
          ),
          $createTextNode('li2 text 1'),
          $createTextNode('li2 text 2').toggleFormat('bold'),
        )
        const li3 = $createListItemNode().append($createTextNode('li3'))
        list.append(li1, li2, li3)
        $getRoot().append(list)
      })
    })

    test('should split list item which has both nested list and text', () => {
      editor!.read(() => {
        const list = $getRoot().getFirstChildOrThrow()
        assertCondition($isListNode(list))

        const children = list.getChildren()
        expect(children.length).toBe(4)
      })
    })

    test('should have correct structure', () => {
      editor!.read(() => {
        const list = $getRoot().getFirstChildOrThrow()
        assertCondition($isListNode(list))

        const children = list.getChildren()
        assertCondition(children.every($isListItemNode))

        const li1Children = children[0].getChildren()
        expect(li1Children.length).toBe(1)
        const li1 = li1Children[0].exportJSON()
        expect(li1).toMatchObject({
          type: 'text',
          text: 'li1',
        })

        const li2Children = children[1].getChildren()
        expect(li2Children.length).toBe(1)
        const li2 = li2Children[0].exportJSON()
        expect(li2).toMatchObject({
          type: 'custom-list',
        })

        const li3Children = children[2].getChildren()
        expect(li3Children.length).toBe(2)
        expect(li3Children[0].exportJSON()).toMatchObject({
          type: 'text',
          text: 'li2 text 1',
        })
        expect(li3Children[1].exportJSON()).toMatchObject({
          type: 'text',
          text: 'li2 text 2',
          format: IS_BOLD,
        })

        const li4Children = children[3].getChildren()
        expect(li4Children.length).toBe(1)
        const li4 = li4Children[0].exportJSON()
        expect(li4).toMatchObject({
          type: 'text',
          text: 'li3',
        })
      })
    })
  })

  describe('list item with multiple children but no nested list', () => {
    beforeEach(async () => {
      await update(() => {
        const list = $createListNode('bullet')
        const li1 = $createListItemNode().append($createTextNode('li1'))
        const li2 = $createListItemNode().append(
          $createTextNode('li2 text 1'),
          $createTextNode('li2 text 2').toggleFormat('bold'),
          $createLinkNode('test.com').append($createTextNode('link')),
        )
        const li3 = $createListItemNode().append($createTextNode('li3'))
        list.append(li1, li2, li3)
        $getRoot().append(list)
      })
    })

    test('should not split list item which has multiple children but no nested list', () => {
      editor!.read(() => {
        const list = $getRoot().getFirstChildOrThrow()
        assertCondition($isListNode(list))

        const children = list.getChildren()
        expect(children.length).toBe(3)
      })
    })

    test('should have correct structure', () => {
      editor!.read(() => {
        const list = $getRoot().getFirstChildOrThrow()
        assertCondition($isListNode(list))

        const children = list.getChildren()
        assertCondition(children.every($isListItemNode))

        const li1Children = children[0].getChildren()
        expect(li1Children.length).toBe(1)
        const li1 = li1Children[0].exportJSON()
        expect(li1).toMatchObject({
          type: 'text',
          text: 'li1',
        })

        const li2Children = children[1].getChildren()
        expect(li2Children.length).toBe(3)
        expect(li2Children[0].exportJSON()).toMatchObject({
          type: 'text',
          text: 'li2 text 1',
        })
        expect(li2Children[1].exportJSON()).toMatchObject({
          type: 'text',
          text: 'li2 text 2',
          format: IS_BOLD,
        })
        expect(li2Children[2].exportJSON()).toMatchObject({
          type: 'link',
        })

        const li3Children = children[2].getChildren()
        expect(li3Children.length).toBe(1)
        const li3 = li3Children[0].exportJSON()
        expect(li3).toMatchObject({
          type: 'text',
          text: 'li3',
        })
      })
    })
  })
})

/**
 * This should only be run locally.
 * If it fails/freezes/crashes, it means that we still need the plugin
 * to normalize list items with more than 1 children.
 */
describe.skip('Test to see if this plugin is still needed', () => {
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
            onError: (error) => {
              throw error
            },
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

  test('list item with multiple children', async () => {
    await update(() => {
      const list = $createListNode('bullet')
      const li1 = $createListItemNode().append($createTextNode('li1'))
      const li2 = $createListItemNode().append(
        $createListNode('number').append($createListItemNode().append($createTextNode('nested li1'))),
      )
      const li2text = $createTextNode('li2 text 1')
      li2.append(li2text)
      list.append(li1, li2)
      $getRoot().append(list)
      li2text.select(4, 4)
    })

    editor!.dispatchCommand(INSERT_PARAGRAPH_COMMAND, undefined)

    editor!.read(() => {
      const list = $getRoot().getFirstChildOrThrow()
      assertCondition($isListNode(list))

      const children = list.getChildren()
      expect(children.length).toBe(3)
    })
  })
})
