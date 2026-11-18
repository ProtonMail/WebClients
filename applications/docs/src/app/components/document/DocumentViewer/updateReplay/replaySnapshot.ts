/**
 * The shape of `editorController.getLocalSpreadsheetStateJSON()` that the update replay tool relies on.
 * Only the fields read by the replay tool are typed; the rest is carried through untouched.
 */
export type ReplaySnapshot = {
  sheets?: ReplaySheet[]
  sheetData?: Record<string, (ReplayRow | null)[] | undefined>
  sharedStrings?: Record<string, unknown>
  cellXfs?: Record<string, unknown>
  [key: string]: unknown
}

type ReplaySheet = {
  sheetId: number
  title?: string
  rowCount?: number
  columnCount?: number
  [key: string]: unknown
}

export type ReplayRow = {
  values?: (ReplayCell | null)[]
  [key: string]: unknown
}

export type ReplayCell = {
  ss?: string | number | null
  ue?: ReplayExtendedValue | null
  userEnteredValue?: ReplayExtendedValue | null
  fv?: string | null
  formattedValue?: string | null
  uf?: unknown
  userEnteredFormat?: unknown
  ef?: unknown
  effectiveFormat?: unknown
  [key: string]: unknown
}

type ReplayExtendedValue = {
  nv?: number | null
  numberValue?: number | null
  sv?: string | null
  stringValue?: string | null
  bv?: boolean | null
  boolValue?: boolean | null
  fv?: string | null
  formulaValue?: string | null
  ev?: { message?: string | null; type?: string | null } | null
  errorValue?: { message?: string | null; type?: string | null } | null
}

export type CellAddress = {
  sheetId: number
  rowIndex: number
  columnIndex: number
}

export function getCellKey({ sheetId, rowIndex, columnIndex }: CellAddress): string {
  return `${sheetId}:${rowIndex}:${columnIndex}`
}

export function getCell(snapshot: ReplaySnapshot, { sheetId, rowIndex, columnIndex }: CellAddress): ReplayCell | null {
  return snapshot.sheetData?.[sheetId]?.[rowIndex]?.values?.[columnIndex] ?? null
}

/** rowsncolumns reserves row 0 and column 0 for headers, so A1 is `{ rowIndex: 1, columnIndex: 1 }`. */
export function getCellLabel({ rowIndex, columnIndex }: Pick<CellAddress, 'rowIndex' | 'columnIndex'>): string {
  let column = ''
  let remaining = columnIndex
  while (remaining > 0) {
    const letterIndex = (remaining - 1) % 26
    column = String.fromCharCode(65 + letterIndex) + column
    remaining = Math.floor((remaining - 1) / 26)
  }
  return `${column}${rowIndex}`
}

export function getSheetTitle(snapshot: ReplaySnapshot, sheetId: number): string {
  return snapshot.sheets?.find((sheet) => sheet.sheetId === sheetId)?.title ?? `Sheet ${sheetId}`
}

/** The text a user would see in the cell, falling back to the entered value when no formatted value is stored. */
export function getCellDisplayText(cell: ReplayCell | null, sharedStrings: ReplaySnapshot['sharedStrings']): string {
  if (!cell) {
    return ''
  }
  const formattedValue = cell.fv ?? cell.formattedValue
  if (typeof formattedValue === 'string') {
    return formattedValue
  }
  if (cell.ss !== undefined && cell.ss !== null) {
    return getSharedStringText(sharedStrings?.[String(cell.ss)]) ?? ''
  }
  return getExtendedValueText(cell.ue ?? cell.userEnteredValue)
}

function getSharedStringText(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value
  }
  if (value && typeof value === 'object' && 'text' in value && typeof value.text === 'string') {
    return value.text
  }
  return undefined
}

function getExtendedValueText(value: ReplayExtendedValue | null | undefined): string {
  if (!value) {
    return ''
  }
  const formula = value.fv ?? value.formulaValue
  if (formula) {
    return formula
  }
  const text = value.sv ?? value.stringValue
  if (text !== undefined && text !== null) {
    return text
  }
  const number = value.nv ?? value.numberValue
  if (number !== undefined && number !== null) {
    return String(number)
  }
  const bool = value.bv ?? value.boolValue
  if (bool !== undefined && bool !== null) {
    return bool ? 'TRUE' : 'FALSE'
  }
  const error = value.ev ?? value.errorValue
  return error?.message ?? error?.type ?? ''
}
