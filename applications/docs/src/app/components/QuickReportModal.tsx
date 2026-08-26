import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState'
import BasicModal from '@proton/components/components/modalTwo/BasicModal'
import { useModalTwoStatic } from '@proton/components/components/modalTwo/useModalTwo'
import { useApi } from '@proton/app-context/useApi'
import { useConfig } from '@proton/app-context/useConfig'
import TextAreaTwo from '@proton/components/components/v2/input/TextArea'
import InputFieldTwo from '@proton/components/components/v2/field/InputField'
import Checkbox from '@proton/components/components/input/Checkbox'
import Progress from '@proton/components/components/progress/Progress'
import { Button } from '@proton/atoms/Button/Button'
import { useEffect, useState } from 'react'
import { c } from 'ttag'
import type { DocumentType } from '@proton/docs-shared'

import { getDrive, MemberRole } from '@proton/drive'
import { reportBug } from '@proton/shared/lib/api/reports'
import { getReportInfo, getClientName } from '@proton/components/helpers/report'
import { useUser } from '@proton/account/user/hooks'
import { useUserSettings } from '@proton/account/userSettings/hooks'
import { useAddresses } from '@proton/account/addresses/hooks'
import useLoading from '@proton/hooks/useLoading'
import { getDocsReportContextLines } from '~/utils/report-context'
import { IcArrowDownLine } from '@proton/icons/icons/IcArrowDownLine'
import downloadFile from '@proton/shared/lib/helpers/downloadFile'
import { BRAND_NAME } from '@proton/shared/lib/constants'

const DriveEmail = 'drive@proton.me'

interface QuickReportModalProps extends ModalStateProps {
  documentType: DocumentType
  onSuccess: () => void
  onFailure: (error: Error) => void
  getDebugInformation: () => Promise<File | undefined>
  errorTitle: string
}

export function QuickReportModal({
  open,
  onClose,
  documentType,
  onSuccess,
  onFailure,
  getDebugInformation,
  errorTitle,
  ...modalProps
}: QuickReportModalProps) {
  const [isOpen, setIsOpen] = useState(open)
  const [isSubmittingReport, withSubmittingReport] = useLoading()

  const api = useApi()
  const { APP_NAME, APP_VERSION, CLIENT_TYPE } = useConfig()
  const [{ Name = '', Email }] = useUser()
  const [userSettings] = useUserSettings()
  const [addresses = []] = useAddresses()
  const email = Email || addresses[0]?.Email || userSettings?.Email?.Value

  const [description, setDescription] = useState('')
  const [shouldIncludeDebugInformation, setShouldIncludeDebugInformation] = useState(false)
  const [debugInformation, setDebugInformation] = useState<File | undefined>(undefined)
  const [debugInfoUploadProgress, setDebugInfoUploadProgress] = useState(0)
  const [isGettingDebugInformation, withGettingDebugInformation] = useLoading()

  useEffect(() => {
    if (shouldIncludeDebugInformation && !debugInformation) {
      void withGettingDebugInformation(getDebugInformation().then(setDebugInformation).catch(console.error))
    }
  }, [shouldIncludeDebugInformation, getDebugInformation, debugInformation, withGettingDebugInformation])

  function handleClose() {
    setIsOpen(false)
    if (typeof onClose !== 'undefined') {
      onClose()
    }
  }

  async function submitReport() {
    try {
      let Category = 'Docs problem'
      if (documentType === 'sheet') {
        Category = 'Sheets problem'
      }

      let Description =
        (description.length > 0 ? description + '\n' : '') +
        getDocsReportContextLines({
          appVersion: APP_VERSION,
          clientType: CLIENT_TYPE,
          documentType,
        }).join('\n')

      if (shouldIncludeDebugInformation) {
        if (!debugInformation) {
          throw new Error('Debug information not found')
        }

        const drive = getDrive()

        const myFiles = await drive.getMyFilesRootFolder()

        const uploader = await drive.getFileUploader(myFiles.uid, debugInformation.name, {
          mediaType: debugInformation.type,
          expectedSize: debugInformation.size,
        })
        const controller = await uploader.uploadFromFile(debugInformation, [], (uploadedBytes) => {
          setDebugInfoUploadProgress(uploadedBytes / debugInformation.size)
        })
        const { nodeUid } = await controller.completion()

        await drive.shareNode(nodeUid, {
          users: [
            {
              email: DriveEmail,
              role: MemberRole.Viewer,
            },
          ],
        })

        const url = await drive.experimental.getNodeUrl(nodeUid)

        Description += `\nDebug information: ${debugInformation.name} (${url})`
      }

      const reportInfo = {
        ...getReportInfo(),
        Category,
        Username: Name,
        Email: email,
        Description,
        Trigger: '',
        Client: getClientName(APP_NAME),
        ClientType: CLIENT_TYPE,
        ClientVersion: APP_VERSION,
        Title: errorTitle,
      }

      await api(reportBug(reportInfo))

      onSuccess()
      handleClose()
    } catch (error) {
      onFailure(error as Error)
    }
  }

  return (
    <BasicModal
      isOpen={isOpen === undefined ? true : isOpen}
      onClose={handleClose}
      {...modalProps}
      title={c('Title').t`Report issue`}
      footer={
        <>
          <Button
            color="norm"
            loading={isSubmittingReport}
            disabled={isSubmittingReport || (shouldIncludeDebugInformation && !debugInformation)}
            onClick={() => {
              void withSubmittingReport(submitReport)
            }}
          >{c('Action').t`Report issue`}</Button>
        </>
      }
    >
      <InputFieldTwo
        as={TextAreaTwo}
        id="Description"
        label={c('Label').t`What happened?`}
        placeholder={c('Placeholder').t`Please describe the problem and include any error messages`}
        value={description}
        onValue={setDescription}
        rows={5}
        disabled={isSubmittingReport}
      />
      <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5">
        <Checkbox
          id="ShouldIncludeDebugInformation"
          checked={shouldIncludeDebugInformation}
          onChange={(e) => setShouldIncludeDebugInformation(e.target.checked)}
          aria-describedby="debug-info-desc"
          disabled={isGettingDebugInformation || isSubmittingReport}
        />
        <label htmlFor="ShouldIncludeDebugInformation" className="font-semibold">{c('Label')
          .t`Include debug information`}</label>
        {shouldIncludeDebugInformation && (
          <div id="debug-info-desc" className="col-start-2">
            {c('Info')
              .t`To help troubleshoot the issue, debug information will be uploaded to your Drive and shared securely with the ${BRAND_NAME} support team. It may include file contents. You can stop sharing at any time, and the shared data is deleted after the review is complete.`}
          </div>
        )}
        {shouldIncludeDebugInformation && debugInformation && (
          <div className="col-start-2">
            <div className="flex items-center gap-2">
              <div className="mr-auto">{debugInformation.name}</div>
              <Button
                size="small"
                color="weak"
                icon={true}
                onClick={() => {
                  downloadFile(debugInformation, debugInformation.name)
                }}
              >
                <IcArrowDownLine size={4} />
                <span className="sr-only">{c('Action').t`Download debug information`}</span>
              </Button>
            </div>
            <Progress value={debugInfoUploadProgress} max={1} />
          </div>
        )}
      </div>
    </BasicModal>
  )
}

export function useQuickReportModal() {
  return useModalTwoStatic(QuickReportModal)
}
