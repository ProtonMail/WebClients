import { createHeadlessEditor } from '@lexical/headless'
import { AllNodes } from '../../AllNodes'
import { $createSuggestionNode } from './ProtonNode'
import type { ParagraphNode, TextNode } from 'lexical'
import { $createParagraphNode, $createTextNode, $getRoot } from 'lexical'
import { $rejectSuggestion } from './rejectSuggestion'
import { $createHeadingNode } from '@lexical/rich-text'
import { $createListItemNode, $createListNode } from '@lexical/list'

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
})
