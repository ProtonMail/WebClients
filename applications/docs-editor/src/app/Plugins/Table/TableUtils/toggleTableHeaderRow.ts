import { TableCellNode, TableNode, TableRowNode } from '@lexical/table'
import { LexicalEditor } from 'lexical'
import { isCellHeaderRow } from './isCellHeaderRow'
import { isCellHeaderColumn } from './isCellHeaderColumn'
import { calculateHeaderCellState } from './calculateHeaderCellState'

export function toggleTableHeaderRow(editor: LexicalEditor, tableNode: TableNode) {
  editor.update(() => {
    const table = tableNode.getLatest()
    const firstRow = table.getFirstChild<TableRowNode>()
    if (!firstRow) {
      return
    }
    const cells = firstRow.getChildren<TableCellNode>()
    for (const cell of cells) {
      const isHeaderRow = isCellHeaderRow(cell)
      const isHeaderColumn = isCellHeaderColumn(cell)
      if (isHeaderRow && isHeaderColumn) {
        cell.setHeaderStyles(calculateHeaderCellState(false, true))
        continue
      }
      cell.setHeaderStyles(calculateHeaderCellState(!isHeaderRow, isHeaderColumn))
    }
  })
}
