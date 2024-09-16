import { createHeadlessEditor } from '@lexical/headless'
import { AllNodes } from '../../AllNodes'
import { $createSuggestionNode } from './ProtonNode'
import type { ParagraphNode } from 'lexical'
import { $createParagraphNode, $createTextNode, $getRoot } from 'lexical'
import { $acceptSuggestion } from './acceptSuggestion'
import { $createHeadingNode } from '@lexical/rich-text'
import { $createListItemNode, $createListNode } from '@lexical/list'

describe('$acceptSuggestion', () => {
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

  it('should unwrap "insert" and "property-change" suggestion nodes', () => {
    const suggestionID = Math.random().toString()

    editor.update(
      () => {
        const paragraph = $createParagraphNode().append(
          $createTextNode('Text'),
          $createSuggestionNode(suggestionID, 'insert').append($createTextNode('Inserted')),
          $createSuggestionNode(suggestionID, 'property-change').append($createTextNode('Changed')),
        )
        $getRoot().append(paragraph)
        $acceptSuggestion(suggestionID)
      },
      {
        discrete: true,
      },
    )

    editor.read(() => {
      const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()
      expect(paragraph.getTextContent()).toBe('TextInsertedChanged')
    })
  })

  it('should remove "delete" suggestion nodes with their children', () => {
    const suggestionID = Math.random().toString()

    editor.update(
      () => {
        const paragraph = $createParagraphNode().append(
          $createTextNode('Text'),
          $createSuggestionNode(suggestionID, 'delete').append($createTextNode('Deleted')),
          $createTextNode('After'),
        )
        $getRoot().append(paragraph)
        $acceptSuggestion(suggestionID)
      },
      {
        discrete: true,
      },
    )

    editor.read(() => {
      const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()
      expect(paragraph.getTextContent()).toBe('TextAfter')
    })
  })

  it('should remove "split" suggestion nodes, and remove temporary line-break sibling if exists', () => {
    const suggestionID = Math.random().toString()

    editor.update(
      () => {
        const paragraph = $createParagraphNode().append($createSuggestionNode(suggestionID, 'split'))
        $getRoot().append(paragraph)
        $acceptSuggestion(suggestionID)
      },
      {
        discrete: true,
      },
    )

    editor.read(() => {
      const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()
      expect(paragraph.getChildrenSize()).toBe(0)
    })
  })

  it('should remove "join" suggestion nodes, and merge children from the next block element into the current one', () => {
    const suggestionID = Math.random().toString()

    editor.update(
      () => {
        const paragraph = $createParagraphNode().append(
          $createTextNode('Paragraph 1'),
          $createSuggestionNode(suggestionID, 'join'),
        )
        const paragraph2 = $createParagraphNode().append($createTextNode('Paragraph 2'))

        const heading = $createHeadingNode('h1').append(
          $createTextNode('Heading'),
          $createSuggestionNode(suggestionID, 'join'),
        )
        const paragraph3 = $createParagraphNode().append($createTextNode('Paragraph 3'))

        const paragraph4 = $createParagraphNode().append(
          $createTextNode('Paragraph 4'),
          $createSuggestionNode(suggestionID, 'join'),
        )
        const listNode = $createListNode('bullet').append(
          $createListItemNode().append($createTextNode('ListItem1')),
          $createListItemNode().append($createTextNode('ListItem2')),
        )

        $getRoot().append(paragraph, paragraph2, heading, paragraph3, paragraph4, listNode)

        $acceptSuggestion(suggestionID)
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
})
