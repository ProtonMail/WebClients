import { createHeadlessEditor } from '@lexical/headless'
import { AllNodes } from '../../AllNodes'
import type { ProtonNode } from './ProtonNode'
import { $createSuggestionNode } from './ProtonNode'
import type { ParagraphNode, TextNode } from 'lexical'
import { $isTextNode } from 'lexical'
import { $createParagraphNode, $createTextNode, $getRoot } from 'lexical'
import { $rejectSuggestion } from './rejectSuggestion'
import { $createHeadingNode } from '@lexical/rich-text'
import { $createListItemNode, $createListNode } from '@lexical/list'
import type { LinkNode } from '@lexical/link'
import { $createLinkNode, $isLinkNode } from '@lexical/link'
import { getStyleObjectFromCSS } from '@lexical/selection'

describe('$rejectSuggestion', () => {
  const editor = createHeadlessEditor({
    nodes: AllNodes,
    onError: console.error,
  })

  beforeEach(() => {
    editor.update(
      () => {
        $getRoot().clear()
      },
      {
        discrete: true,
      },
    )
  })

  it('should remove "insert" suggestion nodes along with their children', () => {
    const suggestionID = Math.random().toString()

    editor.update(
      () => {
        const paragraph = $createParagraphNode().append(
          $createTextNode('Text'),
          $createSuggestionNode(suggestionID, 'insert').append($createTextNode('Inserted')),
        )
        $getRoot().append(paragraph)
        $rejectSuggestion(suggestionID)
      },
      {
        discrete: true,
      },
    )

    editor.read(() => {
      const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()
      expect(paragraph.getTextContent()).toBe('Text')
    })
  })

  it('should unwrap "delete" suggestion nodes', () => {
    const suggestionID = Math.random().toString()

    editor.update(
      () => {
        const paragraph = $createParagraphNode().append(
          $createTextNode('Text'),
          $createSuggestionNode(suggestionID, 'delete').append($createTextNode('Deleted')),
          $createTextNode('After'),
        )
        $getRoot().append(paragraph)
        $rejectSuggestion(suggestionID)
      },
      {
        discrete: true,
      },
    )

    editor.read(() => {
      const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()
      expect(paragraph.getTextContent()).toBe('TextDeletedAfter')
    })
  })

  describe('style-change', () => {
    let paragraph!: ParagraphNode
    let suggestion!: ProtonNode
    let text!: TextNode

    beforeEach(() => {
      editor.update(
        () => {
          paragraph = $createParagraphNode()
          suggestion = $createSuggestionNode('test', 'style-change', {
            'font-size': '16px',
          })
          text = $createTextNode('Test').setStyle(`font-size: 20px;background-color: #fff;`)
          paragraph.append(suggestion.append(text))
          $getRoot().append(paragraph)
          $rejectSuggestion('test')
        },
        {
          discrete: true,
        },
      )
    })

    test('should unwrap suggestion node', () => {
      editor.read(() => {
        expect(paragraph.getChildrenSize()).toBe(1)
        expect($isTextNode(paragraph.getFirstChild())).toBe(true)
      })
    })

    test('should revert style', () => {
      editor.read(() => {
        const style = getStyleObjectFromCSS(text.getStyle())
        expect(style['font-size']).toBe('16px')
        expect(style['background-color']).toBe('#fff')
      })
    })
  })

  it('should unwrap "property-change" suggestion nodes and revert the values of the changed properties', () => {
    const suggestionID = Math.random().toString()

    editor.update(
      () => {
        const paragraph = $createParagraphNode()

        const textWithExistingFormat = $createTextNode('Bold').toggleFormat('bold')
        const suggestion1 = $createSuggestionNode(suggestionID, 'property-change', {
          __format: textWithExistingFormat.getFormat(),
        })
        suggestion1.append(textWithExistingFormat)
        textWithExistingFormat.toggleFormat('bold')

        const textWithoutFormat = $createTextNode('None')
        const suggestion2 = $createSuggestionNode(suggestionID, 'property-change', {
          __format: textWithoutFormat.getFormat(),
        })
        suggestion2.append(textWithoutFormat)
        textWithoutFormat.toggleFormat('bold')

        paragraph.append(suggestion1, suggestion2)
        $getRoot().append(paragraph)
        $rejectSuggestion(suggestionID)
      },
      {
        discrete: true,
      },
    )

    editor.read(() => {
      const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()
      expect(paragraph.getChildrenSize()).toBe(2)
      expect(paragraph.getFirstChildOrThrow<TextNode>().getFormat()).toBe(1)
      expect(paragraph.getLastChildOrThrow<TextNode>().getFormat()).toBe(0)
    })
  })

  it('should remove "join" suggestion nodes', () => {
    const suggestionID = Math.random().toString()

    editor.update(
      () => {
        $getRoot().append(
          $createParagraphNode().append($createSuggestionNode(suggestionID, 'join')),
          $createParagraphNode(),
        )
        $rejectSuggestion(suggestionID)
      },
      {
        discrete: true,
      },
    )

    editor.read(() => {
      expect($getRoot().getChildrenSize()).toBe(2)
      const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()
      expect(paragraph.getChildrenSize()).toBe(0)
    })
  })

  it('should remove "split" suggestion nodes, and merge children from the next block element into the current one', () => {
    const suggestionID = Math.random().toString()

    editor.update(
      () => {
        const paragraph = $createParagraphNode().append(
          $createTextNode('Paragraph 1'),
          $createSuggestionNode(suggestionID, 'split'),
        )
        const paragraph2 = $createParagraphNode().append($createTextNode('Paragraph 2'))

        const heading = $createHeadingNode('h1').append(
          $createTextNode('Heading'),
          $createSuggestionNode(suggestionID, 'split'),
        )
        const paragraph3 = $createParagraphNode().append($createTextNode('Paragraph 3'))

        const paragraph4 = $createParagraphNode().append(
          $createTextNode('Paragraph 4'),
          $createSuggestionNode(suggestionID, 'split'),
        )
        const listNode = $createListNode('bullet').append(
          $createListItemNode().append($createTextNode('ListItem1')),
          $createListItemNode().append($createTextNode('ListItem2')),
        )

        $getRoot().append(paragraph, paragraph2, heading, paragraph3, paragraph4, listNode)

        $rejectSuggestion(suggestionID)
      },
      {
        discrete: true,
      },
    )

    editor.read(() => {
      const root = $getRoot()

      const paragraph = root.getChildAtIndex(0)
      expect(paragraph?.getTextContent()).toBe('Paragraph 1Paragraph 2')

      const heading = root.getChildAtIndex(1)
      expect(heading?.getTextContent()).toBe('HeadingParagraph 3')

      const paragraph4 = root.getChildAtIndex(2)
      expect(paragraph4?.getTextContent()).toBe('Paragraph 4ListItem1')
    })
  })

  describe('link-change', () => {
    describe('No nodePropertiesChanged property', () => {
      test('should remove node', () => {
        editor.update(
          () => {
            const suggestionID = 'test'
            $getRoot().append($createParagraphNode().append($createSuggestionNode(suggestionID, 'link-change')))
            $rejectSuggestion(suggestionID)
          },
          {
            discrete: true,
          },
        )
        editor.read(() => {
          const paragraph = $getRoot().getFirstChild<ParagraphNode>()
          expect(paragraph?.getChildrenSize()).toBe(0)
        })
      })
    })

    describe('Added link', () => {
      const newLink = 'http://foo.com'

      beforeEach(() => {
        editor.update(
          () => {
            const suggestionID = 'test'
            $getRoot().append(
              $createParagraphNode().append(
                $createSuggestionNode(suggestionID, 'link-change', {
                  __url: null,
                }).append($createLinkNode(newLink).append($createTextNode('Foo'))),
              ),
            )
            $rejectSuggestion(suggestionID)
          },
          { discrete: true },
        )
      })

      test('link and suggestion should be unwrapped', () => {
        editor.read(() => {
          const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()
          expect(paragraph.getChildrenSize()).toBe(1)

          const first = paragraph.getFirstChildOrThrow<LinkNode>()
          expect($isTextNode(first)).toBe(true)
        })
      })
    })

    describe('Edited link', () => {
      const originalLink = 'http://bar.com'
      const newLink = 'http://foo.com'

      beforeEach(() => {
        editor.update(
          () => {
            const suggestionID = 'test'
            $getRoot().append(
              $createParagraphNode().append(
                $createSuggestionNode(suggestionID, 'link-change', {
                  __url: originalLink,
                }).append($createLinkNode(newLink).append($createTextNode('Foo'))),
              ),
            )
            $rejectSuggestion(suggestionID)
          },
          { discrete: true },
        )
      })

      test('link url should be changed back to original', () => {
        editor.read(() => {
          const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()
          expect(paragraph.getChildrenSize()).toBe(1)

          const first = paragraph.getFirstChildOrThrow<LinkNode>()
          expect($isLinkNode(first)).toBe(true)
          expect(first.getURL()).toBe(originalLink)
        })
      })
    })

    describe('Removed link', () => {
      beforeEach(() => {
        editor.update(
          () => {
            const suggestionID = 'test'
            $getRoot().append(
              $createParagraphNode().append(
                $createSuggestionNode(suggestionID, 'link-change', {
                  __url: 'http://foo.com',
                }).append($createTextNode('Foo')),
              ),
            )
            $rejectSuggestion(suggestionID)
          },
          { discrete: true },
        )
      })

      test('link should be recreated', () => {
        editor.read(() => {
          const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()
          expect(paragraph.getChildrenSize()).toBe(1)

          const first = paragraph.getFirstChildOrThrow<LinkNode>()
          expect($isLinkNode(first)).toBe(true)
        })
      })

      test('link should have correct url', () => {
        editor.read(() => {
          const link = $getRoot().getFirstChildOrThrow<ParagraphNode>().getFirstChildOrThrow<LinkNode>()
          expect(link.getURL()).toBe('http://foo.com')
        })
      })
    })
  })
})
