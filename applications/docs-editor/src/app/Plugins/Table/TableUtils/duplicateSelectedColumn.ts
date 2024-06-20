import { $generateJSONFromSelectedNodes, $generateNodesFromSerializedNodes } from '@lexical/clipboard'
import {
  $getTableColumnIndexFromTableCellNode,
  $isTableCellNode,
  $isTableNode,
  $isTableSelection,
  TableCellNode,
  TableRowNode,
} from '@lexical/table'
import { $findMatchingParent } from '@lexical/utils'
import { $getSelection, LexicalEditor } from 'lexical'

export function duplicateSelectedColumn(editor: LexicalEditor, cellNode: TableCellNode) {
  editor.update(
    () => {
      const selection = $getSelection()
      if (!$isTableSelection(selection)) {
        return
      }
      const cellIndex = $getTableColumnIndexFromTableCellNode(cellNode)
      const originalTable = $findMatchingParent(cellNode, $isTableNode)
      const json = $generateJSONFromSelectedNodes(editor, selection)
      const nodes = $generateNodesFromSerializedNodes(json.nodes)
      const duplicatedTable = nodes.find($isTableNode)
      if (!originalTable || !$isTableNode(duplicatedTable)) {
        return
      }
      const rows = originalTable?.getChildren<TableRowNode>()
      let firstInsertedCell: TableCellNode | undefined
      rows.forEach((row, index) => {
        const cell = row.getChildAtIndex(cellIndex)
        if (!cell) {
          return
        }

        const duplicatedRow = duplicatedTable?.getChildAtIndex<TableRowNode>(index)
        const duplicatedCell = duplicatedRow?.getFirstChild()
        if (!$isTableCellNode(duplicatedCell)) {
          return
        }

        cell.insertAfter(duplicatedCell)
        if (!firstInsertedCell) {
          firstInsertedCell = duplicatedCell
        }
      })
      if (firstInsertedCell) {
        firstInsertedCell.selectStart()
      }
    },
    {
      onUpdate: () => editor.focus(),
    },
  )
}
