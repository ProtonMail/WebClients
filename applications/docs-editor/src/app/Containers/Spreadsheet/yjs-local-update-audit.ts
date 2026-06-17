import type { CellXfs, SharedStrings, SheetData } from '@rowsncolumns/spreadsheet-state'
import type {
  CellData,
  ConditionalFormatRule,
  DataValidationRuleRecord,
  EmbeddedChart,
  EmbeddedObject,
  NamedRange,
  ProtectedRange,
  Sheet,
  TableView,
} from '@rowsncolumns/spreadsheet'
import type { Doc as YDoc } from 'yjs'

export type SpreadsheetLocalYjsUpdateAuditState = {
  sheets: Sheet[]
  sheetData: SheetData<CellData>
  tables: TableView[]
  namedRanges: NamedRange[]
  conditionalFormats: ConditionalFormatRule[]
  embeds: EmbeddedObject[]
  dataValidations: DataValidationRuleRecord[]
  charts: EmbeddedChart[]
  protectedRanges: ProtectedRange[]
  cellXfs: CellXfs | null | undefined
  sharedStrings: SharedStrings
}

export const SPREADSHEET_LOCAL_YJS_AUDIT_KEYS = [
  'sheets',
  'sheetData',
  'tables',
  'namedRanges',
  'conditionalFormats',
  'embeds',
  'dataValidations',
  'charts',
  'protectedRanges',
  'cellXfs',
  'sharedStrings',
] as const satisfies (keyof SpreadsheetLocalYjsUpdateAuditState)[]

export type SpreadsheetLocalYjsAuditKey = (typeof SPREADSHEET_LOCAL_YJS_AUDIT_KEYS)[number]

export type SpreadsheetLocalYjsUpdateAuditDifference = {
  key: SpreadsheetLocalYjsAuditKey
  reason: 'local-differs-from-yjs' | 'local-change-not-observed-by-yjs'
  localValue: unknown
  yjsValue: unknown
}

export type SpreadsheetLocalYjsUpdateAuditResult = {
  differences: SpreadsheetLocalYjsUpdateAuditDifference[]
  localChangedKeys: SpreadsheetLocalYjsAuditKey[]
  observedYjsKeys: SpreadsheetLocalYjsAuditKey[]
}

type SpreadsheetLocalYjsUpdateAuditPatchContext = {
  touchedKeys: Set<SpreadsheetLocalYjsAuditKey>
  touchedPathsByKey: Map<SpreadsheetLocalYjsAuditKey, Set<string>>
}

const pendingLocalChangedKeys = new Set<SpreadsheetLocalYjsAuditKey>()
let pendingLocalChangedKeysClearTimer: ReturnType<typeof setTimeout> | undefined

export function recordSpreadsheetLocalStateChange(
  key: SpreadsheetLocalYjsAuditKey,
  previousValue: unknown,
  nextValue: unknown,
): void {
  if (areComparableValuesEqual(previousValue, nextValue)) {
    return
  }

  pendingLocalChangedKeys.add(key)
  schedulePendingLocalChangedKeysClearFallback()
}

/**
 * Detect divergence between the in-memory spreadsheet state and the resulting Yjs
 * document after a local broadcast, which would otherwise reconstruct to a different
 * (corrupt) document on the next reload.
 *
 * Driven by the y-spreadsheet `onAfterBroadcastPatch` hook: it fires as the final step
 * inside the broadcast transaction, with the outgoing patches already applied to the
 * doc, so the doc is ground truth for the comparison.
 *
 * Two checks:
 *  - keys the outgoing patch touched: in-memory vs the resulting doc, scoped to the
 *    touched paths;
 *  - keys that changed locally but the outgoing patch did not carry (e.g. `cellXfs` on
 *    CSV import): in-memory vs doc, when the current patch should have covered them.
 */
