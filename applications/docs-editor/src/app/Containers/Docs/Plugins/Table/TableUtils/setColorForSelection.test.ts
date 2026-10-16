import { createHeadlessEditor } from '@lexical/headless'
import { getStyleObjectFromCSS } from '@lexical/selection'
import type { TableCellNode, TableNode, TableRowNode } from '@lexical/table'
import { $createTableSelection } from '@lexical/table'
import type { ParagraphNode, TextNode } from 'lexical'
import { $createTextNode, $getRoot, $setSelection } from 'lexical'
import { AllNodes } from '../../../AllNodes'
import { $createTableNodeWithDimensions } from '../CreateTableNodeWithDimensions'
import { setColorForSelection } from './setColorForSelection'

describe('setColorForSelection', () => {
  const editor = createHeadlessEditor({
    namespace: 'test',
    nodes: AllNodes,
    onError: (error) => {
      throw error
    },
  })
  editor.getRootElement = jest.fn()
  editor.focus = jest.fn()

  function getCellParagraph(table: TableNode, rowIndex: number, columnIndex: number) {
    const row = table.getChildAtIndex<TableRowNode>(rowIndex)!
    const cell = row.getChildAtIndex<TableCellNode>(columnIndex)!
    return cell.getFirstChildOrThrow<ParagraphNode>()
  }

  function getColor(css: string) {
    return getStyleObjectFromCSS(css).color
  }

  beforeEach(() => {
    editor.update(
      () => {
        $getRoot().clear().append($createTableNodeWithDimensions(2, 2))
      },
      { discrete: true },
    )
    editor.update(
      () => {
        const table = $getRoot().getFirstChildOrThrow<TableNode>()
        getCellParagraph(table, 0, 1).append($createTextNode('Existing'))
        const firstRow = table.getFirstChildOrThrow<TableRowNode>()
        const selection = $createTableSelection()
        selection.set(
          table.getKey(),
          firstRow.getFirstChildOrThrow<TableCellNode>().getKey(),
          firstRow.getLastChildOrThrow<TableCellNode>().getKey(),
        )
        $setSelection(selection)
      },
      { discrete: true },
    )
  })

  it('gives empty cells in the selection the text color for text typed later', () => {
    setColorForSelection(editor, 'rgb(255, 255, 255)')

    editor.read(() => {
      const table = $getRoot().getFirstChildOrThrow<TableNode>()
      const emptyParagraph = getCellParagraph(table, 0, 0)
      expect(emptyParagraph.isEmpty()).toBe(true)
      expect(getColor(emptyParagraph.getTextStyle())).toBe('rgb(255, 255, 255)')
    })
  })

  it('still colors existing text and leaves cells outside the selection alone', () => {
    setColorForSelection(editor, 'rgb(255, 255, 255)')

    editor.read(() => {
      const table = $getRoot().getFirstChildOrThrow<TableNode>()
      const text = getCellParagraph(table, 0, 1).getFirstChildOrThrow<TextNode>()
      expect(getColor(text.getStyle())).toBe('rgb(255, 255, 255)')
      expect(getColor(getCellParagraph(table, 1, 0).getTextStyle())).toBeUndefined()
    })
  })

  it('removes the text color from empty cells when reset', () => {
    setColorForSelection(editor, 'rgb(255, 255, 255)')
    setColorForSelection(editor, null)

    editor.read(() => {
      const table = $getRoot().getFirstChildOrThrow<TableNode>()
      expect(getColor(getCellParagraph(table, 0, 0).getTextStyle())).toBeUndefined()
    })
  })
})
