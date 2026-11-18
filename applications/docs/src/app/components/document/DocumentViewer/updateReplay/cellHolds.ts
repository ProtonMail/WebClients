import type { CellAddress, ReplayCell, ReplayRow, ReplaySnapshot } from './replaySnapshot'
import { getCell, getCellDisplayText, getCellKey } from './replaySnapshot'
import type { CellChange, StepChanges } from './stepChanges'
import { NO_STEP_CHANGES, getCellChangeBetween, stableStringify } from './stepChanges'

/**
 * Undoes the change a step made to one cell: from `fromStep` on, the cell keeps the content it had before that
 * step, until a later step changes the cell again (or changes its sheet's structure). The user can keep holding
 * through such a later step, which is recorded in `keptThroughSteps`.
 */
export type CellHold = CellAddress & {
  fromStep: number
  keptThroughSteps: number[]
}

/**
 * How a step's change to a cell relates to the holds:
 * - `held`: a hold starts at this step and undoes this change.
 * - `kept`: an earlier hold was kept through this change.
 * - `overwrites-hold`: this change ends an earlier hold.
 */
export type ChangeHoldState =
  | { type: 'none' }
  | { type: 'held'; hold: CellHold }
  | { type: 'kept'; hold: CellHold }
  | { type: 'overwrites-hold'; hold: CellHold }

/** Holds grouped by cell key, so finding a cell's holds doesn't scan every hold (a "Hold all" can add thousands). */
export type HoldsByCell = Map<string, CellHold[]>

export function groupHoldsByCell(holds: CellHold[]): HoldsByCell {
  const holdsByCell: HoldsByCell = new Map()
  for (const hold of holds) {
    const key = getCellKey(hold)
    const holdsOnCell = holdsByCell.get(key)
    if (holdsOnCell) {
      holdsOnCell.push(hold)
    } else {
      holdsByCell.set(key, [hold])
    }
  }
  return holdsByCell
}

/**
 * A hold's release step only depends on the hold and the step changes, and both are replaced rather than changed,
 * so it is cached until a new step is recorded. Without the cache, every render walks every step for every hold.
 */
const releaseStepCache = new WeakMap<CellHold, { stepChanges: StepChanges[]; releaseStep: number | null }>()

/** The first step after `fromStep` that ends the hold, or null if it lasts until the last loaded step. */
export function getHoldReleaseStep(hold: CellHold, stepChanges: StepChanges[]): number | null {
  const cached = releaseStepCache.get(hold)
  if (cached?.stepChanges === stepChanges) {
    return cached.releaseStep
  }
  const releaseStep = findHoldReleaseStep(hold, stepChanges)
  releaseStepCache.set(hold, { stepChanges, releaseStep })
  return releaseStep
}

function findHoldReleaseStep(hold: CellHold, stepChanges: StepChanges[]): number | null {
  const key = getCellKey(hold)
  for (let step = hold.fromStep + 1; step < stepChanges.length; step++) {
    if (hold.keptThroughSteps.includes(step)) {
      continue
    }
    const changes = stepChanges[step] ?? NO_STEP_CHANGES
    if (changes.changedCellKeys.has(key) || changes.structurallyChangedSheetIds.has(hold.sheetId)) {
      return step
    }
  }
  return null
}

function isHoldActiveAt(hold: CellHold, step: number, stepChanges: StepChanges[]): boolean {
  if (step < hold.fromStep) {
    return false
  }
  const releaseStep = getHoldReleaseStep(hold, stepChanges)
  return releaseStep === null || step < releaseStep
}

export function getActiveHolds(holds: CellHold[], step: number, stepChanges: StepChanges[]): CellHold[] {
  return holds.filter((hold) => isHoldActiveAt(hold, step, stepChanges))
}

