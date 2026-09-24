import { $isTableRowNode, type TableNode } from '@lexical/table'
import { $getRoot } from 'lexical'

/**
 * Cleans up the given table, by removing any rows that don't have
 * any cells and if the table is empty at the end, removing the table.
 */
export function $cleanupTableIfEmpty(table: TableNode): boolean {
  const children = table.getChildren()
  for (const row of children) {
    if (!$isTableRowNode(row)) {
      row.remove()
      continue
    }
    if (row.isEmpty()) {
      row.remove()
    }
  }
  if (table.isEmpty()) {
    const prevSibling = table.getPreviousSibling()
    const nextSibling = table.getNextSibling()
    table.remove()
    if (prevSibling) {
      prevSibling.selectEnd()
    } else if (nextSibling) {
      nextSibling.selectStart()
    } else {
      $getRoot().selectEnd()
    }
    return true
  }
  return false
}
