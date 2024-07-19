import type { TableCellNode } from '@lexical/table'
import { TableCellHeaderStates } from '@lexical/table'

export function isCellHeaderRow(cell: TableCellNode) {
  const headerState = cell.getHeaderStyles()
  return (headerState & TableCellHeaderStates.ROW) === TableCellHeaderStates.ROW
}
