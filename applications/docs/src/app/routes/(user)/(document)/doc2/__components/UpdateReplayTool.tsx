import { useState } from 'react'

import { Button } from '@proton/atoms/Button/Button'
import { IcCross } from '@proton/icons/icons/IcCross'
import { mergeUpdates } from 'yjs'

import { useApplication } from '~/utils/application-context'

import type { EditorInvoker } from '../__utils/EditorInvoker'

export type UpdateReplayToolProps = {
  onClose: () => void
  editorInvoker: Pick<EditorInvoker, 'receiveMessage'>
  /** Sends an applied update to the server as the user's own edit */
  persistUpdate: (update: Uint8Array<ArrayBuffer>) => void
}

/**
 * Copied from /doc's `components/document/DocumentViewer/UpdateReplayTool.tsx`, which takes docs-core's editor
 * controller, for a text document: it applies the updates of a file, such as "Download all updates", to the editor
 * one at a time or several at once. Left out: the spreadsheet time travel, and the multi-tab sync over a local relay.
 */
export default function UpdateReplayTool({ onClose, editorInvoker, persistUpdate }: UpdateReplayToolProps) {
  const { logger } = useApplication()
  const [updatesToApply, setUpdatesToApply] = useState<Uint8Array<ArrayBuffer>[]>([])
  const [appliedUpdates, setAppliedUpdates] = useState(0)
  const [applyMultiple, setApplyMultiple] = useState(1)
  const [shouldMergeBeforeApplying, setShouldMergeBeforeApplying] = useState(false)
  const [shouldPersistAppliedUpdates, setShouldPersistAppliedUpdates] = useState(false)
  const [isApplying, setIsApplying] = useState(false)

  const applyUpdates = async (count: number) => {
    const updates = updatesToApply.slice(appliedUpdates, appliedUpdates + count)
    const steps = shouldMergeBeforeApplying
      ? [{ content: mergeUpdates(updates) as Uint8Array<ArrayBuffer>, updateCount: updates.length }]
      : updates.map((content) => ({ content, updateCount: 1 }))
    setIsApplying(true)
    try {
      // Counted one step at a time, so a failure part way never has the next click apply, and persist, a step again
      for (const { content, updateCount } of steps) {
        await editorInvoker.receiveMessage({ type: { wrapper: 'du' }, content })
        if (shouldPersistAppliedUpdates) {
          persistUpdate(content)
        }
        setAppliedUpdates((applied) => applied + updateCount)
      }
    } catch (error) {
      logger.error('Update Replay Tool failed to apply an update', error as Error)
    } finally {
      setIsApplying(false)
    }
  }

  return (
    <div
      className="flex !min-w-[20rem] flex-col rounded border border-[--border-weak] bg-[--background-weak] px-1 py-1 [&_button]:flex [&_button]:items-center [&_button]:justify-between [&_button]:gap-3 [&_button]:text-left"
      data-testid="update-replay-tool"
    >
      <div className="mt-1 flex items-center justify-between gap-2 px-2 font-semibold">
        <div>Update Replay Tool</div>
        <button
          className="flex items-center justify-center rounded-full border border-[--border-weak] bg-[--background-weak] p-1 hover:bg-[--background-strong]"
          onClick={onClose}
        >
          <div className="sr-only">Close update replay tool</div>
          <IcCross className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex flex-col gap-2 p-2">
        <label>
          <div className="mb-1.5 text-sm leading-none">Updates to apply:</div>
          <input
            type="file"
            data-testid="replay-updates-input"
            onChange={async (event) => {
              const file = event.target.files?.[0]
              if (!file) {
                return
              }
              try {
                setUpdatesToApply(await readUpdatesFile(file))
                setAppliedUpdates(0)
              } catch (error) {
                logger.error('Update Replay Tool failed to read the file', error as Error)
              }
            }}
            disabled={updatesToApply.length > 0}
          />
        </label>
        <div>
          Applied: {appliedUpdates} / {updatesToApply.length}
        </div>
        <label>
          <div className="mb-1.5 text-sm leading-none">Apply multiple:</div>
          <input
            className="bg-norm"
            type="number"
            min={1}
            value={applyMultiple}
            onChange={(event) => setApplyMultiple(Math.max(1, parseInt(event.target.value) || 1))}
            disabled={updatesToApply.length === 0}
          />
        </label>
        <label className="flex items-center gap-2">
          <input
            className="bg-norm !opacity-100"
            type="checkbox"
            checked={shouldMergeBeforeApplying}
            onChange={(event) => setShouldMergeBeforeApplying(event.target.checked)}
          />
          <div className="text-sm leading-none">Merge before applying</div>
        </label>
        <label className="flex items-center gap-2">
          <input
            className="bg-norm !opacity-100"
            type="checkbox"
            checked={shouldPersistAppliedUpdates}
            onChange={(event) => setShouldPersistAppliedUpdates(event.target.checked)}
          />
          <div className="text-sm leading-none">Persist applied updates</div>
        </label>
        <Button
          size="small"
          onClick={() => applyUpdates(applyMultiple)}
          disabled={isApplying || appliedUpdates + applyMultiple > updatesToApply.length}
        >
          {shouldMergeBeforeApplying ? 'Merge apply' : 'Apply'} {applyMultiple} updates
        </Button>
        <Button
          size="small"
          onClick={() => applyUpdates(1)}
          disabled={isApplying || appliedUpdates >= updatesToApply.length}
        >
          Apply next update
        </Button>
      </div>
    </div>
  )
}

async function readUpdatesFile(file: File): Promise<Uint8Array<ArrayBuffer>[]> {
  if (!file.name.endsWith('.zip') && file.type !== 'application/zip' && file.type !== 'application/x-zip-compressed') {
    return [new Uint8Array(await file.arrayBuffer())]
  }
  const JSZip = (await import('jszip')).default
  const { files } = await JSZip.loadAsync(file)
  const filenames = Object.keys(files).sort((a, b) => parseInt(a) - parseInt(b))
  return Promise.all(
    filenames.map((filename) => files[filename].async('uint8array') as Promise<Uint8Array<ArrayBuffer>>),
  )
}
