import type { TableCellNode, TableRowNode } from '@lexical/table'
import { $getTableColumnIndexFromTableCellNode, $isTableNode } from '@lexical/table'
import { $findMatchingParent } from '@lexical/utils'
import type { LexicalEditor } from 'lexical'
import { $createRangeSelection, $setSelection } from 'lexical'

export function $selectColumn(cellNode: TableCellNode) {
  const index = $getTableColumnIndexFromTableCellNode(cellNode)
  const table = $findMatchingParent(cellNode, $isTableNode)
  const firstRow = table?.getFirstChild<TableRowNode>()
  const firstCell = firstRow?.getChildAtIndex(index)
  const lastRow = table?.getLastChild<TableRowNode>()
  const lastCell = lastRow?.getChildAtIndex(index)
  if (!firstCell || !lastCell) {
    return
  }
  const selection = $createRangeSelection()
  selection.anchor.set(firstCell.getKey(), 0, 'element')
  selection.focus.set(lastCell.getKey(), 0, 'element')
  $setSelection(selection)
}

export function selectColumn(editor: LexicalEditor, cellNode: TableCellNode) {
  editor.update(() => {
    $selectColumn(cellNode)
  })
}
