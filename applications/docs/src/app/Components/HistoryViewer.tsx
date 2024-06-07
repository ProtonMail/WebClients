import { Button } from '@proton/atoms/Button'
import {
  Icon,
  ModalStateProps,
  ModalTwo,
  ModalTwoContent,
  ModalTwoFooter,
  ModalTwoHeader,
  Tooltip,
  useModalTwoStatic,
} from '@proton/components/components'
import { NativeVersionHistory, VersionHistoryBatch } from '@proton/docs-core'
import clsx from '@proton/utils/clsx'
import { useCallback, useMemo, useState } from 'react'
import { c } from 'ttag'
import { EditorFrame } from './EditorFrame'
import { EditorInvoker } from '@proton/docs-core/lib/Bridge/EditorInvoker'
import { Logger } from '@proton/utils/logs'
import { THEME_ID } from '@proton/components/containers/themes/ThemeProvider'
import { DOCS_DEBUG_KEY } from '@proton/docs-shared'

function HistoryViewerModalContent({
  versionHistory,
  onClose,
}: {
  versionHistory: NativeVersionHistory
  onClose: () => void
}) {
  const [batches] = useState<VersionHistoryBatch[]>(() => versionHistory.batches)
  const [selectedBatchIndex, setSelectedBatchIndex] = useState(() => batches.length - 1)

  const selectedBatch = useMemo(() => {
    return batches[selectedBatchIndex]
  }, [batches, selectedBatchIndex])

  const mergedUpdate = useMemo(() => {
    return versionHistory.getMergedUpdateForBatchIndex(selectedBatchIndex)
  }, [selectedBatchIndex, versionHistory])

  const onFrameReady = useCallback(
    (frame: HTMLIFrameElement) => {
      const editorInvoker = new EditorInvoker(frame, new Logger('ViewOnlyEditorInvoker', DOCS_DEBUG_KEY))
      const initialThemeStyles = document.getElementById(THEME_ID)?.innerHTML
      if (initialThemeStyles) {
        void editorInvoker.receiveThemeChanges(initialThemeStyles)
      }
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

  if (!batches.length) {
    return (
      <div className="flex-column flex h-full w-full items-center justify-center">
        No version history batches available
      </div>
    )
  }

  return (
    <div className="grid h-full grid-cols-[2fr,_minmax(20%,_auto)]">
      <div className="flex flex-col">
        <div className="flex items-center gap-3 px-3 py-2.5">
          <Icon name="clock-rotate-left" size={5} />
          {selectedBatchTimestamp}
          <div className="flex items-center gap-1 rounded-lg bg-[--background-weak] px-2 py-1 text-xs text-[--text-weak]">
            <Icon name="eye" />
            View only
          </div>
        </div>
        <div className="min-h-0 flex-grow">
          <EditorFrame key={selectedBatchTimestamp + `${Math.random()}`} isViewOnly onFrameReady={onFrameReady} />
        </div>
      </div>
      <div className="border-l border-[--border-weak]">
        <div className="flex items-center justify-between gap-2 px-3.5 py-1.5">
          <div className="text-bold text-base">Document History</div>
          <Tooltip title={c('Action').t`Close`}>
            <Button className="shrink-0" icon shape="ghost" onClick={onClose}>
              <Icon className="modal-close-icon" name="cross-big" alt={c('Action').t`Close`} />
            </Button>
          </Tooltip>
        </div>
        <div className="flex flex-col-reverse">
          {batches.map((batch, index) => {
            return (
              <button
                key={index}
                className={clsx('px-2.5 py-1.5 text-left', index === selectedBatchIndex && 'bg-[--primary-minor-2]')}
                onClick={() => {
                  setSelectedBatchIndex(index)
                }}
              >
                {versionHistory.getFormattedDateAndTimeForBatch(batch)}
              </button>
            )
          })}
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
          <ModalTwoContent>No version history available</ModalTwoContent>
          <ModalTwoFooter />
        </>
      )}
    </ModalTwo>
  )
}

export const useHistoryViewerModal = () => {
  return useModalTwoStatic(HistoryViewerModal)
}
