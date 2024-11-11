/* eslint-disable custom-rules/deprecate-classes */
import { createHeadlessEditor } from '@lexical/headless'
import { AllNodes } from '../../AllNodes'
import type { ProtonNode } from './ProtonNode'
import { $createSuggestionNode, $isSuggestionNode } from './ProtonNode'
import type { ElementNode, ParagraphNode, TextNode } from 'lexical'
import { $createRangeSelection, $isParagraphNode, $isTextNode, $setSelection } from 'lexical'
import { $createParagraphNode, $createTextNode, $getRoot } from 'lexical'
import { $rejectSuggestion } from './rejectSuggestion'
import type { HeadingNode } from '@lexical/rich-text'
import { $createHeadingNode, $isHeadingNode } from '@lexical/rich-text'
import type { ListNode, ListItemNode } from '@lexical/list'
import { $isListItemNode } from '@lexical/list'
import { $createListItemNode, $createListNode, $isListNode } from '@lexical/list'
import type { LinkNode } from '@lexical/link'
import { $createLinkNode, $isLinkNode } from '@lexical/link'
import { $patchStyleText, getStyleObjectFromCSS } from '@lexical/selection'
import type { TableRowNode, TableCellNode, TableNode } from '@lexical/table'
import { $createTableNodeWithDimensions } from '@lexical/table'
import { $clearFormattingAsSuggestion } from './clearFormattingAsSuggestion'
import type { CustomListNode } from '../CustomList/CustomListNode'
import { assertCondition } from './TestUtils'
import { $isCustomListNode } from '../CustomList/$isCustomListNode'

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

  function testEditorState(name: string, fn: () => void) {
    test(name, () => {
      editor.read(fn)
    })
  }

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

  describe('indent-change', () => {
    describe('Paragraph', () => {
      beforeEach(() => {
        editor.update(
          () => {
            const paragraph1 = $createParagraphNode()
              .append(
                $createSuggestionNode('test', 'indent-change', {
                  indent: 0,
                }),
              )
              .setIndent(1)
            const paragraph2 = $createParagraphNode()
              .append(
                $createSuggestionNode('test', 'indent-change', {
                  indent: 1,
                }),
              )
              .setIndent(0)
            const paragraph3 = $createParagraphNode()
              .append(
                $createSuggestionNode('test', 'indent-change', {
                  indent: 1,
                }),
              )
              .setIndent(2)
            const paragraph4 = $createParagraphNode()
              .append(
                $createSuggestionNode('test', 'indent-change', {
                  indent: 2,
                }),
              )
              .setIndent(1)
            $getRoot().append(paragraph1, paragraph2, paragraph3, paragraph4)
            $rejectSuggestion('test')
          },
          {
            discrete: true,
          },
        )
      })

      test('Paragraph 1 should be outdented to level 0', () => {
        editor.read(() => {
          const paragraph1 = $getRoot().getChildAtIndex<ParagraphNode>(0)
          expect(paragraph1?.getIndent()).toBe(0)
        })
      })

      test('Paragraph 2 should be indented to level 1', () => {
        editor.read(() => {
          const paragraph1 = $getRoot().getChildAtIndex<ParagraphNode>(1)
          expect(paragraph1?.getIndent()).toBe(1)
        })
      })

      test('Paragraph 3 should be outdented to level 1', () => {
        editor.read(() => {
          const paragraph1 = $getRoot().getChildAtIndex<ParagraphNode>(2)
          expect(paragraph1?.getIndent()).toBe(1)
        })
      })

      test('Paragraph 4 should be indented to level 2', () => {
        editor.read(() => {
          const paragraph1 = $getRoot().getChildAtIndex<ParagraphNode>(3)
          expect(paragraph1?.getIndent()).toBe(2)
        })
      })
    })

    describe('List', () => {
      describe('To outdent', () => {
        beforeEach(() => {
          editor.update(
            () => {
              const list = $createListNode('number')
              const item1 = $createListItemNode()
              const item2 = $createListItemNode().append(
                $createSuggestionNode('test', 'indent-change', {
                  indent: 0,
                }),
              )
              const item3 = $createListItemNode()
              list.append(item1, item2, item3)
              $getRoot().append(list)
              item2.setIndent(1)
            },
            {
              discrete: true,
            },
          )
          editor.update(
            () => {
              $rejectSuggestion('test')
            },
            {
              discrete: true,
            },
          )
        })

        test('Should de-nest list-item', () => {
          editor.read(() => {
            const list = $getRoot().getChildAtIndex<ListNode>(0)
            const indentedItem = list?.getChildAtIndex<ListItemNode>(1)
            expect(indentedItem?.getChildrenSize()).toBe(0)
          })
        })
      })

      describe('To indent', () => {
        beforeEach(() => {
          editor.update(
            () => {
              const list = $createListNode('number')
              const item1 = $createListItemNode()
              const item2 = $createListItemNode().append(
                $createSuggestionNode('test', 'indent-change', {
                  indent: 1,
                }),
              )
              const item3 = $createListItemNode()
              list.append(item1, item2, item3)
              $getRoot().append(list)
              item2.setIndent(0)
            },
            {
              discrete: true,
            },
          )
          editor.update(
            () => {
              $rejectSuggestion('test')
            },
            {
              discrete: true,
            },
          )
        })

        test('Should nest list-item deeper 1 level', () => {
          editor.read(() => {
            const list = $getRoot().getChildAtIndex<ListNode>(0)
            const indentedItem = list?.getChildAtIndex<ListItemNode>(1)
            expect(indentedItem?.getChildrenSize()).toBe(1)
            const nestedList = indentedItem?.getFirstChildOrThrow<ListNode>()
            expect($isListNode(nestedList)).toBe(true)
            expect(nestedList?.getChildrenSize()).toBe(1)
            const nestedListItem = nestedList?.getFirstChildOrThrow<ListItemNode>()
            expect($isListItemNode(nestedListItem)).toBe(true)
          })
        })
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

  describe('delete-table', () => {
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
            cell.append($createSuggestionNode(suggestionID, 'delete-table'))
          }
          $rejectSuggestion(suggestionID)
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

  describe('insert-table', () => {
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
            cell.append($createSuggestionNode(suggestionID, 'insert-table'))
          }
          $rejectSuggestion(suggestionID)
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

  describe('delete-table-row', () => {
    it('should remove suggestion node(s)', () => {
      const suggestionID = Math.random().toString()

      editor.update(
        () => {
          const table = $createTableNodeWithDimensions(2, 2)
          $getRoot().append(table)
          const cells = table.getFirstChildOrThrow<TableRowNode>().getChildren<TableCellNode>()
          for (const cell of cells) {
            cell.append($createSuggestionNode(suggestionID, 'delete-table-row'))
          }
          $rejectSuggestion(suggestionID)
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

  describe('insert-table-row', () => {
    it('should remove table row', () => {
      const suggestionID = Math.random().toString()

      editor.update(
        () => {
          const table = $createTableNodeWithDimensions(2, 2)
          $getRoot().append(table)
          const cells = table.getFirstChildOrThrow<TableRowNode>().getChildren<TableCellNode>()
          for (const cell of cells) {
            cell.append($createSuggestionNode(suggestionID, 'insert-table-row'))
          }
          $rejectSuggestion(suggestionID)
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

  describe('duplicate-table-row', () => {
    it('should remove table row', () => {
      const suggestionID = Math.random().toString()

      editor.update(
        () => {
          const table = $createTableNodeWithDimensions(2, 2)
          $getRoot().append(table)
          const cells = table.getFirstChildOrThrow<TableRowNode>().getChildren<TableCellNode>()
          for (const cell of cells) {
            cell.append($createSuggestionNode(suggestionID, 'duplicate-table-row'))
          }
          $rejectSuggestion(suggestionID)
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

  describe('delete-table-column', () => {
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
            cell.append($createSuggestionNode(suggestionID, 'delete-table-column'))
          }
          $rejectSuggestion(suggestionID)
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

  describe('insert-table-column', () => {
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
            cell.append($createSuggestionNode(suggestionID, 'insert-table-column'))
          }
          $rejectSuggestion(suggestionID)
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

  describe('duplicate-table-column', () => {
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
            cell.append($createSuggestionNode(suggestionID, 'duplicate-table-column'))
          }
          $rejectSuggestion(suggestionID)
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
    describe('Current block is list item, reverting to other list type', () => {
      beforeEach(() => {
        const suggestionID = Math.random().toString()

        editor.update(
          () => {
            $getRoot().append(
              $createListNode('bullet').append(
                $createListItemNode().append(
                  $createSuggestionNode(suggestionID, 'block-type-change', {
                    initialBlockType: 'number',
                    listInfo: {
                      listType: 'number',
                      listMarker: 'bracket',
                      listStyleType: 'upper-roman',
                    },
                  }),
                  $createTextNode('Hello').toggleFormat('bold'),
                  $createTextNode('World'),
                ),
              ),
            )
            $rejectSuggestion(suggestionID)
          },
          {
            discrete: true,
          },
        )
      })

      testEditorState('list should be converted back to numbered', () => {
        const list = $getRoot().getFirstChild()
        assertCondition($isCustomListNode(list))
        expect(list.getListType()).toBe('number')
      })

      testEditorState('custom list props should be correctly applied', () => {
        const list = $getRoot().getFirstChild()
        assertCondition($isCustomListNode(list))
        expect(list.getListStyleType()).toBe('upper-roman')
        expect(list.getListMarker()).toBe('bracket')
      })

      testEditorState('suggestion should be removed', () => {
        const listItem = $getRoot().getFirstChildOrThrow<ListNode>().getFirstChild()
        assertCondition($isListItemNode(listItem))
        expect(listItem.getChildrenSize()).toBe(2)
        const suggestion = listItem
          .getChildren()
          .find((n) => $isSuggestionNode(n) && n.getSuggestionTypeOrThrow() === 'block-type-change')
        expect(suggestion).toBeFalsy()
      })

      testEditorState('list item content should be intact', () => {
        const listItem = $getRoot().getFirstChildOrThrow<ListNode>().getFirstChild()
        assertCondition($isListItemNode(listItem))
        expect(listItem.getChildrenSize()).toBe(2)
        const first = listItem.getChildAtIndex(0)
        assertCondition($isTextNode(first))
        expect(first.getTextContent()).toBe('Hello')
        expect(first.hasFormat('bold')).toBe(true)
        const second = listItem.getChildAtIndex(1)
        assertCondition($isTextNode(second))
        expect(second.getTextContent()).toBe('World')
        expect(second.hasFormat('bold')).toBe(false)
      })
    })

    describe('Others', () => {
      beforeEach(() => {
        const suggestionID = Math.random().toString()

        editor.update(
          () => {
            $getRoot().append(
              $createHeadingNode('h2').append(
                $createSuggestionNode(suggestionID, 'block-type-change', {
                  initialBlockType: 'paragraph',
                }),
              ),
              $createHeadingNode('h2')
                .setFormat('right')
                .setIndent(1)
                .append(
                  $createSuggestionNode(suggestionID, 'block-type-change', {
                    initialBlockType: 'h1',
                  }),
                ),
              $createHeadingNode('h2')
                .setIndent(1)
                .append(
                  $createSuggestionNode(suggestionID, 'block-type-change', {
                    initialBlockType: 'number',
                    listInfo: {
                      listType: 'number',
                      listMarker: 'bracket',
                      listStyleType: 'upper-roman',
                    },
                  }),
                  $createTextNode('List item'),
                ),
            )
            $rejectSuggestion(suggestionID)
          },
          {
            discrete: true,
          },
        )
      })

      it('should revert first to paragraph', () => {
        editor.read(() => {
          const first = $getRoot().getChildAtIndex<ElementNode>(0)
          expect($isParagraphNode(first)).toBe(true)
        })
      })

      it('should revert second to h1', () => {
        editor.read(() => {
          const second = $getRoot().getChildAtIndex<HeadingNode>(1)
          expect($isHeadingNode(second)).toBe(true)
          expect(second?.getTag()).toBe('h1')
        })
      })

      it('should revert third to list', () => {
        editor.read(() => {
          const third = $getRoot().getChildAtIndex<CustomListNode>(2)
          expect($isListNode(third)).toBe(true)
          expect(third?.getListType()).toBe('number')
          expect(third?.getListStyleType()).toBe('upper-roman')
          expect(third?.getListMarker()).toBe('bracket')
        })
      })

      it('should remove suggestion nodes', () => {
        editor.read(() => {
          const root = $getRoot()
          const first = root.getFirstChildOrThrow<ElementNode>()
          expect(first.getChildrenSize()).toBe(0)
          const second = root.getChildAtIndex<HeadingNode>(1)!
          expect(second.getChildrenSize()).toBe(0)
          const third = root.getChildAtIndex<ListNode>(2)!
          expect(third.getChildrenSize()).toBe(1)
        })
      })

      it('should keep element format and indent', () => {
        editor.read(() => {
          const second = $getRoot().getChildAtIndex<HeadingNode>(1)!
          expect(second.getFormatType()).toBe('right')
          expect(second.getIndent()).toBe(1)
        })
      })

      it('should recover list nesting', () => {
        editor.read(() => {
          const third = $getRoot().getChildAtIndex<ListNode>(2)!
          expect(third.getChildrenSize()).toBe(1)
          const firstLI = third.getFirstChildOrThrow<ListItemNode>()
          expect($isListItemNode(firstLI)).toBe(true)
          expect(firstLI.getChildrenSize()).toBe(1)
          const nestedList = firstLI.getFirstChildOrThrow<ListNode>()
          expect($isListNode(nestedList)).toBe(true)
          expect(nestedList.getChildrenSize()).toBe(1)
          const nestedLI = nestedList.getFirstChildOrThrow<ListItemNode>()
          expect($isListItemNode(nestedLI)).toBe(true)
          expect(nestedLI.getIndent()).toBe(1)
          expect(nestedLI.getChildrenSize()).toBe(1)
        })
      })
    })
  })

  describe('clear-formatting', () => {
    beforeEach(() => {
      editor.update(
        () => {
          const root = $getRoot()
          root.clear()

          const text = $createTextNode('Hello world').setFormat('bold')
          const paragraph = $createParagraphNode().append(text)
          root.append(paragraph)

          const firstSelection = text.select(2, 5) // select 'llo'
          firstSelection.formatText('italic')
          expect(paragraph.getChildrenSize()).toBe(3)

          const lastTextNode = paragraph.getLastChildOrThrow<TextNode>()
          const secondSelection = lastTextNode.select(0, 3) // select ' wo'
          $patchStyleText(secondSelection, {
            color: '#fff',
          })
          expect(paragraph.getChildrenSize()).toBe(4)

          const firstNodeToSelect = paragraph.getChildAtIndex<TextNode>(1)!
          const lastNodeToSelect = paragraph.getChildAtIndex<TextNode>(2)!

          const selectionToSuggest = $createRangeSelection() // select 'llo wo'
          selectionToSuggest.anchor.set(firstNodeToSelect.__key, 0, 'text')
          selectionToSuggest.focus.set(lastNodeToSelect.__key, lastNodeToSelect.getTextContentSize(), 'text')
          $setSelection(selectionToSuggest)

          let suggestionID: string | undefined
          $clearFormattingAsSuggestion((id) => (suggestionID = id))

          if (!suggestionID) {
            throw new Error('Did not suggest')
          }

          $rejectSuggestion(suggestionID)
        },
        {
          discrete: true,
        },
      )
    })

    test('paragraph should have 4 children', () => {
      editor.read(() => {
        const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()
        expect(paragraph.getChildrenSize()).toBe(4)

        const first = paragraph.getChildAtIndex(0)!
        expect($isTextNode(first)).toBe(true)

        const second = paragraph.getChildAtIndex(1)!
        expect($isTextNode(second)).toBe(true)

        const third = paragraph.getChildAtIndex(2)!
        expect($isTextNode(third)).toBe(true)

        const fourth = paragraph.getChildAtIndex(3)!
        expect($isTextNode(fourth)).toBe(true)
      })
    })

    test('second node should have format and style set to original', () => {
      editor.read(() => {
        const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()

        const second = paragraph.getChildAtIndex<TextNode>(1)!
        expect(second.getFormat()).toBe(3)
        expect(second.getStyle()).toBe('')
      })
    })

    test('third node should have format and style set to original', () => {
      editor.read(() => {
        const paragraph = $getRoot().getFirstChildOrThrow<ParagraphNode>()

        const third = paragraph.getChildAtIndex<TextNode>(2)!
        expect(third.getFormat()).toBe(1)
        expect(third.getStyle()).toBe('color: #fff;')
      })
    })
  })

  describe('align-change', () => {
    beforeEach(() => {
      const suggestionID = Math.random().toString()

      editor.update(
        () => {
          $getRoot().append(
            $createParagraphNode()
              .setFormat('center')
              .append(
                $createSuggestionNode(suggestionID, 'align-change', {
                  initialFormatType: '',
                }),
              ),
            $createHeadingNode('h2')
              .setFormat('center')
              .append(
                $createSuggestionNode(suggestionID, 'align-change', {
                  initialFormatType: 'right',
                }),
              ),
          )
          $rejectSuggestion(suggestionID)
        },
        {
          discrete: true,
        },
      )
    })

    it('should revert format to original', () => {
      editor.read(() => {
        const root = $getRoot()
        const first = root.getFirstChildOrThrow<ElementNode>()
        expect(first.getFormatType()).toBe('')
        const last = root.getLastChildOrThrow<ElementNode>()
        expect(last.getFormatType()).toBe('right')
      })
    })

    it('should remove suggestion nodes', () => {
      editor.read(() => {
        const root = $getRoot()
        const first = root.getFirstChildOrThrow<ElementNode>()
        expect(first.getChildrenSize()).toBe(0)
        const last = root.getLastChildOrThrow<HeadingNode>()
        expect(last.getChildrenSize()).toBe(0)
      })
    })
  })
})
