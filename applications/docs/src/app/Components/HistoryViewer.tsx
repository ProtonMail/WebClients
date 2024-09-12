import { Button } from '@proton/atoms/Button'
import type { ModalStateProps } from '@proton/components'
import {
  Icon,
  MimeIcon,
  ModalTwo,
  ModalTwoContent,
  ModalTwoFooter,
  ModalTwoHeader,
  Tooltip,
  useModalTwoStatic,
} from '@proton/components'
import type { NativeVersionHistory } from '@proton/docs-core'
import { EditorInvoker } from '@proton/docs-core/lib/Bridge/EditorInvoker'
import { DOCS_DEBUG_KEY } from '@proton/docs-shared'
import { Logger } from '@proton/utils/logs'
import { useCallback, useMemo, useState } from 'react'
import { c } from 'ttag'
import { EditorFrame } from './EditorFrame'
import HistoryTimeline from './HistoryTimeline'

function HistoryViewerModalContent({
  versionHistory,
  onClose,
}: {
  versionHistory: NativeVersionHistory
  onClose: () => void
}) {
  const [selectedBatchIndex, setSelectedBatchIndex] = useState(() => versionHistory.batches.length - 1)

  const selectedBatch = useMemo(() => {
    return versionHistory.batches[selectedBatchIndex]
  }, [versionHistory.batches, selectedBatchIndex])

  const mergedUpdate = useMemo(() => {
    return versionHistory.getMergedUpdateForBatchIndex(selectedBatchIndex)
  }, [selectedBatchIndex, versionHistory])

  const onFrameReady = useCallback(
    (frame: HTMLIFrameElement) => {
      const editorInvoker = new EditorInvoker(frame, new Logger('ViewOnlyEditorInvoker', DOCS_DEBUG_KEY))
      editorInvoker
        .receiveMessage({
          content: mergedUpdate,
          type: {
            wrapper: 'du',
          },
        })
        .catch(console.error)
      editorInvoker.showEditor().catch(console.error)
    },
    [mergedUpdate],
  )

  const selectedBatchTimestamp = useMemo(() => {
    if (!selectedBatch) {
      return
    }
    return versionHistory.getFormattedDateAndTimeForBatch(selectedBatch)
  }, [selectedBatch, versionHistory])

  if (!versionHistory.batches.length) {
    return (
      <div className="flex-column flex h-full w-full items-center justify-center">
        {c('Info').t`No version history batches available`}
      </div>
    )
  }

  return (
    <div className="grid h-full grid-cols-[2fr,_minmax(18.75rem,_auto)]">
      <div className="flex flex-col">
        <div className="flex items-center gap-3 px-3 py-2.5">
          <Icon name="clock-rotate-left" size={5} />
          {selectedBatchTimestamp}
          <div className="flex items-center gap-1 rounded-lg bg-[--background-weak] px-2 py-1 text-xs text-[--text-weak]">
            <Icon name="eye" />
            {c('Info').t`View only`}
          </div>
        </div>
        <div className="min-h-0 flex-grow overflow-scroll">
          <EditorFrame key={selectedBatchTimestamp + `${Math.random()}`} isViewOnly onFrameReady={onFrameReady} />
        </div>
      </div>
      <div className="overflow-scroll border-l border-[--border-weak] bg-[--optional-background-lowered]">
        <div className="sticky top-0 flex items-center justify-between gap-2 bg-[--optional-background-lowered] px-3.5 py-1.5">
          <div className="text-bold text-base">Document History</div>
          <Tooltip title={c('Action').t`Close`}>
            <Button className="shrink-0" icon shape="ghost" onClick={onClose}>
              <Icon className="modal-close-icon" name="cross-big" alt={c('Action').t`Close`} />
            </Button>
          </Tooltip>
        </div>
        <div className="flex flex-col">
          <HistoryTimeline
            versionHistory={versionHistory}
            selectedBatchIndex={selectedBatchIndex}
            onSelectedBatchIndexChange={setSelectedBatchIndex}
          />
          <div className="flex items-center gap-2 px-5 pb-3 pt-5">
            <MimeIcon name="proton-doc" size={4} />
            <span>{c('Info').t`The Beginning`}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

interface HistoryViewerModalProps extends ModalStateProps {
  versionHistory: NativeVersionHistory | undefined
}

function HistoryViewerModal({ versionHistory, onClose, ...rest }: HistoryViewerModalProps) {
  const isVersionHistoryAvailable = !!versionHistory
  return (
    <ModalTwo
      fullscreen={isVersionHistoryAvailable}
      rootClassName={isVersionHistoryAvailable ? 'p-8 pb-0' : ''}
      className="!rounded-t-xl"
      onClose={onClose}
      {...rest}
    >
      {versionHistory ? (
        <HistoryViewerModalContent versionHistory={versionHistory} onClose={onClose} />
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

export const useHistoryViewerModal = () => {
  return useModalTwoStatic(HistoryViewerModal)
}
