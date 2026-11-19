import { useMemo, useState } from 'react'

import { Button } from '@proton/atoms/Button/Button'
import { Input } from '@proton/atoms/Input/Input'
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip'
import ModalTwo from '@proton/components/components/modalTwo/Modal'
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent'
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter'
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader'
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState'
import { useModalTwoStatic } from '@proton/components/components/modalTwo/useModalTwo'
import type { DataTypesThatDocumentCanBeExportedAs } from '@proton/docs-shared/ExportableDataType'
import { MimeProtonDoc } from '@proton/file-icons/icons/MimeProtonDoc'
import useLoading from '@proton/hooks/useLoading'
import { IcClockRotateLeft } from '@proton/icons/icons/IcClockRotateLeft'
import { IcCrossBig } from '@proton/icons/icons/IcCrossBig'
import { IcEye } from '@proton/icons/icons/IcEye'
import downloadFile from '@proton/shared/lib/helpers/downloadFile'
import { c } from 'ttag'

import { useApplication } from '~/utils/application-context'
import { useDebugMode } from '~/utils/debug-mode-context'
import { downloadJSONFile } from '~/utils/download-json-file'
import { useIsODTEnabled } from '~/utils/flags'

import { exportAndDownload } from '../__utils/downloadExport'
import type { EditorInvoker } from '../__utils/EditorInvoker'
import type { NativeVersionHistory } from '../__utils/NativeVersionHistory'
import { HistoryTimeline } from './HistoryTimeline'
import { SingleRevisionViewer } from './SingleRevisionViewer'

type HistoryViewerModalContentProps = {
  versionHistory: NativeVersionHistory
  /** The document's name, which the exports' file names start with */
  documentName: string
  onClose: () => void
}

