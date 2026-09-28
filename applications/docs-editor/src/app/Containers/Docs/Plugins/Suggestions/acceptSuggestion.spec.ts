import { createHeadlessEditor } from '@lexical/headless'
import { AllNodes } from '../../AllNodes'
import { $createSuggestionNode } from './ProtonNode'
import type { ParagraphNode, ElementNode, TextNode } from 'lexical'
import { $createParagraphNode, $createTextNode, $getRoot, $isParagraphNode, $isTextNode } from 'lexical'
import { $acceptSuggestion } from './acceptSuggestion'
import type { HeadingNode } from '@lexical/rich-text'
import { $createHeadingNode, $isHeadingNode } from '@lexical/rich-text'
import type { ListItemNode, ListNode } from '@lexical/list'
import { $createListItemNode, $createListNode, $isListItemNode, $isListNode } from '@lexical/list'
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

  function testEditorState(name: string, fn: () => void) {
    test(name, () => {
      editor.read(fn)
    })
  }

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

  describe('join', () => {
    const suggestionID = Math.random().toString()

    describe('Paragraph and paragraph', () => {
      beforeEach(() => {
        editor.update(
          () => {
            const paragraph = $createParagraphNode().append(
              $createTextNode('1'),
              $createSuggestionNode(suggestionID, 'join'),
            )
            const paragraph2 = $createParagraphNode().append($createTextNode('2'))
            $getRoot().append(paragraph, paragraph2)
            $acceptSuggestion(suggestionID)
          },
          { discrete: true },
        )
      })

      testEditorState('root should have 1 child which is a paragraph', () => {
        const root = $getRoot()
        expect(root.getChildrenSize()).toBe(1)
        expect($isParagraphNode(root.getFirstChild())).toBe(true)
      })

      testEditorState('paragraph should have 1 text node', () => {
        const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()
        expect(paragraph.getChildrenSize()).toBe(1)
        expect($isTextNode(paragraph.getFirstChild())).toBe(true)
      })

      testEditorState('text node should have merged content', () => {
        const text = $getRoot().getFirstChildOrThrow<ParagraphNode>().getFirstChildOrThrow<TextNode>()
        expect(text.getTextContent()).toBe('12')
      })
    })

    describe('Heading and paragraph', () => {
      beforeEach(() => {
        editor.update(
          () => {
            const heading = $createHeadingNode('h1').append(
              $createTextNode('1'),
              $createSuggestionNode(suggestionID, 'join'),
            )
            const paragraph3 = $createParagraphNode().append($createTextNode('2'))
            $getRoot().append(heading, paragraph3)
            $acceptSuggestion(suggestionID)
          },
          { discrete: true },
        )
      })

      testEditorState('root should have 1 child which is a heading', () => {
        const root = $getRoot()
        expect(root.getChildrenSize()).toBe(1)
        expect($isHeadingNode(root.getFirstChild())).toBe(true)
      })

      testEditorState('heading should have 1 text node', () => {
        const heading = $getRoot().getFirstChildOrThrow<HeadingNode>()
        expect(heading.getChildrenSize()).toBe(1)
        expect($isTextNode(heading.getFirstChild())).toBe(true)
      })

      testEditorState('text node should have merged content', () => {
        const text = $getRoot().getFirstChildOrThrow<ParagraphNode>().getFirstChildOrThrow<TextNode>()
        expect(text.getTextContent()).toBe('12')
      })
    })

    describe('Paragraph and list item', () => {
      beforeEach(() => {
        editor.update(
          () => {
            const paragraph4 = $createParagraphNode().append(
              $createTextNode('1'),
              $createSuggestionNode(suggestionID, 'join'),
            )
            const listNode = $createListNode('bullet').append(
              $createListItemNode().append($createTextNode('2')),
              $createListItemNode().append($createTextNode('3')),
            )
            $getRoot().append(paragraph4, listNode)
            $acceptSuggestion(suggestionID)
          },
          { discrete: true },
        )
      })

      testEditorState('root should have 2 children, paragraph and list', () => {
        const root = $getRoot()
        expect(root.getChildrenSize()).toBe(2)
        const first = root.getChildAtIndex(0)
        const second = root.getChildAtIndex(1)
        expect($isParagraphNode(first)).toBe(true)
        expect($isListNode(second)).toBe(true)
      })

      testEditorState('paragraph should have 1 text node', () => {
        const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()
        expect(paragraph.getChildrenSize()).toBe(1)
        expect($isTextNode(paragraph.getFirstChild())).toBe(true)
      })

      testEditorState('text node should have merged content', () => {
        const text = $getRoot().getFirstChildOrThrow<ParagraphNode>().getFirstChildOrThrow<TextNode>()
        expect(text.getTextContent()).toBe('12')
      })
    })

    describe('Nested list item and paragraph', () => {
      beforeEach(() => {
        editor.update(
          () => {
            const listNode2 = $createListNode('bullet').append($createListItemNode().append($createTextNode('1')))
            const nestedListItem = $createListItemNode().append(
              $createTextNode('2'),
              $createSuggestionNode(suggestionID, 'join'),
            )
            listNode2.append(nestedListItem)
            const paragraph5 = $createParagraphNode().append($createTextNode('3'))
            $getRoot().append(listNode2, paragraph5)
            nestedListItem.setIndent(2)
            $acceptSuggestion(suggestionID)
          },
          { discrete: true },
        )
      })

      testEditorState('root should have 1 child which is a list', () => {
        const root = $getRoot()
        expect(root.getChildrenSize()).toBe(1)
        expect($isListNode(root.getFirstChild())).toBe(true)
      })

      testEditorState('list should have 2 list items', () => {
        const list = $getRoot().getFirstChildOrThrow<ListNode>()
        expect(list.getChildrenSize()).toBe(2)
        for (const item of list.getChildren()) {
          expect($isListItemNode(item)).toBe(true)
        }
      })

      testEditorState('first list item should be non-nested', () => {
        const list = $getRoot().getFirstChildOrThrow<ListNode>()
        const first = list.getFirstChildOrThrow<ListItemNode>()
        expect(first.getIndent()).toBe(0)
        expect($isTextNode(first.getFirstChild())).toBe(true)
      })

      testEditorState('second list item should be nested by 2 levels', () => {
        const list = $getRoot().getFirstChildOrThrow<ListNode>()
        const second = list.getChildAtIndex<ListItemNode>(1)!
        const firstNestedList = second.getFirstChildOrThrow<ListNode>()
        expect($isListNode(firstNestedList)).toBe(true)
        const firstNestedListItem = firstNestedList.getFirstChildOrThrow<ListItemNode>()
        expect($isListItemNode(firstNestedListItem)).toBe(true)
        const secondNestedList = firstNestedListItem.getFirstChildOrThrow<ListNode>()
        expect($isListNode(secondNestedList)).toBe(true)
        const secondNestedListItem = secondNestedList.getFirstChildOrThrow<ListItemNode>()
        expect($isListItemNode(secondNestedListItem)).toBe(true)
        expect(secondNestedListItem.getIndent()).toBe(2)
      })

      testEditorState('nested list item should have 1 text node', () => {
        const list = $getRoot().getFirstChildOrThrow<ListNode>()
        const second = list.getChildAtIndex<ListItemNode>(1)!
        const descendant = second.getFirstDescendant()!
        expect($isTextNode(descendant)).toBe(true)
        const descendantParent = descendant.getParent<ListItemNode>()
        expect($isListItemNode(descendantParent)).toBe(true)
        expect(descendantParent?.getChildrenSize()).toBe(1)
      })

      testEditorState('text node should have merged content', () => {
        const list = $getRoot().getFirstChildOrThrow<ListNode>()
        const second = list.getChildAtIndex<ListItemNode>(1)!
        const text = second.getFirstDescendant()!
        expect(text.getTextContent()).toBe('23')
      })
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
