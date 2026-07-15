import { useState, useEffect } from 'react'
import { Button } from '@proton/atoms/Button/Button'
import OpenTracer from '@proton/docs-shared/lib/Tracer/Module'
import type { Attempt } from '@proton/docs-shared/lib/Tracer/Module'
import BasicModal from '@proton/components/components/modalTwo/BasicModal'
import { c } from 'ttag'

interface TracerAlertProps {
  openBugReportModal: () => void
}

export default function TracerAlert({ openBugReportModal }: TracerAlertProps) {
  const [loading, setLoading] = useState(false)
  const [unreportedAttempts, setUnreportedAttempts] = useState<Attempt[]>([])

  useEffect(() => {
    async function run() {
      const unreportedAttempts = await OpenTracer.getUnreportedAttempts()
      if (unreportedAttempts.length > 0) {
        setUnreportedAttempts(unreportedAttempts)
      }
    }
    void run()
  }, [])

  async function handleDownloadReport() {
    try {
      setLoading(true)
      await OpenTracer.downloadReport(unreportedAttempts)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
      handleDismiss()
    }
  }

  function handleDismiss() {
    setUnreportedAttempts([])
  }

  if (unreportedAttempts.length === 0) {
    return null
  }

  return (
    <BasicModal
      isOpen={true}
      onClose={handleDismiss}
      title={c('Title').t`Problems Detected`}
      footer={
        <div className="flex items-center gap-2.5">
          <Button color="norm" onClick={openBugReportModal}>{c('Action').t`Report issue`}</Button>
          <Button color="weak" loading={loading} onClick={handleDownloadReport}>{c('Action')
            .t`Download debug information`}</Button>
        </div>
      }
    >
      <p>{c('Info').t`We've detected that you've previously experienced issues opening a document.`}</p>
      <p>{c('Info')
        .t`Help us improve this experience by reporting the issue. Please attach the debug information below to your report.`}</p>
    </BasicModal>
  )
}
