import { TableCellHeaderStates } from '@lexical/table'

export type TableCellHeaderState = (typeof TableCellHeaderStates)[keyof typeof TableCellHeaderStates]

export function getHeaderState(
  currentState: TableCellHeaderState,
  possibleState: TableCellHeaderState,
): TableCellHeaderState {
  if (currentState === TableCellHeaderStates.BOTH || currentState === possibleState) {
    return possibleState
  }
  return TableCellHeaderStates.NO_STATUS
}
