import { $isTableRowNode, type TableNode } from '@lexical/table'

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
    table.remove()
    return true
  }
  return false
}