export function detectLocalYjsUpdateDrift(options: {
  doc: YDoc
  getLocalState: () => SpreadsheetLocalYjsUpdateAuditState
  patches?: unknown
}): SpreadsheetLocalYjsUpdateAuditResult {
  const { doc, getLocalState } = options
  const localState = getLocalState()
  const patchContext = getPatchContext(options.patches)
  const touchedKeys = patchContext?.touchedKeys ?? new Set<SpreadsheetLocalYjsAuditKey>()

  const localChangedKeys = new Set(pendingLocalChangedKeys)
  pendingLocalChangedKeys.clear()
  clearPendingLocalChangedKeysTimer()

  const differences: SpreadsheetLocalYjsUpdateAuditDifference[] = []

  for (const key of touchedKeys) {
    const touchedPaths = patchContext?.touchedPathsByKey.get(key)
    const localComparableValue = getScopedComparableValue(key, getComparableLocalValue(key, localState), touchedPaths)
    const yjsComparableValue = getScopedComparableValue(key, getComparableYjsValue(key, doc), touchedPaths)

    if (!areComparableValuesEqual(localComparableValue, yjsComparableValue)) {
      differences.push({
        key,
        reason: 'local-differs-from-yjs',
        localValue: localComparableValue,
        yjsValue: yjsComparableValue,
      })
    }
  }

  const uncheckedLocalChangedKeys: SpreadsheetLocalYjsAuditKey[] = []
  for (const key of localChangedKeys) {
    if (touchedKeys.has(key)) {
      continue
    }
    if (!shouldCheckOmittedLocalChange(key, patchContext)) {
      uncheckedLocalChangedKeys.push(key)
      continue
    }

    const localValue = getComparableLocalValue(key, localState)
    const yjsValue = getComparableYjsValue(key, doc)

    if (!areComparableValuesEqual(localValue, yjsValue)) {
      differences.push({
        key,
        reason: 'local-change-not-observed-by-yjs',
        localValue,
        yjsValue,
      })
    }
  }

  requeueUncheckedLocalChangedKeys(uncheckedLocalChangedKeys)

  return {
    differences,
    localChangedKeys: Array.from(localChangedKeys),
    observedYjsKeys: Array.from(touchedKeys),
  }
}

function requeueUncheckedLocalChangedKeys(keys: SpreadsheetLocalYjsAuditKey[]): void {
  if (keys.length === 0) {
    return
  }

  for (const key of keys) {
    pendingLocalChangedKeys.add(key)
  }
  schedulePendingLocalChangedKeysClearFallback()
}

function shouldCheckOmittedLocalChange(
  key: SpreadsheetLocalYjsAuditKey,
  patchContext: SpreadsheetLocalYjsUpdateAuditPatchContext | undefined,
): boolean {
  if (!patchContext) {
    return true
  }
  if (patchContext.touchedKeys.has(key)) {
    return true
  }
  if (key === 'sharedStrings' && patchContext.touchedKeys.has('sheetData')) {
    return true
  }
  if (key === 'cellXfs' && patchContext.touchedKeys.has('sheetData')) {
    return true
  }
  return false
}

function schedulePendingLocalChangedKeysClearFallback(): void {
  if (pendingLocalChangedKeysClearTimer) {
    return
  }

  pendingLocalChangedKeysClearTimer = setTimeout(() => {
    pendingLocalChangedKeysClearTimer = undefined
    pendingLocalChangedKeys.clear()
  }, 1000)
}

function clearPendingLocalChangedKeysTimer(): void {
  if (!pendingLocalChangedKeysClearTimer) {
    return
  }

  clearTimeout(pendingLocalChangedKeysClearTimer)
  pendingLocalChangedKeysClearTimer = undefined
}

function getComparableLocalValue(key: SpreadsheetLocalYjsAuditKey, state: SpreadsheetLocalYjsUpdateAuditState): unknown {
  switch (key) {
    case 'sheets':
      return normalizeSheets(state.sheets)
    case 'sheetData':
      return normalizeSheetData(state.sheetData)
    case 'cellXfs':
      return normalizeMapLike(state.cellXfs)
    case 'sharedStrings':
      return normalizeMapLike(state.sharedStrings)
    default:
      return normalizeValue(state[key])
  }
}

function getComparableYjsValue(key: SpreadsheetLocalYjsAuditKey, doc: YDoc): unknown {
  switch (key) {
    case 'sheets':
      return normalizeSheets(doc.getArray('sheets').toJSON())
    case 'sheetData':
      return normalizeSheetData(doc.getMap('sheetDataV2').toJSON())
    case 'tables':
      return normalizeValue(doc.getArray('tables').toJSON())
    case 'namedRanges':
      return normalizeValue(doc.getArray('namedRanges').toJSON())
    case 'conditionalFormats':
      return normalizeValue(doc.getArray('conditionalFormats').toJSON())
    case 'embeds':
      return normalizeValue(doc.getArray('embeds').toJSON())
    case 'dataValidations':
      return normalizeValue(doc.getArray('dataValidations').toJSON())
    case 'charts':
      return normalizeValue(doc.getArray('charts').toJSON())
    case 'protectedRanges':
      return normalizeValue(doc.getArray('protectedRanges').toJSON())
    case 'cellXfs':
      return normalizeMapLike(doc.getMap('cellXfs').toJSON())
    case 'sharedStrings':
      return normalizeMapLike(getMergedSharedStringsFromYDoc(doc))
    default:
      return null
  }
}

