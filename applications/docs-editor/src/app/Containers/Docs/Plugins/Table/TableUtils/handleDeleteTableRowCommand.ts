import { $isTableNode, type TableRowNode } from '@lexical/table'
import { $cleanupTableIfEmpty } from './cleanupTableIfEmpty'

/**
 * Deletes the given row, selects a sibling row if available
 * and cleans up table if needed.
 */
export function $handleDeleteTableRowCommand(row: TableRowNode): boolean {
  const sibling = row.getPreviousSibling() || row.getNextSibling()
  if (sibling) {
    sibling.selectStart()
  }
  const table = row.getParent()
  row.remove()
  if ($isTableNode(table)) {
    $cleanupTableIfEmpty(table)
  }
  return true
}
