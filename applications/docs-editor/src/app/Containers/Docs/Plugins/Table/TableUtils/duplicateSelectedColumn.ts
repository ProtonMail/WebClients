import { $generateJSONFromSelectedNodes, $generateNodesFromSerializedNodes } from '@lexical/clipboard'
import type { TableCellNode, TableRowNode } from '@lexical/table'
import { $createTableSelection } from '@lexical/table'
import { $isTableNode } from '@lexical/table'
import { $findMatchingParent } from '@lexical/utils'
import type { LexicalEditor } from 'lexical'
import { $copySuggestionsOnColumnOperation } from './copySuggestionsOnColumnOperation'
import { $moveSelectionToCell } from './moveSelectionToCell'

type DuplicatedColumn = {
  index: number
  cells: TableCellNode[]
}

/**
 * Duplicates a column of cells, and copies any existing suggestions
 * @returns the index of the original column and an array of duplicated cells
 */
export function $generateDuplicatedColumn(editor: LexicalEditor, cellNode: TableCellNode): DuplicatedColumn {
  const cellIndex = cellNode.getIndexWithinParent()
  const cells: TableCellNode[] = []

  const table = $findMatchingParent(cellNode, $isTableNode)
  if (!table) {
    throw new Error('Expected cell to have table parent')
  }

  const tableKey = table.getKey()

  for (const row of table.getChildren<TableRowNode>()) {
    const cellAtIndex = row.getChildAtIndex<TableCellNode>(cellIndex)
    if (!cellAtIndex) {
      throw new Error('No cell found at index')
    }
    const cellAtIndexKey = cellAtIndex.getKey()
    const selection = $createTableSelection()
    selection.set(tableKey, cellAtIndexKey, cellAtIndexKey)
    const json = $generateJSONFromSelectedNodes(editor, selection)
    const nodes = $generateNodesFromSerializedNodes(json.nodes)
    const duplicatedCell = nodes
      .find($isTableNode)
      ?.getFirstChildOrThrow<TableRowNode>()
      .getFirstChildOrThrow<TableCellNode>()
    if (!duplicatedCell) {
      continue
    }
    $copySuggestionsOnColumnOperation(duplicatedCell, cellAtIndex)
    cells.push(duplicatedCell)
  }

  return {
    index: cellIndex,
    cells,
  }
}

export function duplicateSelectedColumn(editor: LexicalEditor, cellNode: TableCellNode) {
  editor.update(
    () => {
      const originalTable = $findMatchingParent(cellNode, $isTableNode)
      if (!originalTable) {
        return
      }
      const rows = originalTable.getChildren<TableRowNode>()
      const { index, cells: duplicatedCells } = $generateDuplicatedColumn(editor, cellNode)
      let firstInsertedCell: TableCellNode | undefined
      for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
        const row = rows[rowIndex]
        const cell = row.getChildAtIndex(index)
        if (!cell) {
          throw new Error('Could not find cell at index')
        }

        const duplicatedCell = duplicatedCells[rowIndex]
        if (!duplicatedCell) {
          continue
        }
        cell.insertAfter(duplicatedCell)

        if (!firstInsertedCell) {
          firstInsertedCell = duplicatedCell
        }
      }
      if (firstInsertedCell) {
        $moveSelectionToCell(firstInsertedCell)
      }
    },
    {
      onUpdate: () => editor.focus(),
    },
  )
}
