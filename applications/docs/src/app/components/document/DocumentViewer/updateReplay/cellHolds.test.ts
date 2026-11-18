import type { CellHold } from './cellHolds'
import {
  composeSnapshotWithHolds,
  getChangeHoldState,
  getHoldReleaseStep,
  getVisibleCellChanges,
  groupHoldsByCell,
  holdChange,
  holdChanges,
  releaseChange,
} from './cellHolds'
import type { ReplayCell, ReplaySnapshot } from './replaySnapshot'
import { getCell } from './replaySnapshot'
import type { StepChanges } from './stepChanges'
import { NO_STEP_CHANGES, getStepChanges } from './stepChanges'

const A1 = { sheetId: 1, rowIndex: 1, columnIndex: 1 }
const B1 = { sheetId: 1, rowIndex: 1, columnIndex: 2 }

function snapshot(a1: ReplayCell | null, b1: ReplayCell | null = null, extra: Partial<ReplaySnapshot> = {}) {
  return {
    sheets: [{ sheetId: 1, title: 'Sheet1', rowCount: 1000, columnCount: 100 }],
    sheetData: { 1: [null, { values: [null, a1, b1] }] },
    sharedStrings: {},
    cellXfs: {},
    ...extra,
  } satisfies ReplaySnapshot
}

function text(value: string): ReplayCell {
  return { ue: { sv: value } }
}

function getAllStepChanges(snapshots: ReplaySnapshot[]): StepChanges[] {
  return snapshots.map((current, step) => (step === 0 ? NO_STEP_CHANGES : getStepChanges(snapshots[step - 1], current)))
}

describe('cell holds', () => {
  // Step 1 types "hello", step 2 removes it, step 3 changes B1, step 4 types "world" in A1.
  const snapshots = [
    snapshot(null),
    snapshot(text('hello')),
    snapshot(null),
    snapshot(null, text('other')),
    snapshot(text('world'), text('other')),
  ]
  const stepChanges = getAllStepChanges(snapshots)

  it('keeps the removed text until the cell changes again', () => {
    const holds = holdChange([], A1, 2, stepChanges)

    expect(getHoldReleaseStep(holds[0], stepChanges)).toBe(4)
    expect(getCell(composeSnapshotWithHolds(snapshots, 2, holds, stepChanges), A1)).toEqual(text('hello'))
    expect(getCell(composeSnapshotWithHolds(snapshots, 3, holds, stepChanges), A1)).toEqual(text('hello'))
    expect(getCell(composeSnapshotWithHolds(snapshots, 4, holds, stepChanges), A1)).toEqual(text('world'))
  })

  it('does not change the stored snapshots', () => {
    const holds = holdChange([], A1, 2, stepChanges)

    composeSnapshotWithHolds(snapshots, 3, holds, stepChanges)

    expect(getCell(snapshots[3], A1)).toBeNull()
  })

  it('can keep holding through the change that would end the hold', () => {
    const holds = holdChange([], A1, 2, stepChanges)
    expect(getChangeHoldState(groupHoldsByCell(holds), A1, 4, stepChanges).type).toBe('overwrites-hold')

    const keptHolds = holdChange(holds, A1, 4, stepChanges)

    expect(keptHolds).toEqual([{ ...A1, fromStep: 2, keptThroughSteps: [4] }])
    expect(getChangeHoldState(groupHoldsByCell(keptHolds), A1, 4, stepChanges).type).toBe('kept')
    expect(getCell(composeSnapshotWithHolds(snapshots, 4, keptHolds, stepChanges), A1)).toEqual(text('hello'))

    expect(releaseChange(keptHolds, A1, 4, stepChanges)).toEqual(holds)
  })

  it('holds many changes at once like holding them one by one', () => {
    const changes = [A1, B1, { sheetId: 1, rowIndex: 2, columnIndex: 1 }]
    const earlierHold: CellHold = { ...B1, fromStep: 1, keptThroughSteps: [] }
    const multiStepChanges = getAllStepChanges([
      snapshot(null),
      snapshot(null, text('b')),
      snapshot(text('a'), text('c')),
    ])

    const oneByOne = changes.reduce((holds, change) => holdChange(holds, change, 2, multiStepChanges), [earlierHold])

    expect(holdChanges([earlierHold], changes, 2, multiStepChanges)).toEqual(oneByOne)
    expect(oneByOne).toEqual([
      { ...B1, fromStep: 1, keptThroughSteps: [2] },
      { ...A1, fromStep: 2, keptThroughSteps: [] },
      { sheetId: 1, rowIndex: 2, columnIndex: 1, fromStep: 2, keptThroughSteps: [] },
    ])
  })

  it('finds the release step again once a step is added', () => {
    const hold: CellHold = { ...A1, fromStep: 2, keptThroughSteps: [] }
    const firstSteps = stepChanges.slice(0, 4)

    expect(getHoldReleaseStep(hold, firstSteps)).toBeNull()
    expect(getHoldReleaseStep(hold, stepChanges)).toBe(4)
  })

  it('removes the hold when its own change is released', () => {
    const holds = holdChange([], A1, 2, stepChanges)

    expect(releaseChange(holds, A1, 2, stepChanges)).toEqual([])
  })

  it('can undo an added cell', () => {
    const holds = holdChange([], A1, 1, stepChanges)

    expect(getCell(composeSnapshotWithHolds(snapshots, 1, holds, stepChanges), A1)).toBeNull()
  })

  it('ends holds when the sheet structure changes', () => {
    const resized = snapshot(null, null, { sheets: [{ sheetId: 1, rowCount: 1001, columnCount: 100 }] })
    const withResize = [...snapshots.slice(0, 3), resized]
    const holds: CellHold[] = [{ ...A1, fromStep: 2, keptThroughSteps: [] }]

    expect(getHoldReleaseStep(holds[0], getAllStepChanges(withResize))).toBe(3)
  })

  it('carries the shared string and style a held cell points to', () => {
    const before = snapshot({ ss: 'h', uf: { sid: 'bold' } }, null, {
      sharedStrings: { h: 'hello' },
      cellXfs: { bold: { textFormat: { bold: true } } },
    })
    const after = snapshot(null, null, { sharedStrings: { h: 'reused id' }, cellXfs: {} })
    const localSnapshots = [snapshot(null), before, after]
    const localStepChanges = getAllStepChanges(localSnapshots)
    const holds = holdChange([], A1, 2, localStepChanges)

    const composed = composeSnapshotWithHolds(localSnapshots, 2, holds, localStepChanges)

    expect(getCell(composed, A1)).toEqual({ ss: 'h~held2', uf: { sid: 'bold' } })
    expect(composed.sharedStrings).toEqual({ h: 'reused id', 'h~held2': 'hello' })
    expect(composed.cellXfs).toEqual({ bold: { textFormat: { bold: true } } })
  })

  it('shows only the changes that are visible once holds apply', () => {
    const holds = holdChange([], A1, 2, stepChanges)

    expect(getVisibleCellChanges(snapshots, 2, holds, stepChanges)).toEqual([])
    expect(getVisibleCellChanges(snapshots, 3, holds, stepChanges)).toEqual([
      expect.objectContaining({ ...B1, kind: 'added' }),
    ])
    expect(getVisibleCellChanges(snapshots, 4, holds, stepChanges)).toEqual([
      expect.objectContaining({ ...A1, kind: 'modified', textBefore: 'hello', textAfter: 'world' }),
    ])
  })
})
