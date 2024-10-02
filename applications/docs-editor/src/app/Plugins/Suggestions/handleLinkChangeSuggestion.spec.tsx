import type { LexicalEditor } from 'lexical'
import { ParagraphNode } from 'lexical'
import { $nodesOfType } from 'lexical'
import { $isTextNode } from 'lexical'
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
import type { LinkNode } from '@lexical/link'
import { $createLinkNode, $isLinkNode } from '@lexical/link'
import type { Logger } from '@proton/utils/logs'
import { ProtonNode } from './ProtonNode'
import { $isSuggestionNode } from './ProtonNode'
import { $handleLinkChangeSuggestion } from './handleLinkChangeSuggestion'
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin'

describe('$handleLinkChangeSuggestion', () => {
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

  describe('New link & text', () => {
    beforeEach(async () => {
      await update(() => {
        const root = $getRoot()
        root.clear()
        const paragraph = $createParagraphNode()
        root.append(paragraph)
        paragraph.selectEnd()
      })
    })

    describe('Invalid URL', () => {
      test('should do nothing', async () => {
        await update(() => {
          $handleLinkChangeSuggestion(
            editor!,
            {
              url: 'hel lo',
              linkNode: null,
              linkTextNode: null,
              text: null,
            },
            logger,
            onSuggestionCreation,
          )
        })
        editor!.read(() => {
          const paragraph = $getRoot().getFirstChild<ParagraphNode>()
          expect(paragraph?.getChildrenSize()).toBe(0)
        })
      })
    })

    describe('Valid URL', () => {
      beforeEach(async () => {
        await update(() => {
          $handleLinkChangeSuggestion(
            editor!,
            {
              url: 'http://example.com',
              linkNode: null,
              linkTextNode: null,
              text: 'Example',
            },
            logger,
            onSuggestionCreation,
          )
        })
      })

      test('paragraph should have insert suggestion', async () => {
        editor!.read(() => {
          const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()
          expect(paragraph.getChildrenSize()).toBe(1)
          const suggestion = paragraph.getFirstChildOrThrow<ProtonNode>()
          expect($isSuggestionNode(suggestion)).toBe(true)
          expect(suggestion.getSuggestionTypeOrThrow()).toBe('insert')
        })
      })

      test('suggestion should have link with text', async () => {
        editor!.read(() => {
          const suggestion = $nodesOfType(ProtonNode)[0]
          const link = suggestion.getFirstChild<LinkNode>()
          expect($isLinkNode(link)).toBe(true)
          expect(link?.getTextContent()).toBe('Example')
        })
      })
    })
  })

  describe('Add link to existing text', () => {
    beforeEach(async () => {
      await update(() => {
        const root = $getRoot()
        const paragraph = $createParagraphNode().append()
        const text = $createTextNode('Hello')
        paragraph.append(text)
        root.append(paragraph)
        text.select(0, 5)
      })
    })

    describe('Invalid URL', () => {
      test('should do nothing', async () => {
        await update(() => {
          $handleLinkChangeSuggestion(
            editor!,
            {
              url: 'hel lo',
              linkNode: null,
              linkTextNode: null,
              text: null,
            },
            logger,
            onSuggestionCreation,
          )
        })
        editor!.read(() => {
          const paragraph = $getRoot().getFirstChild<ParagraphNode>()
          expect(paragraph?.getChildrenSize()).toBe(1)
          const firstChild = paragraph?.getFirstChild()
          expect($isTextNode(firstChild)).toBe(true)
        })
      })
    })

    describe('Valid URL', () => {
      beforeEach(async () => {
        await update(() => {
          $handleLinkChangeSuggestion(
            editor!,
            {
              url: 'http://example.com',
              linkNode: null,
              linkTextNode: null,
              text: null,
            },
            logger,
            onSuggestionCreation,
          )
        })
      })

      test('paragraph should have link-change suggestion', () => {
        editor!.read(() => {
          const paragraph = $getRoot().getFirstChild<ParagraphNode>()
          expect(paragraph?.getChildrenSize()).toBe(1)
          const suggestion = paragraph?.getFirstChild<ProtonNode>()
          expect($isSuggestionNode(suggestion)).toBe(true)
          expect(suggestion?.getSuggestionTypeOrThrow()).toBe('link-change')
        })
      })

      test('suggestion should have link', () => {
        editor!.read(() => {
          const suggestion = $nodesOfType(ProtonNode)[0]
          const link = suggestion.getFirstChild<LinkNode>()
          expect($isLinkNode(link)).toBe(true)
          expect(link?.getURL()).toBe('http://example.com/')
        })
      })

      test('suggestion should have initial url as null', () => {
        editor!.read(() => {
          const suggestion = $nodesOfType(ProtonNode)[0]
          const url = suggestion.__properties.nodePropertiesChanged?.__url
          expect(url).toBe(null)
        })
      })
    })
  })

  describe('Edit existing link', () => {
    const existingURL = 'http://existing.com'

    beforeEach(async () => {
      await update(() => {
        const root = $getRoot()
        const paragraph = $createParagraphNode().append()
        const link = $createLinkNode(existingURL).append($createTextNode('Hello'))
        paragraph.append(link)
        root.append(paragraph)
        link.select(2, 2)
        $handleLinkChangeSuggestion(
          editor!,
          {
            url: 'http://example.com',
            linkNode: link,
            linkTextNode: null,
            text: null,
          },
          logger,
          onSuggestionCreation,
        )
      })
    })

    test('paragraph should have link-change suggestion', () => {
      editor!.read(() => {
        const paragraph = $getRoot().getFirstChild<ParagraphNode>()
        expect(paragraph?.getChildrenSize()).toBe(1)
        const suggestion = paragraph?.getFirstChild<ProtonNode>()
        expect($isSuggestionNode(suggestion)).toBe(true)
        expect(suggestion?.getSuggestionTypeOrThrow()).toBe('link-change')
      })
    })

    test('suggestion should have link', () => {
      editor!.read(() => {
        const suggestion = $nodesOfType(ProtonNode)[0]
        const link = suggestion.getFirstChild<LinkNode>()
        expect($isLinkNode(link)).toBe(true)
        expect(link?.getURL()).toBe('http://example.com/')
      })
    })

    test('suggestion should have correct initial url', () => {
      editor!.read(() => {
        const suggestion = $nodesOfType(ProtonNode)[0]
        const url = suggestion.__properties.nodePropertiesChanged?.__url
        expect(url).toBe(existingURL)
      })
    })
  })

  describe('Remove existing link', () => {
    const existingURL = 'http://existing.com'

    beforeEach(async () => {
      await update(() => {
        const root = $getRoot()
        const paragraph = $createParagraphNode().append()
        const link = $createLinkNode(existingURL).append($createTextNode('Hello'))
        paragraph.append(link)
        root.append(paragraph)
        link.select(2, 2)
        $handleLinkChangeSuggestion(
          editor!,
          {
            url: null,
            linkNode: link,
            linkTextNode: null,
            text: null,
          },
          logger,
          onSuggestionCreation,
        )
      })
    })

    test('paragraph should have link-change suggestion', () => {
      editor!.read(() => {
        const paragraph = $getRoot().getFirstChild<ParagraphNode>()
        expect(paragraph?.getChildrenSize()).toBe(1)
        const suggestion = paragraph?.getFirstChild<ProtonNode>()
        expect($isSuggestionNode(suggestion)).toBe(true)
        expect(suggestion?.getSuggestionTypeOrThrow()).toBe('link-change')
      })
    })

    test('suggestion should not have link', () => {
      editor!.read(() => {
        const suggestion = $nodesOfType(ProtonNode)[0]
        const text = suggestion.getFirstChild()
        expect($isLinkNode(text)).toBe(false)
      })
    })

    test('suggestion should have correct initial url', () => {
      editor!.read(() => {
        const suggestion = $nodesOfType(ProtonNode)[0]
        const url = suggestion.__properties.nodePropertiesChanged?.__url
        expect(url).toBe(existingURL)
      })
    })
  })

  describe('Edit text for existing link', () => {
    const existingURL = 'http://existing.com/'

    beforeEach(async () => {
      await update(() => {
        const root = $getRoot()
        const paragraph = $createParagraphNode().append()
        const text = $createTextNode('Hello')
        const link = $createLinkNode(existingURL).append(text)
        paragraph.append(link)
        root.append(paragraph)
        text.select(2, 2)
        $handleLinkChangeSuggestion(
          editor!,
          {
            url: existingURL,
            linkNode: link,
            linkTextNode: text,
            text: 'World',
          },
          logger,
          onSuggestionCreation,
        )
      })
    })

    test('paragraph should have link-change suggestion', () => {
      editor!.read(() => {
        const paragraph = $getRoot().getFirstChild<ParagraphNode>()
        expect(paragraph?.getChildrenSize()).toBe(1)

        const suggestion = paragraph?.getFirstChild<ProtonNode>()
        expect($isSuggestionNode(suggestion)).toBe(true)
        expect(suggestion?.getSuggestionTypeOrThrow()).toBe('link-change')
      })
    })

    test('suggestion should have link', () => {
      editor!.read(() => {
        const suggestion = $nodesOfType(ParagraphNode)[0].getFirstChild<ProtonNode>()
        const link = suggestion?.getFirstChild<LinkNode>()
        expect($isLinkNode(link)).toBe(true)
        expect(link?.getURL()).toBe(existingURL)
      })
    })

    test('link should have insert & delete suggestions', () => {
      editor!.read(() => {
        const suggestion = $nodesOfType(ParagraphNode)[0].getFirstChild<ProtonNode>()
        const link = suggestion?.getFirstChild<LinkNode>()
        expect(link?.getChildrenSize()).toBe(2)

        const insertSuggestion = link?.getFirstChild<ProtonNode>()
        expect($isSuggestionNode(insertSuggestion)).toBe(true)
        expect(insertSuggestion?.getSuggestionTypeOrThrow()).toBe('insert')

        const deleteSuggestion = link?.getLastChild<ProtonNode>()
        expect($isSuggestionNode(deleteSuggestion)).toBe(true)
        expect(deleteSuggestion?.getSuggestionTypeOrThrow()).toBe('delete')
      })
    })

    test('suggestion should have correct initial url', () => {
      editor!.read(() => {
        const suggestion = $nodesOfType(ParagraphNode)[0].getFirstChild<ProtonNode>()
        const url = suggestion?.__properties.nodePropertiesChanged?.__url
        expect(url).toBe(existingURL)
      })
    })
  })
})
