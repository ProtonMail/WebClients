import type { CollaboratorCursorNavigationDestination } from '../Spreadsheet/public'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0
}

export function toCollaboratorCursorNavigationDestination(
  state: unknown,
): CollaboratorCursorNavigationDestination | undefined {
  if (!isRecord(state) || !isPositiveInteger(state.sheetId) || !isRecord(state.activeCell)) {
    return undefined
  }

  const { rowIndex, columnIndex } = state.activeCell
  if (!isPositiveInteger(rowIndex) || !isPositiveInteger(columnIndex)) {
    return undefined
  }

  return {
    sheetId: state.sheetId,
    rowIndex,
    columnIndex,
  }
}
