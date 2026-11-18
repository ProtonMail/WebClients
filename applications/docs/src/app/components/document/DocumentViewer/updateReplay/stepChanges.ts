import type { CellAddress, ReplayCell, ReplayRow, ReplaySnapshot } from './replaySnapshot'
import { getCell, getCellDisplayText, getCellKey } from './replaySnapshot'

type CellChangeKind = 'added' | 'deleted' | 'modified'

export type CellChange = CellAddress & {
  kind: CellChangeKind
  valueChanged: boolean
  formatChanged: boolean
  textBefore: string
  textAfter: string
}

/** What one replayed update changed, found by comparing the snapshots taken before and after it. */
export type StepChanges = {
  cellChanges: CellChange[]
  changedCellKeys: Set<string>
  /** Sheets that were removed, or whose row or column count changed. Cell positions on them may have shifted. */
  structurallyChangedSheetIds: Set<number>
  /** Top-level state keys other than cell data that changed (`tables`, `charts`, `sheets`...). */
  otherChangedKeys: string[]
}

export const NO_STEP_CHANGES: StepChanges = {
  cellChanges: [],
  changedCellKeys: new Set(),
  structurallyChangedSheetIds: new Set(),
  otherChangedKeys: [],
}

/** Calculated or bookkeeping fields: they change on recalculation without the user changing the cell. */
const DERIVED_CELL_KEYS = new Set([
  'ev',
  'effectiveValue',
  'fv',
  'formattedValue',
  'conditionalFormattingResultById',
  'dataValidationResult',
  'version',
  'updatedAt',
])

const VALUE_CELL_KEYS = new Set(['ue', 'userEnteredValue', 'ss'])

const STYLE_REFERENCE_CELL_KEYS = new Set(['uf', 'userEnteredFormat', 'ef', 'effectiveFormat'])

const CELL_STATE_KEYS = new Set(['sheetData', 'sharedStrings', 'cellXfs'])

export function getStepChanges(previous: ReplaySnapshot, next: ReplaySnapshot): StepChanges {
  const cellChanges = getCellChanges(previous, next)
  return {
    cellChanges,
    changedCellKeys: new Set(cellChanges.map(getCellKey)),
    structurallyChangedSheetIds: getStructurallyChangedSheetIds(previous, next),
    otherChangedKeys: getOtherChangedKeys(previous, next),
  }
}

function getCellChanges(previous: ReplaySnapshot, next: ReplaySnapshot): CellChange[] {
  const changes: CellChange[] = []
  const changedSharedStringIds = getChangedEntryIds(previous.sharedStrings, next.sharedStrings)
  const changedStyleIds = getChangedEntryIds(previous.cellXfs, next.cellXfs)
  const sheetIds = new Set([...Object.keys(previous.sheetData ?? {}), ...Object.keys(next.sheetData ?? {})])
  for (const sheetIdKey of sheetIds) {
    const sheetId = Number(sheetIdKey)
    const previousRows = previous.sheetData?.[sheetIdKey] ?? []
    const nextRows = next.sheetData?.[sheetIdKey] ?? []
    const rowCount = Math.max(previousRows.length, nextRows.length)
    for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
      const previousRow = previousRows[rowIndex]
      const nextRow = nextRows[rowIndex]
      if (
        previousRow &&
        nextRow &&
        getRowJSON(previousRow) === getRowJSON(nextRow) &&
        !referencesChangedEntry(nextRow, changedSharedStringIds, changedStyleIds)
      ) {
        continue
      }
      const previousValues = previousRow?.values ?? []
      const nextValues = nextRow?.values ?? []
      const columnCount = Math.max(previousValues.length, nextValues.length)
      for (let columnIndex = 0; columnIndex < columnCount; columnIndex++) {
        const change = getCellChange(
          { sheetId, rowIndex, columnIndex },
          { cell: previousValues[columnIndex] ?? null, snapshot: previous },
          { cell: nextValues[columnIndex] ?? null, snapshot: next },
        )
        if (change) {
          changes.push(change)
        }
      }
    }
  }
  return changes
}

/**
 * Comparing every cell of every step is slow on big sheets (about 100 ms per step at 50,000 cells), and most rows
 * don't change. Rows are compared as JSON first, which can only say "unchanged" when the text is identical, so a
 * row whose keys come in another order still goes through the cell comparison. Each snapshot is compared twice (as
 * the next, then as the previous step), so the JSON is cached on the row objects.
 */
const rowJSONCache = new WeakMap<ReplayRow, string>()

function getRowJSON(row: ReplayRow): string {
  let json = rowJSONCache.get(row)
  if (json === undefined) {
    json = JSON.stringify(row)
    rowJSONCache.set(row, json)
  }
  return json
}

/** Ids whose content differs between the two tables. A row with identical JSON can still change through these. */
function getChangedEntryIds(
  previous: Record<string, unknown> | undefined,
  next: Record<string, unknown> | undefined,
): Set<string> {
  const changed = new Set<string>()
  for (const id of new Set([...Object.keys(previous ?? {}), ...Object.keys(next ?? {})])) {
    const previousEntry = previous?.[id]
    const nextEntry = next?.[id]
    if (previousEntry !== nextEntry && stableStringify(previousEntry) !== stableStringify(nextEntry)) {
      changed.add(id)
    }
  }
  return changed
}

