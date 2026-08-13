import useNotifications from '@proton/components/hooks/useNotifications'
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState'
import { useModalTwoStatic } from '@proton/components/components/modalTwo/useModalTwo'
import BasicModal from '@proton/components/components/modalTwo/BasicModal'
import { useState } from 'react'
import { c } from 'ttag'
import { Button } from '@proton/atoms/Button/Button'
import type { DocumentType } from '@proton/drive-store/store/_documents'
import { useQuickReportModal } from '~/components/QuickReportModal'

interface DriftDetectionErrorModalProps extends ModalStateProps {
  getDebugInfoFile: () => Promise<File | undefined>
  documentType: DocumentType
}

export function DriftDetectionErrorModal({
  open,
  onClose,
  getDebugInfoFile,
  documentType,
  ...modalProps
}: DriftDetectionErrorModalProps) {
  const [isOpen, setIsOpen] = useState(open)

  const { createNotification } = useNotifications()
  const [quickReportModal, openQuickReportModal] = useQuickReportModal()

  const handleClose = () => {
    setIsOpen(false)
    if (typeof onClose !== 'undefined') {
      onClose()
    }
  }

  return (
    <>
      <BasicModal
        isOpen={isOpen === undefined ? true : isOpen}
        onClose={handleClose}
        {...modalProps}
        title={c('Title').t`Editing paused`}
        footer={
          <div className="flex items-center gap-2.5">
            <Button
              color="norm"
              onClick={() => {
                openQuickReportModal({
                  documentType,
                  onSuccess: () => {
                    createNotification({
                      type: 'success',
                      text: c('Notification').t`Report submitted successfully`,
                    })
                  },
                  onFailure: (error) => {
                    console.error(error)
                    createNotification({
                      type: 'error',
                      text: c('Notification').t`Failed to submit report`,
                    })
                  },
                  getDebugInformation: getDebugInfoFile,
                  errorTitle: 'Drift detection error',
                })
              }}
            >{c('Action').t`Report issue`}</Button>
            <Button color="weak" onClick={() => window.location.reload()}>{c('Action').t`Reload spreadsheet`}</Button>
          </div>
        }
      >
        <p>{c('Info')
          .t`Oops! This spreadsheet can’t save your most recent edits, so we’ve paused editing to prevent you from losing your work.`}</p>
        <p>{c('Info')
          .t`Help us improve this experience by reporting the issue. If you’re comfortable sharing spreadsheet content, attach the debug information below to your report.`}</p>
      </BasicModal>
      {quickReportModal}
    </>
  )
}

export const useDriftDetectionErrorModal = () => {
  return useModalTwoStatic(DriftDetectionErrorModal)
}
