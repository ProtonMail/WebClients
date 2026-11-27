import { Button } from '@proton/atoms/Button/Button'
import { Slider, SliderSizeEnum } from '@proton/atoms/Slider/Slider'
import type { EditorControllerInterface } from '@proton/docs-core/EditorController/EditorController'
import { IcCheckmarkCircle } from '@proton/icons/icons/IcCheckmarkCircle'
import { IcCross } from '@proton/icons/icons/IcCross'
import { IcCrossCircle } from '@proton/icons/icons/IcCrossCircle'
import { useEffect, useRef, useState } from 'react'
import { useStore } from 'zustand'
import { StepChangesPanel } from './updateReplay/StepChangesPanel'
import { canSyncOverWebSocket, createUpdateReplayToolStore } from './updateReplay/createUpdateReplayToolStore'

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
    shouldUnmountEditorWhileApplying,
    setShouldUnmountEditorWhileApplying,
    hasAppliedRepairedState,
  } = useStore(store)
  const isAtLatestStep = snapshots.length === 0 || timeTravelIndex === snapshots.length - 1
  const canApply = updatesToApply.length > 0 && isAtLatestStep && !hasAppliedRepairedState

  const didSetupInitialConnection = useRef(false)
  useEffect(() => {
    if (!canSyncOverWebSocket() || didSetupInitialConnection.current) {
      return
    }
    createNewConnection()
    didSetupInitialConnection.current = true
    return () => {
      closeConnection()
    }
  }, [createNewConnection, closeConnection])

  return (
    <div className="flex max-h-[calc(100vh-1rem)] w-[24rem] max-w-[calc(100vw-1rem)] flex-col flex-nowrap overflow-y-auto rounded border border-[--border-weak] bg-[--background-weak] px-1 py-1 *:shrink-0 [&_button]:flex [&_button]:items-center [&_button]:justify-between [&_button]:gap-3 [&_button]:text-left">
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
      <div className="flex flex-col flex-nowrap gap-2 p-2">
        {canSyncOverWebSocket() ? (
          <div className="flex items-center gap-2">
            {isConnected ? <IcCheckmarkCircle className="h-3.5 w-3.5" /> : <IcCrossCircle className="h-3.5 w-3.5" />}
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
        ) : (
          <div className="text-sm leading-snug text-[--text-weak]">
            Multi-tab sync uses a local relay on port 3001 and is only available in local dev.
          </div>
        )}
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
            disabled={appliedUpdates > 0}
          />
          <div className="text-sm leading-none">Persist applied updates</div>
        </label>
        {isSpreadsheet && (
          <label className="flex items-center gap-2">
            <input
              className="bg-norm !opacity-100"
              id="unmount-editor-while-applying-input"
              type="checkbox"
              checked={shouldUnmountEditorWhileApplying}
              onChange={(event) => setShouldUnmountEditorWhileApplying(event.target.checked)}
            />
            <div className="text-sm leading-none">Unmount editor while applying, as on load</div>
          </label>
        )}
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
          disabled={!canApply || appliedUpdates + applyMultiple > updatesToApply.length}
        >
          {shouldMergeBeforeApplying ? 'Merge apply' : 'Apply'} {applyMultiple} updates
        </Button>
        <Button
          size="small"
          onClick={async () => {
            await applyNextUpdate()
            sendStateChangeMessage()
          }}
          disabled={!canApply || appliedUpdates >= updatesToApply.length}
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
                disabled={appliedUpdates > 0}
              />
              Enabled
            </label>
            <div className="text-sm text-[--text-weak]">Needed to compare and hold changes.</div>
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
            {isTimeTravelEnabled && <StepChangesPanel store={store} />}
          </div>
        )}
      </div>
    </div>
  )
}
