import type { TableCellNode } from '@lexical/table'
import type { TableRowNode } from '@lexical/table'
import { $insertTableRow__EXPERIMENTAL } from '@lexical/table'
import { $copySuggestionsOnRowOperation } from './copySuggestionsOnRowOperation'

/**
 * Inserts a new table row at current selection, and also
 * copies over any existing suggestion that should exist in the
 * new cells.
 * @returns inserted table row, if successful
 */
export function $insertTableRowAtSelection(insertAfter: boolean): TableRowNode | null {
  const insertedRow = $insertTableRow__EXPERIMENTAL(insertAfter)
  if (insertedRow) {
    const cells = insertedRow.getChildren<TableCellNode>()
    const sibling = insertAfter
      ? insertedRow.getPreviousSibling<TableRowNode>()
      : insertedRow.getNextSibling<TableRowNode>()
    if (sibling) {
      for (const cell of cells) {
        const cellIndex = cell.getIndexWithinParent()
        const siblingCell = sibling.getChildAtIndex<TableCellNode>(cellIndex)
        if (!siblingCell) {
          continue
        }
        $copySuggestionsOnRowOperation(cell, siblingCell)
      }
    }
  }
  return insertedRow
}
