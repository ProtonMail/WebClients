import { $getTableColumnIndexFromTableCellNode, $isTableNode, TableCellNode, TableRowNode } from '@lexical/table'
import { $findMatchingParent } from '@lexical/utils'
import { $createRangeSelection, $setSelection, LexicalEditor } from 'lexical'

export function selectColumn(editor: LexicalEditor, cellNode: TableCellNode) {
  editor.update(() => {
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
  })
}
