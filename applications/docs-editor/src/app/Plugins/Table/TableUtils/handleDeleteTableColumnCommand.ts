import type { TableCellNode } from '@lexical/table'
import { $deleteTableColumn, $isTableNode } from '@lexical/table'
import { $findMatchingParent } from '@lexical/utils'
import { $cleanupTableIfEmpty } from './cleanupTableIfEmpty'

/**
 * Deletes the given table column, moves the selection to a sibling if
 * available, and cleans up table if necessary.
 */
export function $handleDeleteTableColumnCommand(cell: TableCellNode): boolean {
  const table = $findMatchingParent(cell, $isTableNode)
  if (!table) {
    return false
  }
  const sibling = cell.getPreviousSibling() || cell.getNextSibling()
  if (sibling) {
    sibling.selectStart()
  }
  const cellIndex = cell.getIndexWithinParent()
  $deleteTableColumn(table, cellIndex)
  $cleanupTableIfEmpty(table)
  return true
}
