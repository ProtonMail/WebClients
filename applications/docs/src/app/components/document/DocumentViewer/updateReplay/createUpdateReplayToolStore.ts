import type { EditorControllerInterface } from '@proton/docs-core/EditorController/EditorController'
import { getBufferHash } from '@proton/docs-core/utils/hash'
import { isLocalEnvironment } from '@proton/shared/lib/env'
import { mergeUpdates } from 'yjs'
import { createStore } from 'zustand'
import { downloadJSONFile } from '~/utils/download-json-file'
import type { CellHold } from './cellHolds'
import { composeSnapshotWithHolds, getVisibleCellChanges, holdChange, holdChanges, releaseChange } from './cellHolds'
import type { CellAddress, ReplaySnapshot } from './replaySnapshot'
import type { StepChanges } from './stepChanges'
import { NO_STEP_CHANGES, getStepChanges } from './stepChanges'

export const canSyncOverWebSocket = () => isLocalEnvironment()

/**
 * Time travel's snapshot of the sheet, fetched only while time travel is on. The editor sends the whole sheet over the
 * bridge, which copies it, so fetching one after every update with time travel off made applying a large sheet's
 * updates about twice as slow. Time travel can be switched off while the editor answers, so it's checked again after.
 */
const fetchTimeTravelSnapshot = async (
  editorController: EditorControllerInterface,
  isTimeTravelEnabled: () => boolean,
): Promise<ReplaySnapshot | undefined> => {
  if (!isTimeTravelEnabled()) {
    return undefined
  }
  const snapshot = (await editorController.getLocalSpreadsheetStateJSON()) as ReplaySnapshot
  return isTimeTravelEnabled() ? snapshot : undefined
}

/**
 * A step is one snapshot of the sheet: step 0 is the state before replaying, and every apply (one update, or a
 * merged batch) adds the next step. Steps exist only while time travel is enabled, because they need snapshots.
 */
export type UpdateReplayToolState = {
  fileHash: string
  updatesToApply: Uint8Array<ArrayBuffer>[]
  appliedUpdates: number
  timeTravelIndex: number
  isConnected: boolean
  applyMultiple: number
  setApplyMultiple: (applyMultiple: number) => void
  shouldMergeBeforeApplying: boolean
  setShouldMergeBeforeApplying: (shouldMergeBeforeApplying: boolean) => void
  shouldPersistAppliedUpdates: boolean
  setShouldPersistAppliedUpdates: (shouldPersistAppliedUpdates: boolean) => void
  ws: WebSocket | null
  snapshots: ReplaySnapshot[]
  /** `stepChanges[step]` is what changed between `snapshots[step - 1]` and `snapshots[step]`. */
  stepChanges: StepChanges[]
  /** `stepUpdateCounts[step]` is how many updates had been applied when the step's snapshot was taken. */
  stepUpdateCounts: number[]
  holds: CellHold[]
  /** True while the editor shows a step with holds applied, so its state differs from that step's snapshot. */
  isEditorShowingHolds: boolean
  shouldHighlightChanges: boolean
  /** Once the repair is written to the document, its Yjs state no longer matches the snapshots, so replay stops. */
  hasAppliedRepairedState: boolean
  /**
   * The repair is written as changes on top of the replayed updates. If the server never received those, it cannot
   * apply the repair either: after a reload the document comes back without it.
   */
  hasAppliedUnpersistedUpdates: boolean
  isTimeTravelEnabled: boolean

  loadUpdatesFile: (file: File, broadcastToWS: boolean) => Promise<void>
  applyNextUpdate: () => Promise<void>
  applyMultipleUpdates: (count: number) => Promise<number>
  mergeApplyMultipleUpdates: (count: number) => Promise<number>
  createNewConnection: () => void
  closeConnection: () => void
  handleStateChangeMessage: (state: any) => Promise<void>
  sendStateChangeMessage: () => void
  goToSnapshot: (index: number) => Promise<void>
  setIsTimeTravelEnabled: (isTimeTravelEnabled: boolean) => void
  setShouldHighlightChanges: (shouldHighlightChanges: boolean) => Promise<void>
  holdCellChange: (change: CellAddress) => Promise<void>
  releaseCellChange: (change: CellAddress) => Promise<void>
  holdAllCellChangesInStep: () => Promise<void>
  removeHold: (hold: CellHold) => Promise<void>
  goToCell: (cell: CellAddress) => Promise<void>
  downloadRepairedState: () => void
  applyRepairedState: () => Promise<void>
}

