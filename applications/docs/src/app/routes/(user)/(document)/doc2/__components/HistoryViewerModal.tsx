import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'

import { NOTIFICATION_DEFAULT_EXPIRATION_TIME } from '@proton/app-context/notifications/constants'
import { useNotifications } from '@proton/app-context/useNotifications'
import { Button } from '@proton/atoms/Button/Button'
import { Input } from '@proton/atoms/Input/Input'
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip'
import { useConfirmActionModal } from '@proton/components/components/confirmActionModal/ConfirmActionModal'
import ModalTwo from '@proton/components/components/modalTwo/Modal'
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent'
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter'
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader'
import useModalState, { type ModalStateProps } from '@proton/components/components/modalTwo/useModalState'
import NotificationButton from '@proton/components/containers/notifications/NotificationButton'
import type { DataTypesThatDocumentCanBeExportedAs } from '@proton/docs-shared/ExportableDataType'
import { MimeProtonDoc } from '@proton/file-icons/icons/MimeProtonDoc'
import useLoading from '@proton/hooks/useLoading'
import { IcClockRotateLeft } from '@proton/icons/icons/IcClockRotateLeft'
import { IcCrossBig } from '@proton/icons/icons/IcCrossBig'
import { IcEye } from '@proton/icons/icons/IcEye'
import downloadFile from '@proton/shared/lib/helpers/downloadFile'
import type { SerializedEditorState } from 'lexical'
import { c } from 'ttag'

import { BetaFeatureBadge } from '~/components/document/DocumentLayout/DocumentHeader/BetaFeatureBadge'
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
  /** The page's latest live props, read as a restore or its Undo runs: the Undo outlives the history */
  readLive: () => HistoryViewerLiveProps
} & HistoryViewerLiveProps &
  HistoryViewerCopyProps

