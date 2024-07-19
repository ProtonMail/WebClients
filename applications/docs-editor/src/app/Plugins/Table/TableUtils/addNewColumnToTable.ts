import type { TableNode, TableRowNode } from '@lexical/table'
import { $getElementForTableNode, $insertTableColumn } from '@lexical/table'
import type { LexicalEditor } from 'lexical'

export function addNewColumnToTable(editor: LexicalEditor, tableNode: TableNode) {
  editor.update(() => {
    const table = tableNode.getLatest()
    const firstRow = table.getFirstChild<TableRowNode>()
    if (!firstRow) {
      return
    }
    const columnCount = firstRow.getChildrenSize()
    $insertTableColumn(table, columnCount - 1, true, 1, $getElementForTableNode(editor, table))
  })
}
