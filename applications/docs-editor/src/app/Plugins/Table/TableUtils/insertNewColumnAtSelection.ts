import type { TableRowNode } from '@lexical/table'
import type { TableCellNode } from '@lexical/table'
import { $insertTableColumn__EXPERIMENTAL, $isTableNode } from '@lexical/table'
import { $findMatchingParent } from '@lexical/utils'
import { $copySuggestionsOnColumnOperation } from './copySuggestionsOnColumnOperation'

/**
 * Inserts a new table column at current selection, and also
 * copies over any existing suggestion that should exist in the
 * new cells.
 * @returns first inserted table cell, if successful
 */
export function $insertTableColumnAtSelection(insertAfter: boolean): TableCellNode | null {
  const firstInsertedCell = $insertTableColumn__EXPERIMENTAL(insertAfter)
  if (firstInsertedCell) {
    const table = $findMatchingParent(firstInsertedCell, $isTableNode)
    if (table) {
      const cellIndex = firstInsertedCell.getIndexWithinParent()
      for (const row of table.getChildren<TableRowNode>()) {
        const cellAtIndex = row.getChildAtIndex<TableCellNode>(cellIndex)
        if (!cellAtIndex) {
          continue
        }
        const sibling = cellAtIndex.getPreviousSibling<TableCellNode>() || cellAtIndex.getNextSibling<TableCellNode>()
        if (!sibling) {
          continue
        }
        $copySuggestionsOnColumnOperation(cellAtIndex, sibling)
      }
    }
  }
  return firstInsertedCell
}