function HistoryViewerModalContent({
  versionHistory,
  documentName,
  onClose,
  liveEditorInvoker,
  locked,
  readLive,
  makeACopyOfRevision,
  isMakingACopy,
}: HistoryViewerModalContentProps) {
  const { logger } = useApplication()
  const { isDebugMode } = useDebugMode()
  const isODTEnabled = useIsODTEnabled()

  const [batchThreshold, setBatchThreshold] = useState(() => versionHistory.batchThreshold)
  const [selectedBatchIndex, setSelectedBatchIndex] = useState(() => versionHistory.batches.length - 1)
  // The view's editor, from its frame's start: what the exports read
  const [editorInvoker, setEditorInvoker] = useState<EditorInvoker | undefined>()

  const { createNotification, hideNotification } = useNotifications()
  const [confirmModal, showConfirmModal] = useConfirmActionModal()

  const [isRestoring, withRestoring] = useLoading()
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

  // The restore in place, its toast and its Undo. Copied from
  // `applications/docs/src/app/components/document/DocumentLayout/DocumentHeader/HistoryViewerModal/HistoryViewerModal.tsx`,
  // its text branch only, without the comments sentence in the confirmation, which doc2 has no comments for.
  const showSuccessfulUndoNotification = useCallback(() => {
    createNotification({
      type: 'success',
      text: c('Info').t`Undo successful`,
    })
  }, [createNotification])

  /** "Restored version to <time>", with Undo, which gives the live editor `stateBeforeRestoring` back */
  const showSuccessfulRestoreNotification = (
    restoredInvoker: EditorInvoker,
    stateBeforeRestoring: SerializedEditorState,
  ) => {
    const shortDate = versionHistory.getShortFormattedDateAndTimeForBatch(selectedBatch)
    const notificationId = createNotification({
      type: 'success',
      expiration: NOTIFICATION_DEFAULT_EXPIRATION_TIME * 1.5,
      text: (
        <>
          <span>
            {/*
             * Translator: This is a notification that appears after restoring a version of the document from history.
             * It is followed by a timestamp. Example: Restored version to 12/01/2024, 12:00
             */}
            {c('Info').t`Restored version to`} {` ${shortDate}`}
          </span>
          <NotificationButton
            onClick={() => {
              // Locked since, or the editor gone, the undo couldn't be saved: the header shows why, and the toast
              // stays for a click once the lock lifts
              if (!canReplace(restoredInvoker)) {
                return
              }
              hideNotification(notificationId)
              // The history has closed by now: nothing of it is left to show the undo's progress
              restoredInvoker
                .replaceEditorState(stateBeforeRestoring)
                .then(showSuccessfulUndoNotification)
                .catch((error) => logger.error('Failed to undo the restore', error))
            }}
          >{c('Action').t`Undo`}</NotificationButton>
        </>
      ),
    })
  }

  /** Whether the page's latest live editor is still `invoker`, and unlocked, so that a replaced state is saved */
  const canReplace = (invoker: EditorInvoker) => {
    const live = readLive()
    return !live.locked && live.liveEditorInvoker === invoker
  }

  /**
   * After the confirmation, replaces the live editor's state with the view's, an ordinary edit that the live editor
   * sends as any other. The calls go straight to the EditorInvoker, as `restoreRevisionByReplacingLexicalState` makes
   * them: Adapted from `packages/docs-core/lib/EditorController/EditorController.ts`. The button shows progress only once confirmed:
   * the confirmation closes without a call when dismissed. A failure is logged and leaves the history open.
   */
  const restoreByReplacing = () => {
    if (!editorInvoker || !liveEditorInvoker) {
      return
    }
    showConfirmModal({
      title: c('Action').t`Restore this version?`,
      submitText: c('Action').t`Restore`,
      className: 'restore-revision-modal',
      canUndo: true,
      message: c('Info').t`Your current document will be replaced with this version.`,
      onSubmit: () =>
        withRestoring(async () => {
          // The editor may have locked while the confirmation was open, as for a role read again, or be gone
          if (!canReplace(liveEditorInvoker)) {
            return
          }
          const editorStateBeforeReplacing = await liveEditorInvoker.getCurrentEditorState()
          const lexicalState = await editorInvoker.getCurrentEditorState()
          if (!lexicalState || !editorStateBeforeReplacing) {
            return
          }
          // Read again after the reads above, which wait on the editors
          if (!canReplace(liveEditorInvoker)) {
            return
          }
          await liveEditorInvoker.replaceEditorState(lexicalState)
          onClose()
          showSuccessfulRestoreNotification(liveEditorInvoker, editorStateBeforeReplacing)
        }).catch((error) => logger.error('Failed to restore the version', error)),
    })
  }

  /**
   * Make a copy, on the revision's merged state as the timeline holds it, with no round trip through the view's editor:
   * the page's Make a copy seeds and opens it, and shows its error modal on a failure. Disabled until the view's editor
   * exists, as `/doc`'s does nothing before it, and busy while any Make a copy runs, as the page runs one at a time.
   */
  const makeACopy = () => {
    if (!editorInvoker || !selectedYjsState) {
      return
    }
    void makeACopyOfRevision(selectedYjsState)
  }

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
      {confirmModal}
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
          {selectedBatchIndex >= 0 && !isSelectedRevisionCurrentDocument && (
            <>
              {/*
               * Every role's, as on `/doc`, locked or not: a copy is a new document, and a viewer's goes to My files. Copied from
               * `applications/docs/src/app/components/document/DocumentLayout/DocumentHeader/HistoryViewerModal/HistoryViewerModal.tsx`,
               * its restore-revision-by-copy button, disabled until the view's editor exists
               */}
              <Button
                className="w-full"
                data-testid="restore-revision-by-copy"
                color="norm"
                loading={isMakingACopy}
                disabled={!editorInvoker}
                onClick={makeACopy}
              >
                {c('Action').t`Make a copy`}
              </Button>
              {/*
               * Hidden while the live editor is locked, as for a viewer, whose restore couldn't be saved; disabled
               * until the view's editor exists
               */}
              {!locked && (
                <Button
                  className="mt-2 w-full"
                  data-testid="restore-revision-by-replace"
                  loading={isRestoring}
                  disabled={!editorInvoker || !liveEditorInvoker}
                  onClick={restoreByReplacing}
                >
                  {c('Action').t`Restore this version`}
                </Button>
              )}
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
                  {c('Action').t`Export this version (as odt)`}
                  <BetaFeatureBadge />
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

/** What the history reads from the page on every render, not only as it opens */
export type HistoryViewerLiveProps = {
  /** The live document's editor, which a restore replaces the state of, once it shows the document */
  liveEditorInvoker: EditorInvoker | undefined
  /**
   * Whether the live editor is locked now, for any of `getLockCauses`' reasons (a viewer's role among them): a locked
   * user can't restore, nor undo a restore
   */
  locked: boolean
}

/** The page's Make a copy, which the history runs on a revision, from every render */
export type HistoryViewerCopyProps = {
  /** The page's Make a copy, for the selected revision's state */
  makeACopyOfRevision: (state: Uint8Array<ArrayBuffer>) => Promise<void>
  /** Whether the page's Make a copy runs, from here or from the title menu */
  isMakingACopy: boolean
}

/** A page gone, or not yet with an editor: nothing to restore into */
const NOTHING_LIVE: HistoryViewerLiveProps = { liveEditorInvoker: undefined, locked: true }

/** What the history is opened with */
export type HistoryViewerOpenProps = {
  /** The History Log's Revisions, read as the history opened; none for an empty log */
  versionHistory: NativeVersionHistory | undefined
  documentName: string
}

export type HistoryViewerModalProps = ModalStateProps &
  HistoryViewerOpenProps &
  HistoryViewerLiveProps &
  HistoryViewerCopyProps &
  Pick<HistoryViewerModalContentProps, 'readLive'>

/**
 * The document's version history: the Revisions' timeline, a read-only view of the selected one, its copy, its restore
 * and its exports.
 * Copied from
 * `applications/docs/src/app/components/document/DocumentLayout/DocumentHeader/HistoryViewerModal/HistoryViewerModal.tsx`,
 * for text documents only. A revision's view, its copy, its restore and its exports wait for its own editor; an empty History Log gets the small modal alone.
 */
function HistoryViewerModal({
  versionHistory,
  documentName,
  onClose,
  liveEditorInvoker,
  locked,
  readLive,
  makeACopyOfRevision,
  isMakingACopy,
  ...rest
}: HistoryViewerModalProps) {
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
        <HistoryViewerModalContent
          versionHistory={versionHistory}
          documentName={documentName}
          onClose={onClose}
          liveEditorInvoker={liveEditorInvoker}
          locked={locked}
          readLive={readLive}
          makeACopyOfRevision={makeACopyOfRevision}
          isMakingACopy={isMakingACopy}
        />
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

/**
 * The history and what opens it, as `useModalTwoStatic` gives a modal, except that the page passes its live props on
 * every render: a lock that changes while the history is open hides or shows Restore this version at once. The hook
 * keeps the latest committed ones past the history's close, for the restore's Undo, and none once the page is gone.
 */
export function useHistoryViewerModal(liveProps: HistoryViewerLiveProps & HistoryViewerCopyProps) {
  const [modalStateProps, setOpen, render] = useModalState()
  const [openProps, setOpenProps] = useState<HistoryViewerOpenProps>()
  const liveRef = useRef<HistoryViewerLiveProps>(NOTHING_LIVE)
  const readLive = useCallback(() => liveRef.current, [])
  const { liveEditorInvoker, locked } = liveProps
  useLayoutEffect(() => {
    liveRef.current = { liveEditorInvoker, locked }
  }, [liveEditorInvoker, locked])
  useLayoutEffect(
    () => () => {
      liveRef.current = NOTHING_LIVE
    },
    [],
  )

  const showHistory = useCallback(
    (props: HistoryViewerOpenProps) => {
      setOpenProps(props)
      setOpen(true)
    },
    [setOpen],
  )

  const historyModal =
    render && openProps ? (
      <HistoryViewerModal {...modalStateProps} {...openProps} {...liveProps} readLive={readLive} />
    ) : null

  return [historyModal, showHistory] as const
}
