import Icon from '@proton/components/components/icon/Icon'
import { Button } from '@proton/atoms/Button/Button'
import { Slider, SliderSizeEnum } from '@proton/atoms/Slider/Slider'
import { IcCross } from '@proton/icons/icons/IcCross'
import type { EditorControllerInterface } from '@proton/docs-core/lib/EditorController/EditorController'
import { getBufferHash } from '@proton/docs-core/lib/utils/hash'
import { useEffect, useRef, useState } from 'react'
import { createStore, useStore } from 'zustand'
import { mergeUpdates } from 'yjs'

const createUpdateReplayToolStore = (editorController: EditorControllerInterface) => {
  return createStore<{
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
    snapshots: unknown[]
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
  }>()((set, get) => ({
    fileHash: '',
    updatesToApply: [],
    appliedUpdates: 0,
    timeTravelIndex: 0,
    isConnected: false,
    applyMultiple: 1,
    setApplyMultiple: (applyMultiple: number) => set({ applyMultiple }),
    ws: null,
    snapshots: [],
    shouldMergeBeforeApplying: false,
    setShouldMergeBeforeApplying: (shouldMergeBeforeApplying: boolean) => set({ shouldMergeBeforeApplying }),
    shouldPersistAppliedUpdates: false,
    setShouldPersistAppliedUpdates: (shouldPersistAppliedUpdates: boolean) => set({ shouldPersistAppliedUpdates }),
    isTimeTravelEnabled: true,

    loadUpdatesFile: async (file: File, broadcastToWS = false) => {
      const hash = await getBufferHash(await file.arrayBuffer())
      const updates: Uint8Array<ArrayBuffer>[] = []
      if (file.type === 'application/zip' || file.type === 'application/x-zip-compressed' || file.name.endsWith('.zip')) {
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
      set({ fileHash: hash, updatesToApply: updates, appliedUpdates: 0, timeTravelIndex: 0 })
      const initialState = await editorController.getLocalSpreadsheetStateJSON()
      if (get().isTimeTravelEnabled) {
        set({ snapshots: [initialState] })
      }
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
      const store = get()
      const update = store.updatesToApply[store.appliedUpdates]
      if (!update) {
        return
      }
      await editorController.applyUpdate(update, store.shouldPersistAppliedUpdates)
      const snapshot = await editorController.getLocalSpreadsheetStateJSON()
      set((state) => ({
        snapshots: get().isTimeTravelEnabled ? [...state.snapshots, snapshot] : state.snapshots,
        appliedUpdates: state.appliedUpdates + 1,
        timeTravelIndex: state.appliedUpdates + 1,
      }))
    },
    applyMultipleUpdates: async (count: number): Promise<number> => {
      const store = get()
      for (let i = 0; i < count; i++) {
        const update = store.updatesToApply[store.appliedUpdates + i]
        if (!update) {
          continue
        }
        await editorController.applyUpdate(update, store.shouldPersistAppliedUpdates)
        const snapshot = await editorController.getLocalSpreadsheetStateJSON()
        set((state) => ({ snapshots: get().isTimeTravelEnabled ? [...state.snapshots, snapshot] : state.snapshots }))
      }
      const newAppliedUpdates = store.appliedUpdates + count
      set({ appliedUpdates: newAppliedUpdates, timeTravelIndex: newAppliedUpdates })
      return newAppliedUpdates
    },
    mergeApplyMultipleUpdates: async (count: number): Promise<number> => {
      const store = get()
      const updates = store.updatesToApply.slice(store.appliedUpdates, store.appliedUpdates + count)
      const mergedUpdate = mergeUpdates(updates) as Uint8Array<ArrayBuffer>
      await editorController.applyUpdate(mergedUpdate, store.shouldPersistAppliedUpdates)
      const snapshot = await editorController.getLocalSpreadsheetStateJSON()
      set((state) => ({ snapshots: get().isTimeTravelEnabled ? [...state.snapshots, snapshot] : state.snapshots }))
      const newAppliedUpdates = store.appliedUpdates + count
      set({ appliedUpdates: newAppliedUpdates, timeTravelIndex: newAppliedUpdates })
      return newAppliedUpdates
    },

    handleStateChangeMessage: async (state: any) => {
      const store = get()
      const currentAppliedUpdates = store.appliedUpdates
      const newAppliedUpdates = state.appliedUpdates
      const countOfUpdatesToApply = newAppliedUpdates - currentAppliedUpdates
      if (countOfUpdatesToApply > 0) {
        await store.applyMultipleUpdates(countOfUpdatesToApply)
      }
      const currentTimeTravelIndex = store.timeTravelIndex
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

    goToSnapshot: async (index: number) => {
      const store = get()
      const snapshot = store.snapshots[index]
      if (snapshot === undefined) {
        return
      }
      await editorController.replaceLocalSpreadsheetState(snapshot as object, false)
      set({ timeTravelIndex: index })
    },

    setIsTimeTravelEnabled: (isTimeTravelEnabled: boolean) => set({ isTimeTravelEnabled }),
  }))
}

export default function UpdateReplayTool({
  onClose,
  editorController,
  isSpreadsheet,
}: {
  onClose: () => void
  editorController: EditorControllerInterface
  isSpreadsheet: boolean
}) {
  const [store] = useState(() => createUpdateReplayToolStore(editorController))
  const {
    updatesToApply,
    appliedUpdates,
    applyMultiple,
    setApplyMultiple,
    snapshots,
    timeTravelIndex,
    isConnected,
    loadUpdatesFile,
    applyNextUpdate,
    applyMultipleUpdates,
    mergeApplyMultipleUpdates,
    createNewConnection,
    closeConnection,
    sendStateChangeMessage,
    goToSnapshot,
    isTimeTravelEnabled,
    setIsTimeTravelEnabled,
    shouldMergeBeforeApplying,
    setShouldMergeBeforeApplying,
    shouldPersistAppliedUpdates,
    setShouldPersistAppliedUpdates,
  } = useStore(store)

  const didSetupInitialConnection = useRef(false)
  useEffect(() => {
    if (didSetupInitialConnection.current) {
      return
    }
    createNewConnection()
    didSetupInitialConnection.current = true
    return () => {
      closeConnection()
    }
  }, [createNewConnection, closeConnection])

  return (
    <div className="flex !min-w-[20rem] flex-col rounded border border-[--border-weak] bg-[--background-weak] px-1 py-1 [&_button]:flex [&_button]:items-center [&_button]:justify-between [&_button]:gap-3 [&_button]:text-left">
      <div className="mt-1 flex items-center justify-between gap-2 px-2 font-semibold">
        <div>Update Replay Tool</div>
        <button
          className="flex items-center justify-center rounded-full border border-[--border-weak] bg-[--background-weak] p-1 hover:bg-[--background-strong]"
          onClick={onClose}
        >
          <div className="sr-only">Close menu</div>
          <IcCross className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex flex-col gap-2 p-2">
        <div className="flex items-center gap-2">
          <Icon name={isConnected ? 'checkmark-circle' : 'cross-circle'} className="h-3.5 w-3.5" />
          {isConnected ? 'Connected' : 'Disconnected'}
          {!isConnected && (
            <Button
              size="small"
              onClick={() => {
                createNewConnection()
              }}
            >
              Connect
            </Button>
          )}
        </div>
        <label>
          <div className="mb-1.5 text-sm leading-none">Updates to apply:</div>
          <input
            type="file"
            onChange={async (event) => {
              if (!event.target.files) {
                return
              }
              const file = event.target.files[0]
              if (!file) {
                return
              }
              await loadUpdatesFile(file, true)
            }}
            disabled={updatesToApply.length > 0}
          />
        </label>
        <div>
          Applied: {appliedUpdates} / {updatesToApply.length}
        </div>
        <label>
          <div className="mb-1.5 text-sm leading-none">Apply mulitple:</div>
          <input
            className="bg-norm"
            id="ephemeral-updates-apply-multiple-input"
            type="number"
            min={1}
            value={applyMultiple}
            onChange={(event) => setApplyMultiple(parseInt(event.target.value))}
            disabled={updatesToApply.length === 0}
          />
        </label>
        <label className="flex items-center gap-2">
          <input
            className="bg-norm !opacity-100"
            id="merge-before-applying-input"
            type="checkbox"
            checked={shouldMergeBeforeApplying}
            onChange={(event) => setShouldMergeBeforeApplying(event.target.checked)}
          />
          <div className="text-sm leading-none">Merge before applying</div>
        </label>
        <label className="flex items-center gap-2">
          <input
            className="bg-norm !opacity-100"
            id="persist-applied-updates-input"
            type="checkbox"
            checked={shouldPersistAppliedUpdates}
            onChange={(event) => setShouldPersistAppliedUpdates(event.target.checked)}
          />
          <div className="text-sm leading-none">Persist applied updates</div>
        </label>
        <Button
          size="small"
          onClick={async () => {
            if (shouldMergeBeforeApplying) {
              await mergeApplyMultipleUpdates(applyMultiple)
            } else {
              await applyMultipleUpdates(applyMultiple)
            }
            sendStateChangeMessage()
          }}
          disabled={
            updatesToApply.length === 0 ||
            appliedUpdates + applyMultiple > updatesToApply.length ||
            timeTravelIndex !== appliedUpdates
          }
        >
          {shouldMergeBeforeApplying ? 'Merge apply' : 'Apply'} {applyMultiple} updates
        </Button>
        <Button
          size="small"
          onClick={async () => {
            await applyNextUpdate()
            sendStateChangeMessage()
          }}
          disabled={
            updatesToApply.length === 0 || appliedUpdates >= updatesToApply.length || timeTravelIndex !== appliedUpdates
          }
        >
          Apply next update
        </Button>
        {isSpreadsheet && (
          <div className="flex flex-col gap-1.5">
            <div className="text-sm leading-none">Time travel:</div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="!opacity-100"
                checked={isTimeTravelEnabled}
                onChange={(event) => setIsTimeTravelEnabled(event.target.checked)}
              />
              Enabled
            </label>
            <div className="flex items-center gap-2">
              <Button
                size="small"
                onClick={() => {
                  goToSnapshot(timeTravelIndex - 1)
                    .then(() => sendStateChangeMessage())
                    .catch(console.error)
                }}
                disabled={timeTravelIndex <= 0}
              >
                Previous
              </Button>
              <span className="min-w-[3rem] shrink-0 text-sm">
                {timeTravelIndex} / {snapshots.length > 0 ? snapshots.length - 1 : 0}
              </span>
              <Button
                size="small"
                onClick={() => {
                  goToSnapshot(timeTravelIndex + 1)
                    .then(() => sendStateChangeMessage())
                    .catch(console.error)
                }}
                disabled={timeTravelIndex >= snapshots.length - 1}
              >
                Next
              </Button>
            </div>
            {snapshots.length > 1 && (
              <div className="flex flex-1 items-center gap-2 px-1 pb-2 pt-1 [&_.slider-thumb]:flex">
                <Slider
                  min={0}
                  max={snapshots.length - 1}
                  step={1}
                  value={timeTravelIndex}
                  size={SliderSizeEnum.Small}
                  onInput={(index) => {
                    goToSnapshot(index)
                      .then(() => sendStateChangeMessage())
                      .catch(console.error)
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