function getPatchContext(patches: unknown): SpreadsheetLocalYjsUpdateAuditPatchContext | undefined {
  if (!Array.isArray(patches)) {
    return undefined
  }

  const context: SpreadsheetLocalYjsUpdateAuditPatchContext = {
    touchedKeys: new Set(),
    touchedPathsByKey: new Map(),
  }

  for (const entry of patches) {
    if (!Array.isArray(entry)) {
      continue
    }

    const [patch, type] = entry
    if (!isPlainObject(patch)) {
      continue
    }

    const patchKey = type === 'undo' ? 'inversePatches' : 'patches'
    for (const key of SPREADSHEET_LOCAL_YJS_AUDIT_KEYS) {
      const keyPatch = patch[key]
      if (!keyPatch) {
        continue
      }

      context.touchedKeys.add(key)
      const typedPatches = isPlainObject(keyPatch) ? keyPatch[patchKey] : undefined
      if (!Array.isArray(typedPatches)) {
        addTouchedPath(context, key, '*')
        continue
      }

      for (const typedPatch of typedPatches) {
        for (const token of getTouchedPathTokens(key, typedPatch)) {
          addTouchedPath(context, key, token)
        }
      }
    }
  }

  return context
}

function addTouchedPath(
  context: SpreadsheetLocalYjsUpdateAuditPatchContext,
  key: SpreadsheetLocalYjsAuditKey,
  path: string,
): void {
  let paths = context.touchedPathsByKey.get(key)
  if (!paths) {
    paths = new Set()
    context.touchedPathsByKey.set(key, paths)
  }
  paths.add(path)
}

function getTouchedPathTokens(key: SpreadsheetLocalYjsAuditKey, patch: unknown): string[] {
  if (!isPlainObject(patch)) {
    return ['*']
  }

  const path = patch.path
  if (!Array.isArray(path) || path.length === 0) {
    return ['*']
  }

  if (key === 'sheetData') {
    if (path.length === 1 && Array.isArray(patch.value)) {
      const rowTokens: string[] = []
      for (let rowIndex = 0; rowIndex < patch.value.length; rowIndex += 1) {
        if (rowIndex in patch.value) {
          rowTokens.push(`${String(path[0])}.${String(rowIndex)}`)
        }
      }
      return rowTokens.length > 0 ? rowTokens : [String(path[0])]
    }
    if (path.length === 1) {
      return [String(path[0])]
    }
    return [`${String(path[0])}.${String(path[1])}`]
  }

  return [String(path[0])]
}

function getScopedComparableValue(
  key: SpreadsheetLocalYjsAuditKey,
  value: unknown,
  touchedPaths: Set<string> | undefined,
): unknown {
  if (!touchedPaths || touchedPaths.size === 0 || touchedPaths.has('*')) {
    return value
  }

  if (key === 'sheetData') {
    return getScopedSheetDataComparableValue(value, touchedPaths)
  }

  return getScopedKeyedComparableValue(value, touchedPaths)
}

function getScopedSheetDataComparableValue(value: unknown, touchedPaths: Set<string>): unknown {
  const source = isPlainObject(value) ? value : {}
  const scoped: Record<string, unknown> = {}

  for (const token of touchedPaths) {
    const [sheetId, rowIndex] = token.split('.')
    const sheetRows = source[sheetId]

    if (rowIndex === undefined) {
      scoped[sheetId] = sheetRows ?? null
      continue
    }

    const scopedRows = (isPlainObject(scoped[sheetId]) ? scoped[sheetId] : {}) as Record<string, unknown>
    if (Array.isArray(sheetRows)) {
      scopedRows[rowIndex] = sheetRows[Number(rowIndex)] ?? null
    } else if (isPlainObject(sheetRows)) {
      scopedRows[rowIndex] = sheetRows[rowIndex] ?? null
    } else {
      scopedRows[rowIndex] = null
    }
    scoped[sheetId] = scopedRows
  }

  return normalizeValue(scoped)
}

function getScopedKeyedComparableValue(value: unknown, touchedPaths: Set<string>): unknown {
  const scoped: Record<string, unknown> = {}

  for (const token of touchedPaths) {
    if (Array.isArray(value)) {
      scoped[token] = value[Number(token)] ?? null
    } else if (isPlainObject(value)) {
      scoped[token] = value[token] ?? null
    } else {
      scoped[token] = null
    }
  }

  return normalizeValue(scoped)
}

function getMergedSharedStringsFromYDoc(doc: YDoc): Record<string, unknown> {
  const sharedStrings: Record<string, unknown> = {}
  doc
    .getArray('sharedStrings')
    .toArray()
    .forEach((value, index) => {
      if (value !== undefined && value !== null) {
        sharedStrings[String(index)] = value
      }
    })

  return {
    ...sharedStrings,
    ...doc.getMap('sharedStringsMap').toJSON(),
  }
}

function areComparableValuesEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(normalizeValue(a)) === JSON.stringify(normalizeValue(b))
}

function normalizeMapLike(value: unknown): unknown {
  if (value instanceof Map) {
    return normalizePlainObject(Object.fromEntries(value.entries()))
  }
  return normalizeValue(value ?? {})
}

function normalizeSheets(value: unknown): unknown {
  const normalizedSheets = normalizeValue(value)
  if (
    Array.isArray(normalizedSheets) &&
    normalizedSheets.length === 1 &&
    isImplicitDefaultSheet(normalizedSheets[0])
  ) {
    return []
  }
  return normalizedSheets
}

function isImplicitDefaultSheet(value: unknown): boolean {
  if (!isPlainObject(value)) {
    return false
  }

  return (
    value.sheetId === 1 &&
    value.title === 'Sheet1' &&
    (value.hidden === false || value.hidden === null || value.hidden === undefined) &&
    (value.rowCount === 1000 || value.rowCount === null || value.rowCount === undefined) &&
    (value.columnCount === 100 || value.columnCount === null || value.columnCount === undefined) &&
    isEmptyNormalizedValue(value.merges) &&
    isEmptyNormalizedValue(value.rowMetadata) &&
    isEmptyNormalizedValue(value.columnMetadata)
  )
}

function normalizeSheetData(value: unknown): unknown {
  const sheetData = value instanceof Map ? Object.fromEntries(value.entries()) : value
  if (!sheetData || typeof sheetData !== 'object') {
    return {}
  }

  const normalized: Record<string, unknown> = {}
  for (const sheetId of Object.keys(sheetData).sort(compareNumericStrings)) {
    const rows = normalizeIndexedCollection((sheetData as Record<string, unknown>)[sheetId]).map(normalizeSheetRow)
    trimTrailing(rows, isEmptyNormalizedValue)
    if (rows.length > 0) {
      normalized[sheetId] = rows
    }
  }
  return normalized
}

function normalizeSheetRow(row: unknown): unknown {
  if (row === null || row === undefined) {
    return null
  }
  if (!isPlainObject(row)) {
    return normalizeValue(row)
  }

  const normalizedRow = normalizePlainObject(row)
  const values = normalizeIndexedCollection((row as Record<string, unknown>).values).map(normalizeValue)
  trimTrailing(values, isEmptyNormalizedValue)

  if (values.length > 0) {
    normalizedRow.values = values
  } else {
    delete normalizedRow.values
  }

  return Object.keys(normalizedRow).length > 0 ? normalizedRow : null
}

function normalizeIndexedCollection(value: unknown): unknown[] {
  if (!value) {
    return []
  }
  if (Array.isArray(value)) {
    return [...value]
  }
  if (!isPlainObject(value)) {
    return []
  }

  const entries = Object.entries(value).filter(([key]) => !Number.isNaN(Number(key)))
  if (entries.length === 0) {
    return []
  }

  const maxIndex = Math.max(...entries.map(([key]) => Number(key)))
  const result = new Array(maxIndex + 1).fill(null)
  for (const [key, entryValue] of entries) {
    result[Number(key)] = entryValue
  }
  return result
}

function normalizeValue(value: unknown): unknown {
  if (value === undefined) {
    return null
  }
  if (value instanceof Map) {
    return normalizeMapLike(value)
  }
  if (Array.isArray(value)) {
    return value.map(normalizeValue)
  }
  if (isPlainObject(value)) {
    return normalizePlainObject(value)
  }
  return value
}

function normalizePlainObject(value: object): Record<string, unknown> {
  const normalized: Record<string, unknown> = {}
  for (const key of Object.keys(value).sort(compareNumericStrings)) {
    const entryValue = (value as Record<string, unknown>)[key]
    if (entryValue !== undefined) {
      normalized[key] = normalizeValue(entryValue)
    }
  }
  return normalized
}

function trimTrailing(values: unknown[], predicate: (value: unknown) => boolean) {
  while (values.length > 0 && predicate(values[values.length - 1])) {
    values.pop()
  }
}

function isEmptyNormalizedValue(value: unknown): boolean {
  if (value === null || value === undefined) {
    return true
  }
  if (Array.isArray(value)) {
    return value.length === 0 || value.every(isEmptyNormalizedValue)
  }
  if (isPlainObject(value)) {
    return Object.keys(value).length === 0
  }
  return false
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype
}

function compareNumericStrings(a: string, b: string): number {
  const numericA = Number(a)
  const numericB = Number(b)
  if (!Number.isNaN(numericA) && !Number.isNaN(numericB)) {
    return numericA - numericB
  }
  return a.localeCompare(b)
}
