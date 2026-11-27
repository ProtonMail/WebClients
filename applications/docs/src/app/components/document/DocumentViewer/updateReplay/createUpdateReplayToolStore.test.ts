import type { EditorControllerInterface } from '@proton/docs-core/EditorController/EditorController'
import { createUpdateReplayToolStore } from './createUpdateReplayToolStore'
import type { ReplayCell, ReplaySnapshot } from './replaySnapshot'
import { getCell } from './replaySnapshot'
import { NO_STEP_CHANGES } from './stepChanges'

const A1 = { sheetId: 1, rowIndex: 1, columnIndex: 1 }
const B1 = { sheetId: 1, rowIndex: 1, columnIndex: 2 }

function snapshot(a1: ReplayCell | null, b1: ReplayCell | null = null): ReplaySnapshot {
  return {
    sheets: [{ sheetId: 1, title: 'Sheet1', rowCount: 1000, columnCount: 100 }],
    sheetData: { 1: [null, { values: [null, a1, b1] }] },
    sharedStrings: {},
    cellXfs: {},
  }
}

function text(value: string): ReplayCell {
  return { ue: { sv: value } }
}

type Edit = (state: ReplaySnapshot) => void

const setCell =
  (cell: typeof A1, value: ReplayCell | null): Edit =>
  (state) => {
    state.sheetData![cell.sheetId]![cell.rowIndex]!.values![cell.columnIndex] = value
  }

/**
 * An editor that keeps a sheet: each update is one edit applied to whatever the editor shows, so an update applied
 * on top of held cells carries them into the next snapshot, as in the real editor.
 */
function createEditor(edits: Edit[]) {
  let state = snapshot(null)
  const editor = {
    applyUpdate: vi.fn(async (update: Uint8Array<ArrayBuffer>) => {
      edits[update[0]](state)
    }),
    getLocalSpreadsheetStateJSON: vi.fn(async () => structuredClone(state)),
    replaceLocalSpreadsheetState: vi.fn(async (next: ReplaySnapshot) => {
      state = structuredClone(next)
    }),
    showSpreadsheetCellChanges: vi.fn(async () => {}),
    goToSpreadsheetCell: vi.fn(async () => {}),
    setSpreadsheetEditorMounted: vi.fn(async (_isMounted: boolean) => {}),
  }
  return { editor, getState: () => state }
}

function createLoadedStore(edits: Edit[]) {
  const { editor, getState } = createEditor(edits)
  const store = createUpdateReplayToolStore(editor as unknown as EditorControllerInterface)
  store.setState({
    updatesToApply: edits.map((_, index) => new Uint8Array([index])),
    snapshots: [snapshot(null)],
    stepChanges: [NO_STEP_CHANGES],
    stepUpdateCounts: [0],
  })
  return { store, editor, getState }
}

describe('createUpdateReplayToolStore', () => {
  // Update 0 types "hello" in A1, update 1 removes it, updates 2 and 3 only change B1.
  const edits = [setCell(A1, text('hello')), setCell(A1, null), setCell(B1, text('x')), setCell(B1, text('y'))]

  it('applies every update of a multiple apply to the sheet without the held cells', async () => {
    const { store, getState } = createLoadedStore(edits)
    await store.getState().applyMultipleUpdates(2)
    await store.getState().holdCellChange(A1)

    await store.getState().applyMultipleUpdates(2)

    const { snapshots } = store.getState()
    expect(snapshots).toHaveLength(5)
    expect(getCell(snapshots[3], A1)).toBeNull()
    expect(getCell(snapshots[4], A1)).toBeNull()
    expect(store.getState().stepChanges[4].cellChanges).toEqual([expect.objectContaining(B1)])
    // The editor shows the latest step with the hold on top.
    expect(getCell(getState(), A1)).toEqual(text('hello'))
    expect(getCell(getState(), B1)).toEqual(text('y'))
    expect(store.getState().isEditorShowingHolds).toBe(true)
  })

  it('leaves the latest updates in the editor when time travel is switched off during a multiple apply', async () => {
    const { store, editor, getState } = createLoadedStore(edits)
    await store.getState().applyMultipleUpdates(2)
    await store.getState().holdCellChange(A1)
    editor.getLocalSpreadsheetStateJSON.mockImplementationOnce(async () => {
      store.getState().setIsTimeTravelEnabled(false)
      return structuredClone(getState())
    })

    await store.getState().applyMultipleUpdates(2)

    expect(store.getState().appliedUpdates).toBe(4)
    expect(store.getState().snapshots).toHaveLength(3)
    expect(getCell(getState(), B1)).toEqual(text('y'))
  })

  it('mounts the editor again when an update fails to apply with the editor unmounted', async () => {
    const { store, editor } = createLoadedStore(edits)
    store.getState().setShouldUnmountEditorWhileApplying(true)
    editor.applyUpdate.mockRejectedValueOnce(new Error('bad update'))

    await expect(store.getState().applyMultipleUpdates(2)).rejects.toThrow('bad update')

    expect(editor.setSpreadsheetEditorMounted.mock.calls).toEqual([[false], [true]])
    expect(store.getState().appliedUpdates).toBe(0)
  })
})
