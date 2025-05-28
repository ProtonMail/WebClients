import { Button, Input, Tooltip } from '@proton/atoms'
import type { ModalStateProps } from '@proton/components'
import {
  Icon,
  MimeIcon,
  ModalTwo,
  ModalTwoContent,
  ModalTwoFooter,
  ModalTwoHeader,
  useModalTwoStatic,
  useNotifications,
  NotificationButton,
  NOTIFICATION_DEFAULT_EXPIRATION_TIME,
  useConfirmActionModal,
} from '@proton/components'
import type { AuthenticatedDocControllerInterface, NativeVersionHistory } from '@proton/docs-core'
import type { EditorInvoker } from '@proton/docs-core'
import { useCallback, useMemo, useState } from 'react'
import { c } from 'ttag'
import { HistoryTimeline } from './HistoryTimeline'
import { SingleRevisionViewer } from './SingleRevisionViewer'
import { useLoading } from '@proton/hooks/index'
import { type SerializedEditorState } from 'lexical'
import type { EditorControllerInterface } from '@proton/docs-core'
import type { DocumentType } from '@proton/drive-store/store/_documents'
import { useDebug } from '~/components/document/DocumentViewer/DebugMenu'

type RestoreType = 'replace' | 'as-copy'

type HistoryViewerModalContentProps = {
  versionHistory: NativeVersionHistory
  onClose: () => void
  editorController: EditorControllerInterface
  docController: AuthenticatedDocControllerInterface
  documentType: DocumentType
}