function referencesChangedEntry(row: ReplayRow, changedSharedStringIds: Set<string>, changedStyleIds: Set<string>) {
  if (changedSharedStringIds.size === 0 && changedStyleIds.size === 0) {
    return false
  }
  for (const cell of row.values ?? []) {
    if (!cell) {
      continue
    }
    if (cell.ss !== undefined && cell.ss !== null && changedSharedStringIds.has(String(cell.ss))) {
      return true
    }
    for (const key of STYLE_REFERENCE_CELL_KEYS) {
      const format = cell[key]
      if (format && typeof format === 'object' && 'sid' in format && changedStyleIds.has(String(format.sid))) {
        return true
      }
    }
  }
  return false
}

type CellInSnapshot = { cell: ReplayCell | null; snapshot: ReplaySnapshot }

export function getCellChangeBetween(
  address: CellAddress,
  previous: ReplaySnapshot,
  next: ReplaySnapshot,
): CellChange | null {
  return getCellChange(
    address,
    { cell: getCell(previous, address), snapshot: previous },
    { cell: getCell(next, address), snapshot: next },
  )
}

function getCellChange(address: CellAddress, before: CellInSnapshot, after: CellInSnapshot): CellChange | null {
  const beforeParts = getComparableCellParts(before)
  const afterParts = getComparableCellParts(after)
  const valueChanged = beforeParts.value !== afterParts.value
  const formatChanged = beforeParts.other !== afterParts.other
  if (!valueChanged && !formatChanged) {
    return null
  }
  let kind: CellChangeKind = 'modified'
  if (beforeParts.isEmpty) {
    kind = 'added'
  } else if (afterParts.isEmpty) {
    kind = 'deleted'
  }
  return {
    sheetId: address.sheetId,
    rowIndex: address.rowIndex,
    columnIndex: address.columnIndex,
    kind,
    valueChanged,
    formatChanged,
    textBefore: getCellDisplayText(before.cell, before.snapshot.sharedStrings),
    textAfter: getCellDisplayText(after.cell, after.snapshot.sharedStrings),
  }
}

/**
 * Splits a cell into its value and everything else, as stable strings. Shared string and style references are
 * resolved against their own snapshot, because the same id can point to different content in two snapshots.
 */
function getComparableCellParts({ cell, snapshot }: CellInSnapshot): {
  value: string
  other: string
  isEmpty: boolean
} {
  const value: Record<string, unknown> = {}
  const other: Record<string, unknown> = {}
  for (const [key, fieldValue] of Object.entries(cell ?? {})) {
    if (DERIVED_CELL_KEYS.has(key) || fieldValue === null || fieldValue === undefined) {
      continue
    }
    if (key === 'ss') {
      value.ss = snapshot.sharedStrings?.[String(fieldValue)] ?? null
    } else if (VALUE_CELL_KEYS.has(key)) {
      value[key] = fieldValue
    } else if (STYLE_REFERENCE_CELL_KEYS.has(key)) {
      other[key] = resolveStyleReference(fieldValue, snapshot.cellXfs)
    } else {
      other[key] = fieldValue
    }
  }
  return {
    value: stableStringify(value),
    other: stableStringify(other),
    isEmpty: Object.keys(value).length === 0 && Object.keys(other).length === 0,
  }
}

function resolveStyleReference(format: unknown, cellXfs: ReplaySnapshot['cellXfs']): unknown {
  if (!format || typeof format !== 'object' || !('sid' in format) || typeof format.sid !== 'string') {
    return format
  }
  const { sid, ...rest } = format
  return { ...rest, resolvedStyle: cellXfs?.[sid] ?? { missingStyleId: sid } }
}

function getStructurallyChangedSheetIds(previous: ReplaySnapshot, next: ReplaySnapshot): Set<number> {
  const changed = new Set<number>()
  for (const previousSheet of previous.sheets ?? []) {
    const nextSheet = next.sheets?.find((sheet) => sheet.sheetId === previousSheet.sheetId)
    if (
      !nextSheet ||
      nextSheet.rowCount !== previousSheet.rowCount ||
      nextSheet.columnCount !== previousSheet.columnCount
    ) {
      changed.add(previousSheet.sheetId)
    }
  }
  return changed
}

function getOtherChangedKeys(previous: ReplaySnapshot, next: ReplaySnapshot): string[] {
  const keys = new Set([...Object.keys(previous), ...Object.keys(next)])
  return [...keys]
    .filter((key) => !CELL_STATE_KEYS.has(key))
    .filter((key) => stableStringify(previous[key]) !== stableStringify(next[key]))
    .sort()
}

export function stableStringify(value: unknown): string {
  return JSON.stringify(value, (_key, nestedValue: unknown) => {
    if (!nestedValue || typeof nestedValue !== 'object' || Array.isArray(nestedValue)) {
      return nestedValue
    }
    return Object.fromEntries(Object.entries(nestedValue).sort(([a], [b]) => a.localeCompare(b)))
  })
}
