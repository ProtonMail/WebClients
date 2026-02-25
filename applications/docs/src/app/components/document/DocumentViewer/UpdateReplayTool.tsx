import { Button } from '@proton/atoms/Button/Button'
import { Slider, SliderSizeEnum } from '@proton/atoms/Slider/Slider'
import { Icon } from '@proton/components/index'
import type { EditorControllerInterface } from '@proton/docs-core/lib/EditorController/EditorController'
import { useState } from 'react'

export function UpdateReplayTool({
  onClose,
  editorController,
  isSpreadsheet,
}: {
  onClose: () => void
  editorController: EditorControllerInterface
  isSpreadsheet: boolean
}) {
  const [updatesToApply, setUpdatesToApply] = useState<Uint8Array<ArrayBuffer>[]>([])
  const [appliedUpdates, setAppliedUpdates] = useState(0)
  const [applyMultiple, setApplyMultiple] = useState(1)
  const [snapshots, setSnapshots] = useState<unknown[]>([])
  const [timeTravelIndex, setTimeTravelIndex] = useState(0)

  const goToSnapshot = async (index: number) => {
    const snapshot = snapshots[index]
    if (snapshot === undefined) {
      return
    }
    await editorController.replaceLocalSpreadsheetState(snapshot as object, false)
    setTimeTravelIndex(index)
  }

  return (
    <div className="flex !min-w-[20rem] flex-col gap-2 rounded border border-[--border-weak] bg-[--background-weak] px-1 py-1 [&_button]:flex [&_button]:items-center [&_button]:justify-between [&_button]:gap-3 [&_button]:text-left">
      <div className="mt-1 flex items-center justify-between gap-2 px-2 font-semibold">
        <div>Update Replay Tool</div>
        <button
          className="flex items-center justify-center rounded-full border border-[--border-weak] bg-[--background-weak] p-1 hover:bg-[--background-strong]"
          onClick={onClose}
        >
          <div className="sr-only">Close menu</div>
          <Icon name="cross" className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex flex-col gap-2 p-2">
        <label>
          <div className="mb-1.5 text-sm leading-none">Updates to apply:</div>
          <input
            type="file"
            accept="application/zip"
            onChange={async (event) => {
              if (!event.target.files) {
                return
              }
              const file = event.target.files[0]
              if (!file) {
                return
              }
              const JSZip = (await import('jszip')).default
              const zip = new JSZip()
              const content = await zip.loadAsync(file)
              const filenames = Object.keys(content.files)
              filenames.sort((a, b) => parseInt(a) - parseInt(b))
              const updates: Uint8Array<ArrayBuffer>[] = []
              for (const filename of filenames) {
                const file = content.files[filename]
                if (!file) {
                  continue
                }
                const update = await file.async('uint8array')
                updates.push(update as Uint8Array<ArrayBuffer>)
              }
              setUpdatesToApply(updates)
              setAppliedUpdates(0)
              const initialState = await editorController.getLocalSpreadsheetStateJSON()
              setSnapshots([initialState])
              setTimeTravelIndex(0)
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
        <Button
          size="small"
          onClick={async () => {
            for (let i = 0; i < applyMultiple; i++) {
              const update = updatesToApply[appliedUpdates + i]
              if (!update) {
                continue
              }
              await editorController.applyUpdate(update)
              const snapshot = await editorController.getLocalSpreadsheetStateJSON()
              setSnapshots((prev) => [...prev, snapshot])
            }
            setAppliedUpdates(appliedUpdates + applyMultiple)
            setTimeTravelIndex(appliedUpdates + applyMultiple)
          }}
          disabled={
            updatesToApply.length === 0 ||
            appliedUpdates + applyMultiple > updatesToApply.length ||
            timeTravelIndex !== appliedUpdates
          }
        >
          Apply {applyMultiple} updates
        </Button>
        <Button
          size="small"
          onClick={async () => {
            const update = updatesToApply[appliedUpdates]
            if (!update) {
              return
            }
            await editorController.applyUpdate(update)
            const snapshot = await editorController.getLocalSpreadsheetStateJSON()
            setSnapshots((prev) => [...prev, snapshot])
            setAppliedUpdates(appliedUpdates + 1)
            setTimeTravelIndex(appliedUpdates + 1)
          }}
          disabled={
            updatesToApply.length === 0 || appliedUpdates >= updatesToApply.length || timeTravelIndex !== appliedUpdates
          }
        >
          Apply next update
        </Button>
        {snapshots.length > 0 && isSpreadsheet && (
          <div className="flex flex-col gap-1.5">
            <div className="text-sm leading-none">Time travel:</div>
            <div className="flex items-center gap-2">
              <Button
                size="small"
                onClick={() => {
                  void goToSnapshot(timeTravelIndex - 1)
                }}
                disabled={timeTravelIndex <= 0}
              >
                Previous
              </Button>
              <span className="min-w-[3rem] shrink-0 text-sm">
                {timeTravelIndex} / {snapshots.length - 1}
              </span>
              <Button
                size="small"
                onClick={() => {
                  void goToSnapshot(timeTravelIndex + 1)
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
                    void goToSnapshot(index)
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