function HistoryViewerModalContent({
  versionHistory,
  onClose,
  editorController,
  docController,
  documentType,
}: HistoryViewerModalContentProps) {
  const isDebugEnabled = useDebug()

  const [batchThreshold, setBatchThreshold] = useState(() => versionHistory.batchThreshold)
  const [selectedBatchIndex, setSelectedBatchIndex] = useState(() => versionHistory.batches.length - 1)
  const [editorInvoker, setEditorInvoker] = useState<EditorInvoker | undefined>()
  const { createNotification, hideNotification } = useNotifications()

  const [confirmModal, showConfirmModal] = useConfirmActionModal()

  const [isRestoring, withRestoring] = useLoading()
  const [isRestoringAsCopy, withRestoringAsCopy] = useLoading()

  const isSelectedRevisionCurrentDocument = useMemo(() => {
    return versionHistory.isCurrentBatchIndex(selectedBatchIndex)
  }, [selectedBatchIndex, versionHistory])

  const selectedBatch = useMemo(() => {
    return versionHistory.batches[selectedBatchIndex]
  }, [versionHistory.batches, selectedBatchIndex])

  const selectedYjsState = useMemo(() => {
    return versionHistory.getMergedUpdateForBatchIndex(selectedBatchIndex)
  }, [selectedBatchIndex, versionHistory])

  const selectedBatchTimestamp = useMemo(() => {
    if (!selectedBatch) {
      return
    }
    return versionHistory.getFormattedDateAndTimeForBatch(selectedBatch)
  }, [selectedBatch, versionHistory])

  const [formattedBatchGroups, setFormattedBatchGroups] = useState(() => versionHistory.getFormattedBatchGroups())

  const showSuccessfulUndoNotification = useCallback(() => {
    createNotification({
      type: 'success',
      text: c('Info').t`Undo successful`,
    })
  }, [createNotification])

  const showSuccessfullRestoreNotification = useCallback(
    (editorStateBeforeReplacing: SerializedEditorState) => {
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
                hideNotification(notificationId)
                void withRestoring(
                  editorController
                    .restoreRevisionByReplacing(editorStateBeforeReplacing)
                    .then(showSuccessfulUndoNotification),
                )
              }}
            >{c('Action').t`Undo`}</NotificationButton>
          </>
        ),
      })
    },
    [
      versionHistory,
      selectedBatch,
      createNotification,
      hideNotification,
      withRestoring,
      editorController,
      showSuccessfulUndoNotification,
    ],
  )

  const onRestore = useCallback(
    async (restoreType: RestoreType) => {
      if (!editorInvoker) {
        return
      }

      if (restoreType === 'replace') {
        return new Promise<void>((resolve) => {
          showConfirmModal({
            title: c('Action').t`Restore this version?`,
            submitText: c('Action').t`Restore`,
            className: 'restore-revision-modal',
            canUndo: true,
            message: c('Info')
              .t`Your current document will be replaced with this version. Comments and suggestions will be removed from the document but will remain accessible in the comment history.`,
            onCancel: resolve,
            onSubmit: async () => {
              const editorStateBeforeReplacing = await editorController.getEditorJSON()
              const lexicalState = await editorInvoker.getCurrentEditorState()
              if (!lexicalState || !editorStateBeforeReplacing) {
                resolve()
                return
              }
              await editorController.restoreRevisionByReplacing(lexicalState)
              onClose()
              showSuccessfullRestoreNotification(editorStateBeforeReplacing)
              resolve()
            },
          })
        })
      } else {
        const yjsState = await editorInvoker.getDocumentState()
        if (!yjsState) {
          return
        }
        await docController.restoreRevisionAsCopy(yjsState)
      }
    },
    [editorInvoker, showConfirmModal, editorController, docController, onClose, showSuccessfullRestoreNotification],
  )

  if (!versionHistory.batches.length) {
    return (
      <div className="flex-column flex h-full w-full items-center justify-center">
        {c('Info').t`No version history available`}
      </div>
    )
  }

  return (
    <div className="grid h-full grid-cols-[2fr,_minmax(18.75rem,_auto)]">
      {confirmModal}
      {/* Left column */}
      <div className="flex flex-col">
        <div className="flex items-center gap-3 px-3 py-2.5">
          <Icon name="clock-rotate-left" size={5} />
          {selectedBatchTimestamp}
          <div className="flex items-center gap-1 rounded-lg bg-[--background-weak] px-2 py-1 text-sm text-[--text-weak]">
            <Icon name="eye" />
            {c('Info').t`View only`}
          </div>
        </div>
        <div className="min-h-0 flex-grow overflow-scroll">
          <SingleRevisionViewer
            key={selectedBatchIndex}
            state={selectedYjsState}
            onEditorInvokerRef={setEditorInvoker}
            documentType={documentType}
          />
        </div>
      </div>

      {/* Right column */}
      <div className="flex h-full flex-col justify-between border-l border-[--border-weak] bg-[--optional-background-lowered]">
        {/* Upper content */}
        <div className="grow basis-0 overflow-auto">
          <div className="sticky top-0 flex items-center justify-between gap-2 bg-[--optional-background-lowered] px-3.5 py-1.5">
            <div className="text-bold text-rg">Document History</div>
            <Tooltip title={c('Action').t`Close`}>
              <Button className="shrink-0" icon shape="ghost" onClick={onClose}>
                <Icon className="modal-close-icon" name="cross-big" alt={c('Action').t`Close`} />
              </Button>
            </Tooltip>
          </div>
          <div className="flex flex-col">
            <HistoryTimeline
              versionHistory={versionHistory}
              formattedBatchGroups={formattedBatchGroups}
              selectedBatchIndex={selectedBatchIndex}
              onSelectedBatchIndexChange={setSelectedBatchIndex}
            />

            <div className="flex items-center gap-2 px-5 pb-3 pt-5">
              <MimeIcon name="proton-doc" size={4} />
              <span>{c('Info').t`The Beginning`}</span>
            </div>
          </div>
        </div>

        {/* Bottom-anchored content */}
        <div className="mt-auto flex flex-col items-stretch justify-end px-5 pb-3 pt-5">
          {isDebugEnabled && (
            // eslint-disable-next-line jsx-a11y/label-has-associated-control
            <label className="my-2 flex items-center gap-2">
              <div>Batch granularity:</div>
              <Input
                type="number"
                value={batchThreshold}
                onChange={(event) => {
                  const value = parseInt(event.target.value)
                  versionHistory.setBatchThreshold(value)
                  setBatchThreshold(value)
                  setFormattedBatchGroups(versionHistory.getFormattedBatchGroups())
                }}
                min={1}
              />
            </label>
          )}
          {selectedBatchIndex >= 0 && !isSelectedRevisionCurrentDocument && (
            <>
              <Button
                className="mb-2 w-full"
                data-testid="restore-revision-by-copy"
                color="norm"
                loading={isRestoringAsCopy}
                onClick={() => {
                  void withRestoringAsCopy(onRestore('as-copy'))
                }}
              >
                {c('Action').t`Make a copy`}
              </Button>
              <Button
                className="w-full"
                data-testid="restore-revision-by-replace"
                loading={isRestoring}
                onClick={() => {
                  void withRestoring(onRestore('replace'))
                }}
              >
                {c('Action').t`Restore this version`}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

type HistoryViewerModalProps = ModalStateProps & {
  versionHistory: NativeVersionHistory | undefined
  editorController: EditorControllerInterface
  docController: AuthenticatedDocControllerInterface
  documentType: DocumentType
}

function HistoryViewerModal({
  versionHistory,
  onClose,
  editorController,
  docController,
  documentType,
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
          onClose={onClose}
          editorController={editorController}
          docController={docController}
          documentType={documentType}
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

export function useHistoryViewerModal() {
  return useModalTwoStatic(HistoryViewerModal)
}
