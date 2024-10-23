import { createHeadlessEditor } from '@lexical/headless'
import { AllNodes } from '../../AllNodes'
import { $createSuggestionNode } from './ProtonNode'
import type { ParagraphNode, ElementNode } from 'lexical'
import { $createParagraphNode, $createTextNode, $getRoot, $isParagraphNode, $isTextNode } from 'lexical'
import { $acceptSuggestion } from './acceptSuggestion'
import { $createHeadingNode, $isHeadingNode } from '@lexical/rich-text'
import { $createListItemNode, $createListNode } from '@lexical/list'
import type { TableCellNode, TableNode, TableRowNode } from '@lexical/table'
import { $createTableNodeWithDimensions } from '@lexical/table'

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

  it('should unwrap "insert", "property-change", "style-change" suggestion nodes', () => {
    const suggestionID = Math.random().toString()

    editor.update(
      () => {
        const paragraph = $createParagraphNode().append(
          $createTextNode('Text'),
          $createSuggestionNode(suggestionID, 'insert').append($createTextNode('Inserted')),
          $createSuggestionNode(suggestionID, 'property-change').append($createTextNode('Changed')),
          $createSuggestionNode(suggestionID, 'style-change').append($createTextNode('Changed')),
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
      expect(paragraph.getChildrenSize()).toBe(1)
      expect($isTextNode(paragraph.getFirstChild())).toBe(true)
      expect(paragraph.getTextContent()).toBe('TextInsertedChangedChanged')
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

  it('should remove "split" suggestion nodes', () => {
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

  describe('link-change', () => {
    it('should unwrap node', () => {
      const suggestionID = Math.random().toString()

      editor.update(
        () => {
          const paragraph = $createParagraphNode().append(
            $createSuggestionNode(suggestionID, 'link-change').append($createTextNode('Inserted')),
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
        expect(paragraph.getChildrenSize()).toBe(1)
        expect($isTextNode(paragraph.getFirstChild())).toBe(true)
      })
    })
  })

  describe('insert-table', () => {
    it('should remove suggestion node(s)', () => {
      const suggestionID = Math.random().toString()

      editor.update(
        () => {
          const table = $createTableNodeWithDimensions(2, 2)
          $getRoot().append(table)
          const cells = table
            .getChildren<TableRowNode>()
            .map((row) => row.getChildren<TableCellNode>())
            .flat()
          for (const cell of cells) {
            cell.append($createSuggestionNode(suggestionID, 'insert-table'))
          }
          $acceptSuggestion(suggestionID)
        },
        {
          discrete: true,
        },
      )

      editor.read(() => {
        const table = $getRoot().getFirstChildOrThrow<TableNode>()
        const cells = table
          .getChildren<TableRowNode>()
          .map((row) => row.getChildren<TableCellNode>())
          .flat()
        for (const cell of cells) {
          expect(cell.getChildrenSize()).toBe(1)
          expect($isParagraphNode(cell.getFirstChildOrThrow())).toBe(true)
        }
      })
    })
  })

  describe('delete-table', () => {
    it('should remove whole table', () => {
      const suggestionID = Math.random().toString()

      editor.update(
        () => {
          const table = $createTableNodeWithDimensions(2, 2)
          $getRoot().append(table)
          const cells = table
            .getChildren<TableRowNode>()
            .map((row) => row.getChildren<TableCellNode>())
            .flat()
          for (const cell of cells) {
            cell.append($createSuggestionNode(suggestionID, 'delete-table'))
          }
          $acceptSuggestion(suggestionID)
        },
        {
          discrete: true,
        },
      )

      editor.read(() => {
        expect($getRoot().getChildrenSize()).toBe(0)
      })
    })
  })

  describe('insert-table-row', () => {
    it('should remove suggestion node(s)', () => {
      const suggestionID = Math.random().toString()

      editor.update(
        () => {
          const table = $createTableNodeWithDimensions(2, 2)
          $getRoot().append(table)
          const cells = table.getFirstChildOrThrow<TableRowNode>().getChildren<TableCellNode>()
          for (const cell of cells) {
            cell.append($createSuggestionNode(suggestionID, 'insert-table-row'))
          }
          $acceptSuggestion(suggestionID)
        },
        {
          discrete: true,
        },
      )

      editor.read(() => {
        const table = $getRoot().getFirstChildOrThrow<TableNode>()
        const cells = table.getFirstChildOrThrow<TableRowNode>().getChildren<TableCellNode>()
        for (const cell of cells) {
          expect(cell.getChildrenSize()).toBe(1)
          expect($isParagraphNode(cell.getFirstChildOrThrow())).toBe(true)
        }
      })
    })
  })

  describe('duplicate-table-row', () => {
    it('should remove suggestion node(s)', () => {
      const suggestionID = Math.random().toString()

      editor.update(
        () => {
          const table = $createTableNodeWithDimensions(2, 2)
          $getRoot().append(table)
          const cells = table.getFirstChildOrThrow<TableRowNode>().getChildren<TableCellNode>()
          for (const cell of cells) {
            cell.append($createSuggestionNode(suggestionID, 'duplicate-table-row'))
          }
          $acceptSuggestion(suggestionID)
        },
        {
          discrete: true,
        },
      )

      editor.read(() => {
        const table = $getRoot().getFirstChildOrThrow<TableNode>()
        const cells = table.getFirstChildOrThrow<TableRowNode>().getChildren<TableCellNode>()
        for (const cell of cells) {
          expect(cell.getChildrenSize()).toBe(1)
          expect($isParagraphNode(cell.getFirstChildOrThrow())).toBe(true)
        }
      })
    })
  })

  describe('delete-table-row', () => {
    it('should remove table row', () => {
      const suggestionID = Math.random().toString()

      editor.update(
        () => {
          const table = $createTableNodeWithDimensions(2, 2)
          $getRoot().append(table)
          const cells = table.getFirstChildOrThrow<TableRowNode>().getChildren<TableCellNode>()
          for (const cell of cells) {
            cell.append($createSuggestionNode(suggestionID, 'delete-table-row'))
          }
          $acceptSuggestion(suggestionID)
        },
        {
          discrete: true,
        },
      )

      editor.read(() => {
        const table = $getRoot().getFirstChildOrThrow<TableNode>()
        expect(table.getChildrenSize()).toBe(1)
      })
    })
  })

  describe('insert-table-column', () => {
    it('should remove suggestion node(s)', () => {
      const suggestionID = Math.random().toString()

      editor.update(
        () => {
          const table = $createTableNodeWithDimensions(2, 2)
          $getRoot().append(table)
          const cells = table
            .getChildren<TableRowNode>()
            .map((row) => row.getChildAtIndex<TableCellNode>(1)!)
            .flat()
          for (const cell of cells) {
            cell.append($createSuggestionNode(suggestionID, 'insert-table-column'))
          }
          $acceptSuggestion(suggestionID)
        },
        {
          discrete: true,
        },
      )

      editor.read(() => {
        const table = $getRoot().getFirstChildOrThrow<TableNode>()
        const cells = table
          .getChildren<TableRowNode>()
          .map((row) => row.getChildAtIndex<TableCellNode>(1)!)
          .flat()
        for (const cell of cells) {
          expect(cell.getChildrenSize()).toBe(1)
          expect($isParagraphNode(cell.getFirstChildOrThrow())).toBe(true)
        }
      })
    })
  })

  describe('duplicate-table-column', () => {
    it('should remove suggestion node(s)', () => {
      const suggestionID = Math.random().toString()

      editor.update(
        () => {
          const table = $createTableNodeWithDimensions(2, 2)
          $getRoot().append(table)
          const cells = table
            .getChildren<TableRowNode>()
            .map((row) => row.getChildAtIndex<TableCellNode>(1)!)
            .flat()
          for (const cell of cells) {
            cell.append($createSuggestionNode(suggestionID, 'duplicate-table-column'))
          }
          $acceptSuggestion(suggestionID)
        },
        {
          discrete: true,
        },
      )

      editor.read(() => {
        const table = $getRoot().getFirstChildOrThrow<TableNode>()
        const cells = table
          .getChildren<TableRowNode>()
          .map((row) => row.getChildAtIndex<TableCellNode>(1)!)
          .flat()
        for (const cell of cells) {
          expect(cell.getChildrenSize()).toBe(1)
          expect($isParagraphNode(cell.getFirstChildOrThrow())).toBe(true)
        }
      })
    })
  })

  describe('delete-table-column', () => {
    it('should remove table column', () => {
      const suggestionID = Math.random().toString()

      editor.update(
        () => {
          const table = $createTableNodeWithDimensions(2, 2)
          $getRoot().append(table)
          const cells = table
            .getChildren<TableRowNode>()
            .map((row) => row.getChildAtIndex<TableCellNode>(1)!)
            .flat()
          for (const cell of cells) {
            cell.append($createSuggestionNode(suggestionID, 'delete-table-column'))
          }
          $acceptSuggestion(suggestionID)
        },
        {
          discrete: true,
        },
      )

      editor.read(() => {
        const table = $getRoot().getFirstChildOrThrow<TableNode>()
        const rows = table.getChildren<TableRowNode>()
        for (const row of rows) {
          expect(row.getChildrenSize()).toBe(1)
        }
      })
    })
  })

  describe('block-type-change', () => {
    it('should remove suggestion node', () => {
      const suggestionID = Math.random().toString()

      editor.update(
        () => {
          $getRoot().append(
            $createHeadingNode('h2').append(
              $createSuggestionNode(suggestionID, 'block-type-change', {
                initialBlockType: 'paragraph',
              }),
            ),
          )
          $acceptSuggestion(suggestionID)
        },
        {
          discrete: true,
        },
      )

      editor.read(() => {
        const heading = $getRoot().getFirstChild<ElementNode>()
        expect($isHeadingNode(heading)).toBe(true)
        expect(heading?.getChildrenSize()).toBe(0)
      })
    })
  })
})