export function getChangeHoldState(
  holdsByCell: HoldsByCell,
  change: CellAddress,
  step: number,
  stepChanges: StepChanges[],
): ChangeHoldState {
  const holdsOnCell = holdsByCell.get(getCellKey(change)) ?? []
  const startedHere = holdsOnCell.find((hold) => hold.fromStep === step)
  if (startedHere) {
    return { type: 'held', hold: startedHere }
  }
  const kept = holdsOnCell.find(
    (hold) => hold.keptThroughSteps.includes(step) && isHoldActiveAt(hold, step, stepChanges),
  )
  if (kept) {
    return { type: 'kept', hold: kept }
  }
  const overwritten = holdsOnCell.find(
    (hold) => isHoldActiveAt(hold, step - 1, stepChanges) && getHoldReleaseStep(hold, stepChanges) === step,
  )
  if (overwritten) {
    return { type: 'overwrites-hold', hold: overwritten }
  }
  return { type: 'none' }
}

/** Holds the change, or keeps holding an earlier hold that this change would end. */
export function holdChange(
  holds: CellHold[],
  change: CellAddress,
  step: number,
  stepChanges: StepChanges[],
): CellHold[] {
  return holdChanges(holds, [change], step, stepChanges)
}

/** `holdChange` for many changes of one step at once, in one pass over the holds. */
export function holdChanges(
  holds: CellHold[],
  changes: CellAddress[],
  step: number,
  stepChanges: StepChanges[],
): CellHold[] {
  const holdsByCell = groupHoldsByCell(holds)
  const keptHolds = new Map<CellHold, CellHold>()
  const newHolds: CellHold[] = []
  for (const change of changes) {
    const state = getChangeHoldState(holdsByCell, change, step, stepChanges)
    if (state.type === 'none') {
      const { sheetId, rowIndex, columnIndex } = change
      const hold: CellHold = { sheetId, rowIndex, columnIndex, fromStep: step, keptThroughSteps: [] }
      newHolds.push(hold)
      holdsByCell.set(getCellKey(hold), [...(holdsByCell.get(getCellKey(hold)) ?? []), hold])
    } else if (state.type === 'overwrites-hold' && !keptHolds.has(state.hold)) {
      keptHolds.set(state.hold, {
        ...state.hold,
        keptThroughSteps: [...state.hold.keptThroughSteps, step].sort((a, b) => a - b),
      })
    }
  }
  if (newHolds.length === 0 && keptHolds.size === 0) {
    return holds
  }
  return [...holds.map((hold) => keptHolds.get(hold) ?? hold), ...newHolds]
}

/** Lets the change through again: removes the hold it started, or stops keeping an earlier hold through it. */
export function releaseChange(
  holds: CellHold[],
  change: CellAddress,
  step: number,
  stepChanges: StepChanges[],
): CellHold[] {
  const state = getChangeHoldState(groupHoldsByCell(holds), change, step, stepChanges)
  if (state.type === 'held') {
    return holds.filter((hold) => hold !== state.hold)
  }
  if (state.type === 'kept') {
    return holds.map((hold) =>
      hold === state.hold ? { ...hold, keptThroughSteps: hold.keptThroughSteps.filter((kept) => kept !== step) } : hold,
    )
  }
  return holds
}

/**
 * The snapshot after `step`, with every hold active at that step writing back the cell's content from before
 * the hold started. The stored snapshots are never changed, so holds can be added or removed at any time.
 */
export function composeSnapshotWithHolds(
  snapshots: ReplaySnapshot[],
  step: number,
  holds: CellHold[],
  stepChanges: StepChanges[],
): ReplaySnapshot {
  const base = snapshots[step]
  if (!base) {
    throw new Error(`No snapshot for step ${step}`)
  }
  const activeHolds = getActiveHolds(holds, step, stepChanges).filter((hold) =>
    base.sheets?.some((sheet) => sheet.sheetId === hold.sheetId),
  )
  if (activeHolds.length === 0) {
    return base
  }
  const composed: ReplaySnapshot = {
    ...base,
    sheetData: { ...base.sheetData },
    sharedStrings: { ...base.sharedStrings },
    cellXfs: { ...base.cellXfs },
  }
  const copiedRows = new Set<string>()
  for (const hold of activeHolds) {
    const source = snapshots[hold.fromStep - 1]
    if (!source) {
      continue
    }
    const heldCell = getCell(source, hold)
    const cell = heldCell ? carryCellReferences(heldCell, source, composed, hold.fromStep) : null
    writeCell(composed, hold, cell, copiedRows)
  }
  return composed
}