export const createUpdateReplayToolStore = (editorController: EditorControllerInterface) => {
  return createStore<UpdateReplayToolState>()((set, get) => {
    const getLatestStep = () => get().snapshots.length - 1

    /** Updates must land on the plain snapshot, or the held cells would leak into the next snapshot. */
    const showLatestSnapshotWithoutHolds = async () => {
      const { isEditorShowingHolds, snapshots } = get()
      const latestSnapshot = snapshots[getLatestStep()]
      if (!isEditorShowingHolds || !latestSnapshot) {
        return
      }
      await editorController.replaceLocalSpreadsheetState(latestSnapshot, false)
      set({ isEditorShowingHolds: false })
    }

    const showStep = async (step: number, { editorAlreadyShowsSnapshot = false } = {}) => {
      const { snapshots, holds, stepChanges, shouldHighlightChanges } = get()
      const snapshot = snapshots[step]
      if (snapshot === undefined) {
        return
      }
      const composed = composeSnapshotWithHolds(snapshots, step, holds, stepChanges)
      const hasHolds = composed !== snapshot
      if (hasHolds || !editorAlreadyShowsSnapshot) {
        await editorController.replaceLocalSpreadsheetState(composed, false)
      }
      const visibleChanges = shouldHighlightChanges ? getVisibleCellChanges(snapshots, step, holds, stepChanges) : null
      await editorController.showSpreadsheetCellChanges(visibleChanges)
      set({ timeTravelIndex: step, isEditorShowingHolds: hasHolds })
    }

    /**
     * Records the step without showing it, so the editor keeps the plain snapshot for the next update. Returns whether
     * the step was recorded: without one, the editor is ahead of the latest snapshot and must not be sent back to it.
     */
    const recordStep = async (appliedUpdates: number): Promise<boolean> => {
      const snapshot = await fetchTimeTravelSnapshot(editorController, () => get().isTimeTravelEnabled)
      if (!snapshot) {
        set({ appliedUpdates })
        return false
      }
      set((state) => {
        const previous = state.snapshots[state.snapshots.length - 1]
        return {
          appliedUpdates,
          snapshots: [...state.snapshots, snapshot],
          stepChanges: [...state.stepChanges, previous ? getStepChanges(previous, snapshot) : NO_STEP_CHANGES],
          stepUpdateCounts: [...state.stepUpdateCounts, appliedUpdates],
        }
      })
      return true
    }

    const showRecordedStep = async (wasRecorded: boolean) => {
      if (wasRecorded) {
        await showStep(getLatestStep(), { editorAlreadyShowsSnapshot: true })
      }
    }

    const updateHolds = async (getHolds: (holds: CellHold[], stepChanges: StepChanges[]) => CellHold[]) => {
      const { holds, stepChanges, timeTravelIndex } = get()
      set({ holds: getHolds(holds, stepChanges) })
      await showStep(timeTravelIndex)
    }

    const getRepairedState = () => {
      const { snapshots, holds, stepChanges } = get()
      return composeSnapshotWithHolds(snapshots, getLatestStep(), holds, stepChanges)
    }

    return {
      fileHash: '',
      updatesToApply: [],
      appliedUpdates: 0,
      timeTravelIndex: 0,
      isConnected: false,
      applyMultiple: 1,
      setApplyMultiple: (applyMultiple: number) => set({ applyMultiple }),
      ws: null,
      snapshots: [],
      stepChanges: [],
      stepUpdateCounts: [],
      holds: [],
      isEditorShowingHolds: false,
      shouldHighlightChanges: true,
      hasAppliedRepairedState: false,
      hasAppliedUnpersistedUpdates: false,
      shouldMergeBeforeApplying: false,
      setShouldMergeBeforeApplying: (shouldMergeBeforeApplying: boolean) => set({ shouldMergeBeforeApplying }),
      shouldPersistAppliedUpdates: false,
      setShouldPersistAppliedUpdates: (shouldPersistAppliedUpdates: boolean) => set({ shouldPersistAppliedUpdates }),
      isTimeTravelEnabled: true,

      loadUpdatesFile: async (file: File, broadcastToWS = false) => {
        const hash = await getBufferHash(await file.arrayBuffer())
        const updates: Uint8Array<ArrayBuffer>[] = []
        if (
          file.type === 'application/zip' ||
          file.type === 'application/x-zip-compressed' ||
          file.name.endsWith('.zip')
        ) {
          const JSZip = (await import('jszip')).default
          const zip = new JSZip()
          const content = await zip.loadAsync(file)
          const filenames = Object.keys(content.files)
          filenames.sort((a, b) => parseInt(a) - parseInt(b))
          for (const filename of filenames) {
            const file = content.files[filename]
            if (!file) {
              continue
            }
            const update = await file.async('uint8array')
            updates.push(update as Uint8Array<ArrayBuffer>)
          }
        } else {
          const update = await file.arrayBuffer()
          updates.push(new Uint8Array(update))
        }
        set({ fileHash: hash, updatesToApply: updates, appliedUpdates: 0, timeTravelIndex: 0, holds: [] })
        const initialState = await fetchTimeTravelSnapshot(editorController, () => get().isTimeTravelEnabled)
        set(
          initialState
            ? { snapshots: [initialState], stepChanges: [NO_STEP_CHANGES], stepUpdateCounts: [0] }
            : { snapshots: [], stepChanges: [], stepUpdateCounts: [] },
        )
        const store = get()
        if (broadcastToWS && store.ws && store.ws.readyState === WebSocket.OPEN) {
          const msgType = 'file-loaded'
          const hash = await getBufferHash(await file.arrayBuffer())
          const data = new Uint8Array(await file.arrayBuffer()).toBase64()
          const mimeType = file.type
          const message = new TextEncoder().encode(
            JSON.stringify({
              msgType,
              hash,
              mimeType,
              data,
            }),
          )
          store.ws.send(message)
        }
      },

      applyNextUpdate: async () => {
        await get().applyMultipleUpdates(1)
      },
      applyMultipleUpdates: async (count: number): Promise<number> => {
        await showLatestSnapshotWithoutHolds()
        let wasLastStepRecorded = false
        for (let i = 0; i < count; i++) {
          const store = get()
          const update = store.updatesToApply[store.appliedUpdates]
          if (!update) {
            break
          }
          await editorController.applyUpdate(update, store.shouldPersistAppliedUpdates)
          if (!store.shouldPersistAppliedUpdates) {
            set({ hasAppliedUnpersistedUpdates: true })
          }
          wasLastStepRecorded = await recordStep(store.appliedUpdates + 1)
        }
        await showRecordedStep(wasLastStepRecorded)
        return get().appliedUpdates
      },
      mergeApplyMultipleUpdates: async (count: number): Promise<number> => {
        await showLatestSnapshotWithoutHolds()
        const store = get()
        const updates = store.updatesToApply.slice(store.appliedUpdates, store.appliedUpdates + count)
        if (updates.length === 0) {
          return store.appliedUpdates
        }
        const mergedUpdate = mergeUpdates(updates) as Uint8Array<ArrayBuffer>
        await editorController.applyUpdate(mergedUpdate, store.shouldPersistAppliedUpdates)
        if (!store.shouldPersistAppliedUpdates) {
          set({ hasAppliedUnpersistedUpdates: true })
        }
        await showRecordedStep(await recordStep(store.appliedUpdates + updates.length))
        return get().appliedUpdates
      },

      handleStateChangeMessage: async (state: any) => {
        const store = get()
        const currentAppliedUpdates = store.appliedUpdates
        const newAppliedUpdates = state.appliedUpdates
        const countOfUpdatesToApply = newAppliedUpdates - currentAppliedUpdates
        if (countOfUpdatesToApply > 0) {
          await store.applyMultipleUpdates(countOfUpdatesToApply)
        }
        const currentTimeTravelIndex = get().timeTravelIndex
        const newTimeTravelIndex = state.timeTravelIndex
        if (newTimeTravelIndex !== currentTimeTravelIndex) {
          await store.goToSnapshot(newTimeTravelIndex)
        }
      },

      sendStateChangeMessage: () => {
        const store = get()
        if (!store.ws || store.ws.readyState !== WebSocket.OPEN) {
          return
        }
        const message = new TextEncoder().encode(
          JSON.stringify({
            msgType: 'state-change',
            state: {
              appliedUpdates: store.appliedUpdates,
              timeTravelIndex: store.timeTravelIndex,
            },
          }),
        )
        store.ws.send(message)
      },

      createNewConnection: () => {
        if (!canSyncOverWebSocket()) {
          return
        }
        const store = get()
        if (store.ws && store.ws.readyState === WebSocket.OPEN) {
          store.ws.close()
        }
        const ws = new WebSocket(`ws://localhost:3001/?hash=${get().fileHash}`)
        ws.onopen = () => {
          set({ isConnected: true })
        }
        ws.onclose = () => {
          set({ isConnected: false })
        }
        ws.onmessage = async (event) => {
          const message = event.data
          if (typeof message === 'string') {
            return
          }
          if (!(message instanceof Blob)) {
            return
          }
          const buf = new Uint8Array(await message.arrayBuffer())
          const json = new TextDecoder().decode(buf)
          const parsed = JSON.parse(json)
          const store = get()
          switch (parsed.msgType) {
            case 'file-loaded':
              if (store.fileHash === parsed.hash) {
                return
              }
              const data = Uint8Array.fromBase64(parsed.data)
              const file = new File([data], parsed.hash, {
                type: parsed.mimeType,
              })
              await store.loadUpdatesFile(file, true)
              if (parsed.state) {
                await store.handleStateChangeMessage(parsed.state)
              }
              break
            case 'state-change':
              await store.handleStateChangeMessage(parsed.state)
              break
            default:
              console.error('Unknown message type:', parsed.msgType)
          }
        }
        set({ ws: ws })
      },
      closeConnection: () => {
        const store = get()
        if (store.ws) {
          store.ws.close()
          set({ ws: null })
        }
      },

      goToSnapshot: (index: number) => showStep(index),

      setIsTimeTravelEnabled: (isTimeTravelEnabled: boolean) => set({ isTimeTravelEnabled }),

      setShouldHighlightChanges: async (shouldHighlightChanges: boolean) => {
        set({ shouldHighlightChanges })
        const { snapshots, timeTravelIndex, holds, stepChanges } = get()
        const visibleChanges = shouldHighlightChanges
          ? getVisibleCellChanges(snapshots, timeTravelIndex, holds, stepChanges)
          : null
        await editorController.showSpreadsheetCellChanges(visibleChanges)
      },

      holdCellChange: (change: CellAddress) =>
        updateHolds((holds, stepChanges) => holdChange(holds, change, get().timeTravelIndex, stepChanges)),

      releaseCellChange: (change: CellAddress) =>
        updateHolds((holds, stepChanges) => releaseChange(holds, change, get().timeTravelIndex, stepChanges)),

      holdAllCellChangesInStep: () =>
        updateHolds((holds, stepChanges) => {
          const step = get().timeTravelIndex
          return holdChanges(holds, stepChanges[step]?.cellChanges ?? [], step, stepChanges)
        }),

      removeHold: (holdToRemove: CellHold) => updateHolds((holds) => holds.filter((hold) => hold !== holdToRemove)),

      goToCell: async ({ sheetId, rowIndex, columnIndex }: CellAddress) => {
        await editorController.goToSpreadsheetCell(sheetId, rowIndex, columnIndex)
      },

      downloadRepairedState: () => {
        downloadJSONFile(getRepairedState(), 'repaired-spreadsheet-state.json')
      },

      /**
       * Writes the last step, with holds applied, into the document as new updates. Uses the same path as restoring a
       * version from history, so the repair is a regular forward change and the replayed history stays untouched.
       */
      applyRepairedState: async () => {
        await editorController.replaceLocalSpreadsheetState(getRepairedState(), true)
        await editorController.showSpreadsheetCellChanges(null)
        set({ timeTravelIndex: getLatestStep(), isEditorShowingHolds: false, hasAppliedRepairedState: true })
      },
    }
  })
}