function HistoryViewerModalContent({ versionHistory, documentName, onClose }: HistoryViewerModalContentProps) {
  const { logger } = useApplication()
  const { isDebugMode } = useDebugMode()
  const isODTEnabled = useIsODTEnabled()

  const [batchThreshold, setBatchThreshold] = useState(() => versionHistory.batchThreshold)
  const [selectedBatchIndex, setSelectedBatchIndex] = useState(() => versionHistory.batches.length - 1)
  // The view's editor, from its frame's start: what the exports read
  const [editorInvoker, setEditorInvoker] = useState<EditorInvoker | undefined>()

  const [isExporting, withExporting] = useLoading()

  // Read on every render: a new batch threshold batches `versionHistory` again in place
  const isSelectedRevisionCurrentDocument = versionHistory.isCurrentBatchIndex(selectedBatchIndex)

  const selectedBatch = useMemo(() => {
    return versionHistory.batches[selectedBatchIndex]
  }, [versionHistory.batches, selectedBatchIndex])

  /**
   * Shows another revision, in a new view: until that one's editor exists, nothing exports.
   * The same revision at the same batch size keeps its view, and its editor
   */
  const selectRevision = (batchIndex: number, threshold = batchThreshold) => {
    if (batchIndex === selectedBatchIndex && threshold === batchThreshold) {
      return
    }
    setEditorInvoker(undefined)
    setSelectedBatchIndex(batchIndex)
  }

  // `selectedBatch` changes with the batch threshold too, which batches `versionHistory` again in place
  const selectedYjsState = useMemo(() => {
    return selectedBatch && versionHistory.getMergedUpdateForBatchIndex(selectedBatchIndex)
  }, [selectedBatch, selectedBatchIndex, versionHistory])

  const selectedBatchTimestamp = useMemo(() => {
    if (!selectedBatch) {
      return
    }
    return versionHistory.getFormattedDateAndTimeForBatch(selectedBatch)
  }, [selectedBatch, versionHistory])

  const [formattedBatchGroups, setFormattedBatchGroups] = useState(() => versionHistory.getFormattedBatchGroups())

  /** Runs one export of the selected version at a time; a failure is logged, as the title menu's Download does */
  const exportVersion = (run: (editorInvoker: EditorInvoker) => Promise<void>) => {
    if (!editorInvoker) {
      return
    }
    withExporting(run(editorInvoker)).catch((error) => logger.error('Failed to export the version', error))
  }

  const exportAs = (format: DataTypesThatDocumentCanBeExportedAs) =>
    exportVersion((invoker) => exportAndDownload(invoker, documentName, format))

  return (
    <div className="grid h-full grid-cols-[2fr,_minmax(18.75rem,_auto)]">
      {/* Left column */}
      <div className="flex flex-col">
        <div className="flex items-center gap-3 px-3 py-2.5">
          <IcClockRotateLeft size={5} />
          <span data-testid="history-selected-time">{selectedBatchTimestamp}</span>
          <div className="flex items-center gap-1 rounded-lg bg-[--background-weak] px-2 py-1 text-sm text-[--text-weak]">
            <IcEye />
            {c('Info').t`View only`}
          </div>
        </div>
        <div className="min-h-0 flex-grow overflow-scroll">
          {selectedYjsState && (
            <SingleRevisionViewer
              key={`${batchThreshold}-${selectedBatchIndex}`}
              state={selectedYjsState}
              onEditorInvokerRef={setEditorInvoker}
            />
          )}
        </div>
      </div>

      {/* Right column */}
      <div className="flex h-full flex-col justify-between border-l border-[--border-weak] bg-[--optional-background-lowered]">
        {/* Upper content */}
        <div className="grow basis-0 overflow-auto">
          <div className="sticky top-0 flex items-center justify-between gap-2 bg-[--optional-background-lowered] px-3.5 py-1.5">
            <div className="text-bold text-rg">Document History</div>
            <Tooltip title={c('Action').t`Close`}>
              <Button className="shrink-0" icon shape="ghost" onClick={onClose} data-testid="history-close">
                <IcCrossBig className="modal-close-icon" alt={c('Action').t`Close`} />
              </Button>
            </Tooltip>
          </div>
          <div className="flex flex-col">
            <HistoryTimeline
              versionHistory={versionHistory}
              formattedBatchGroups={formattedBatchGroups}
              selectedBatchIndex={selectedBatchIndex}
              onSelectedBatchIndexChange={selectRevision}
            />

            <div className="flex items-center gap-2 px-5 pb-3 pt-5">
              <MimeProtonDoc size={4} />
              <span>{c('Info').t`The Beginning`}</span>
            </div>
          </div>
        </div>

        {/* Bottom-anchored content */}
        <div className="mt-auto flex flex-col items-stretch justify-end px-5 pb-3 pt-5">
          {isDebugMode && (
            // eslint-disable-next-line jsx-a11y/label-has-associated-control
            <label className="my-2 flex items-center gap-2">
              <div>Batch granularity:</div>
              <Input
                type="number"
                value={batchThreshold}
                onChange={(event) => {
                  let value = parseInt(event.target.value)
                  if (isNaN(value) || value < 1) {
                    value = 1
                  }
                  setBatchThreshold(value)
                  versionHistory.setBatchThreshold(value)
                  setFormattedBatchGroups(versionHistory.getFormattedBatchGroups())
                  selectRevision(versionHistory.batches.length - 1, value)
                }}
                min={1}
                data-testid="history-batch-granularity"
              />
            </label>
          )}
          {/* /doc's Make a copy and Restore this version come first here; this view has no restore yet */}
          {selectedBatchIndex >= 0 && !isSelectedRevisionCurrentDocument && (
            <>
              <Button
                className="mt-2 w-full"
                data-testid="export-revision"
                loading={isExporting}
                disabled={!editorInvoker}
                onClick={() => exportAs('docx')}
              >
                {c('Action').t`Export this version (as docx)`}
              </Button>
              {isODTEnabled && (
                <Button
                  className="mt-2 w-full"
                  data-testid="export-revision-odt"
                  loading={isExporting}
                  disabled={!editorInvoker}
                  onClick={() => exportAs('odt')}
                >
                  {c('Action').t`Export this version (as odt) (Beta)`}
                </Button>
              )}
              {isDebugMode && (
                <>
                  <Button
                    className="mt-2 w-full"
                    data-testid="export-revision-editor-state"
                    loading={isExporting}
                    disabled={!editorInvoker}
                    onClick={() =>
                      exportVersion(async (invoker) => {
                        const data = await invoker.getCurrentEditorState()
                        if (!data) {
                          return
                        }
                        downloadJSONFile(data, `${documentName}-editor-state-${selectedBatchTimestamp}.json`)
                      })
                    }
                  >
                    {c('Action').t`Export editor state for version`}
                  </Button>
                  <Button
                    className="mt-2 w-full"
                    data-testid="export-revision-yjs-state"
                    loading={isExporting}
                    disabled={!editorInvoker}
                    onClick={() =>
                      exportVersion(async (invoker) => {
                        const data = await invoker.getDocumentState()
                        if (!data) {
                          return
                        }
                        downloadFile(new Blob([data]), `${documentName}-yjs-state-${selectedBatchTimestamp}.bin`)
                      })
                    }
                  >
                    {c('Action').t`Export YJS state for version`}
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export type HistoryViewerModalProps = ModalStateProps & {
  /** The History Log's Revisions, read as the history opened; none for an empty log */
  versionHistory: NativeVersionHistory | undefined
  documentName: string
}

/**
 * The document's version history, read-only: the Revisions' timeline, a view of the selected one, and its exports.
 * Copied from
 * `applications/docs/src/app/components/document/DocumentLayout/DocumentHeader/HistoryViewerModal/HistoryViewerModal.tsx`,
 * for text documents only, without its restore and copy, which doc2 doesn't have yet. A revision's view, and its
 * exports, wait for its own editor; an empty History Log gets the small modal alone.
 */
function HistoryViewerModal({ versionHistory, documentName, onClose, ...rest }: HistoryViewerModalProps) {
  const isVersionHistoryAvailable = !!versionHistory
  return (
    <ModalTwo
      fullscreen={isVersionHistoryAvailable}
      rootClassName={isVersionHistoryAvailable ? 'p-8 pb-0' : ''}
      className="!rounded-t-xl"
      onClose={onClose}
      data-testid="history-modal"
      {...rest}
    >
      {versionHistory ? (
        <HistoryViewerModalContent versionHistory={versionHistory} documentName={documentName} onClose={onClose} />
      ) : (
        <>
          <ModalTwoHeader title="Document history" />
          <ModalTwoContent>{c('Info').t`No version history available`}</ModalTwoContent>
          <ModalTwoFooter />
        </>
      )}
    </ModalTwo>
  )
}

export function useHistoryViewerModal() {
  return useModalTwoStatic(HistoryViewerModal)
}
