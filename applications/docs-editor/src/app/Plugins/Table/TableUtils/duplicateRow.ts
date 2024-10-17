import { $generateJSONFromSelectedNodes, $generateNodesFromSerializedNodes } from '@lexical/clipboard'
import type { TableCellNode, TableRowNode } from '@lexical/table'
import { $createTableSelection, $isTableNode } from '@lexical/table'
import type { LexicalEditor } from 'lexical'
import { $copySuggestionsOnRowOperation } from './copySuggestionsOnRowOperation'

/**
 * Duplicates the given table row, and also copies over any existing suggestion
 * that should exist in the new cells.
 * @returns duplicated table row, if successful
 */
export function $generateDuplicatedRow(editor: LexicalEditor, rowNode: TableRowNode) {
  const row = rowNode.getLatest()
  const table = row.getParent()
  const tableSelection = $createTableSelection()
  const firstCell = row.getFirstChild<TableCellNode>()
  const lastCell = row.getLastChild<TableCellNode>()
  if (!table || !firstCell || !lastCell) {
    return null
  }
  tableSelection.set(table.getKey(), firstCell.getKey(), lastCell.getKey())
  const tableJSON = $generateJSONFromSelectedNodes(editor, tableSelection)
  const duplicatedTable = $generateNodesFromSerializedNodes(tableJSON.nodes)[0]
  if (!$isTableNode(duplicatedTable)) {
    return null
  }
  const duplicatedRow = duplicatedTable.getFirstChild<TableRowNode>()
  if (duplicatedRow) {
    const duplicatedChildren = duplicatedRow.getChildren<TableCellNode>()
    const originalChildren = row.getChildren<TableCellNode>()
    for (let index = 0; index < duplicatedChildren.length; index++) {
      const duplicatedCell = duplicatedChildren[index]
      const originalCell = originalChildren[index]
      if (!originalCell) {
        throw new Error('Expected original cell to exist at index')
      }
      $copySuggestionsOnRowOperation(duplicatedCell, originalCell)
    }
  }
  return duplicatedRow
}

export function duplicateRow(editor: LexicalEditor, rowNode: TableRowNode) {
  editor.update(
    () => {
      const row = rowNode.getLatest()
      const duplicatedRow = $generateDuplicatedRow(editor, row)
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
