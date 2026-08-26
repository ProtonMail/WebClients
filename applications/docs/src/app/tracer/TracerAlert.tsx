import { useNotifications } from '@proton/app-context/useNotifications'
import { useState, useEffect } from 'react'
import { Button } from '@proton/atoms/Button/Button'
import OpenTracer from '@proton/docs-shared/lib/Tracer/Module'
import type { DocumentType } from '@proton/docs-shared'
import BasicModal from '@proton/components/components/modalTwo/BasicModal'
import { c } from 'ttag'
import { useApplication } from '~/utils/application-context'
import { useQuickReportModal } from '~/components/QuickReportModal'

interface TracerAlertProps {
  documentType: DocumentType
}

export default function TracerAlert({ documentType }: TracerAlertProps) {
  const application = useApplication()

  const [downloadLoading, setDownloadLoading] = useState(false)
  const [unreportedAttempts, setUnreportedAttempts] = useState<number>(0)

  const { createNotification } = useNotifications()
  const [quickReportModal, openQuickReportModal] = useQuickReportModal()

  useEffect(() => {
    async function run() {
      const unreportedAttempts = await OpenTracer.getUnreportedAttemptsCount()
      if (unreportedAttempts > 0) {
        setUnreportedAttempts(unreportedAttempts)
      }
    }
    void run()
  }, [])

  async function handleDownloadReport() {
    try {
      setDownloadLoading(true)
      await OpenTracer.downloadReport()
    } catch (_error) {
      application.logger.warn('Error downloading report')
    } finally {
      setDownloadLoading(false)
    }
  }

  async function handleDismiss() {
    try {
      await OpenTracer.dismissAttempts()
    } catch (_error) {
      application.logger.warn('Error dismissing attempts')
    } finally {
      setUnreportedAttempts(0)
    }
  }

  async function handleSuccessfullReport() {
    try {
      await OpenTracer.flush()
    } catch (_error) {
      application.logger.warn('Error flushing db')
    } finally {
      setUnreportedAttempts(0)
    }
  }

  if (unreportedAttempts === 0) {
    return null
  }

  return (
    <>
      <BasicModal
        isOpen={true}
        onClose={handleDismiss}
        title={c('Title').t`Problems Detected`}
        footer={
          <div className="flex items-center gap-2.5">
            <Button
              color="norm"
              onClick={function reportIssue() {
                openQuickReportModal({
                  documentType,
                  onSuccess: () => {
                    createNotification({
                      type: 'success',
                      text: c('Notification').t`Report submitted successfully`,
                    })
                    void handleSuccessfullReport()
                  },
                  onFailure: (error) => {
                    application.logger.error('Error reporting issue', error)
                    createNotification({
                      type: 'error',
                      text: c('Notification').t`Failed to submit report`,
                    })
                  },
                  getDebugInformation: async () => {
                    const result = await OpenTracer.getReportFile()
                    return result?.file
                  },
                  errorTitle: 'Open tracer: loop detected',
                })
              }}
            >{c('Action').t`Report issue`}</Button>
            <Button color="weak" loading={downloadLoading} onClick={handleDownloadReport}>{c('Action')
              .t`Download debug information`}</Button>
          </div>
        }
      >
        <p>{c('Info').t`We've detected that you've previously experienced issues opening a document.`}</p>
        <p>{c('Info')
          .t`Help us improve this experience by reporting the issue. Please attach the debug information below to your report.`}</p>
      </BasicModal>
      {quickReportModal}
    </>
  )
}