export function getHeldCellText(hold: CellHold, snapshots: ReplaySnapshot[]): string {
  const source = snapshots[hold.fromStep - 1]
  return source ? getCellDisplayText(getCell(source, hold), source.sharedStrings) : ''
}

/** Copies the rows a write touches so the stored snapshot underneath stays unchanged. */
function writeCell(snapshot: ReplaySnapshot, address: CellAddress, cell: ReplayCell | null, copiedRows: Set<string>) {
  const sheetData = snapshot.sheetData ?? {}
  const sheetKey = String(address.sheetId)
  if (!copiedRows.has(sheetKey)) {
    sheetData[sheetKey] = [...(sheetData[sheetKey] ?? [])]
    copiedRows.add(sheetKey)
  }
  const rows = sheetData[sheetKey]!
  const rowKey = `${sheetKey}:${address.rowIndex}`
  if (!copiedRows.has(rowKey)) {
    const row: ReplayRow = rows[address.rowIndex] ?? {}
    rows[address.rowIndex] = { ...row, values: [...(row.values ?? [])] }
    copiedRows.add(rowKey)
  }
  const values = rows[address.rowIndex]!.values!
  values[address.columnIndex] = cell
}

const STYLE_REFERENCE_KEYS = ['uf', 'userEnteredFormat', 'ef', 'effectiveFormat'] as const

/**
 * A held cell can point at a shared string or a style that the later snapshot no longer has, or has under the
 * same id with other content. Copy the entries it needs and give them a new id when the id is taken.
 */
function carryCellReferences(
  cell: ReplayCell,
  source: ReplaySnapshot,
  target: ReplaySnapshot,
  fromStep: number,
): ReplayCell {
  const carried: ReplayCell = { ...cell }
  if (cell.ss !== undefined && cell.ss !== null) {
    carried.ss = carryEntry(String(cell.ss), source.sharedStrings, target.sharedStrings!, fromStep) ?? cell.ss
  }
  for (const key of STYLE_REFERENCE_KEYS) {
    const format = cell[key]
    if (!format || typeof format !== 'object' || !('sid' in format) || typeof format.sid !== 'string') {
      continue
    }
    const sid = carryEntry(format.sid, source.cellXfs, target.cellXfs!, fromStep)
    if (sid) {
      carried[key] = { ...format, sid }
    }
  }
  return carried
}

function carryEntry(
  id: string,
  sourceEntries: Record<string, unknown> | undefined,
  targetEntries: Record<string, unknown>,
  fromStep: number,
): string | undefined {
  const entry = sourceEntries?.[id]
  if (entry === undefined) {
    return undefined
  }
  const existing = targetEntries[id]
  if (existing === undefined) {
    targetEntries[id] = entry
    return id
  }
  if (stableStringify(existing) === stableStringify(entry)) {
    return id
  }
  const heldId = `${id}~held${fromStep}`
  targetEntries[heldId] = entry
  return heldId
}

/**
 * The cells that look different after `step` than before it, once holds are applied. Held changes drop out, and
 * cells whose hold ends here show the held content as their previous value.
 */
export function getVisibleCellChanges(
  snapshots: ReplaySnapshot[],
  step: number,
  holds: CellHold[],
  stepChanges: StepChanges[],
): CellChange[] {
  if (step < 1) {
    return []
  }
  const previous = composeSnapshotWithHolds(snapshots, step - 1, holds, stepChanges)
  const next = composeSnapshotWithHolds(snapshots, step, holds, stepChanges)
  const releasedHolds = getActiveHolds(holds, step - 1, stepChanges).filter(
    (hold) => !isHoldActiveAt(hold, step, stepChanges),
  )
  const addresses = new Map<string, CellAddress>()
  for (const address of [...(stepChanges[step]?.cellChanges ?? []), ...releasedHolds]) {
    addresses.set(getCellKey(address), address)
  }
  return [...addresses.values()]
    .map((address) => getCellChangeBetween(address, previous, next))
    .filter((change): change is CellChange => change !== null)
}
