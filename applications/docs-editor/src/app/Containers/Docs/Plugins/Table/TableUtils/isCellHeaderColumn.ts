import type { TableCellNode } from '@lexical/table'
import { TableCellHeaderStates } from '@lexical/table'

export function isCellHeaderColumn(cell: TableCellNode) {
  const headerState = cell.getHeaderStyles()
  return (headerState & TableCellHeaderStates.COLUMN) === TableCellHeaderStates.COLUMN
}
