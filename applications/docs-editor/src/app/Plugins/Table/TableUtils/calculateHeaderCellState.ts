import { TableCellHeaderStates } from '@lexical/table'

export function calculateHeaderCellState(row: boolean, column: boolean) {
  let headerState = TableCellHeaderStates.NO_STATUS
  if (row) {
    headerState |= TableCellHeaderStates.ROW
  }
  if (column) {
    headerState |= TableCellHeaderStates.COLUMN
  }
  return headerState
}
