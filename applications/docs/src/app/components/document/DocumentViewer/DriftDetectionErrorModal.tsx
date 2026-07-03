import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState'
import { useModalTwoStatic } from '@proton/components/components/modalTwo/useModalTwo'
import BasicModal from '@proton/components/components/modalTwo/BasicModal'
import { useState } from 'react'
import { c } from 'ttag'
import useLoading from '@proton/hooks/useLoading'
import { Button } from '@proton/atoms/Button/Button'

interface DriftDetectionErrorModalProps extends ModalStateProps {
  openBugReportModal: () => void
  downloadDebugInfo: () => Promise<void>
}

export function DriftDetectionErrorModal({
  open,
  onClose,
  openBugReportModal,
  downloadDebugInfo,
  ...modalProps
}: DriftDetectionErrorModalProps) {
  const [isOpen, setIsOpen] = useState(open)
  const [isDownloadingDebugInfo, withDownloadingDebugInfo] = useLoading()

  const handleClose = () => {
    setIsOpen(false)
    if (typeof onClose !== 'undefined') {
      onClose()
    }
  }

  return (
    <BasicModal
      isOpen={isOpen === undefined ? true : isOpen}
      onClose={handleClose}
      {...modalProps}
      title={c('Title').t`Editing paused`}
      footer={
        <div className="flex items-center gap-2.5">
          <Button color="norm" onClick={openBugReportModal}>{c('Action').t`Report issue`}</Button>
          <Button
            color="weak"
            loading={isDownloadingDebugInfo}
            onClick={() => withDownloadingDebugInfo(downloadDebugInfo())}
          >{c('Action').t`Download debug information`}</Button>
          <Button color="weak" onClick={() => window.location.reload()}>{c('Action').t`Reload spreadsheet`}</Button>
        </div>
      }
    >
      <p>{c('Info')
        .t`Oops! This spreadsheet can’t save your most recent edits, so we’ve paused editing to prevent you from losing your work.`}</p>
      <p>{c('Info')
        .t`Help us improve this experience by reporting the issue. If you’re comfortable sharing spreadsheet content, attach the debug information below to your report.`}</p>
    </BasicModal>
  )
}

export const useDriftDetectionErrorModal = () => {
  return useModalTwoStatic(DriftDetectionErrorModal)
}
