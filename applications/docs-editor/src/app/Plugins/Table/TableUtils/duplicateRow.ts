import { $generateJSONFromSelectedNodes, $generateNodesFromSerializedNodes } from '@lexical/clipboard'
import type { TableCellNode, TableRowNode } from '@lexical/table'
import { $createTableSelection, $isTableNode } from '@lexical/table'
import type { LexicalEditor } from 'lexical'

export function duplicateRow(editor: LexicalEditor, rowNode: TableRowNode) {
  editor.update(
    () => {
      const row = rowNode.getLatest()
      const table = row.getParent()
      const tableSelection = $createTableSelection()
      const firstCell = row.getFirstChild<TableCellNode>()
      const lastCell = row.getLastChild<TableCellNode>()
      if (!table || !firstCell || !lastCell) {
        return
      }
      tableSelection.set(table.getKey(), firstCell.getKey(), lastCell.getKey())
      const tableJSON = $generateJSONFromSelectedNodes(editor, tableSelection)
      const duplicatedTable = $generateNodesFromSerializedNodes(tableJSON.nodes)[0]
      if (!$isTableNode(duplicatedTable)) {
        return
      }
      const duplicatedRow = duplicatedTable.getFirstChild<TableRowNode>()
      if (!duplicatedRow) {
        return
      }
      row.insertAfter(duplicatedRow)
      duplicatedRow.getFirstChild()?.selectStart()
    },
    {
      onUpdate: () => editor.focus(),
    },
  )
}
