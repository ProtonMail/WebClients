import { useCallback, useEffect, useMemo, useState } from 'react'
import { Application } from '@proton/docs-core'
import { useApi, useAuthentication, useConfig } from '@proton/components/hooks'
import { DocsLayout } from '../Components'
import { Route, Switch } from 'react-router-dom'
import ApplicationProvider from './ApplicationProvider'
import { DocumentViewer } from '../Components/DocumentViewer'
import { CircleLoader } from '@proton/atoms'
import { c } from 'ttag'
import { DocumentConverter } from '../Components/DocumentConverter'
import type { DocumentAction, DriveCompat } from '@proton/drive-store'
import { useDriveCompat } from '@proton/drive-store'
import type { FileToDocConversionResult } from '@proton/docs-core'
import type { EditorInitializationConfig, FileToDocPendingConversion } from '@proton/docs-shared'
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants'
import { getPlatformFriendlyDateForFileName } from '@proton/docs-core'
import { APP_VERSION } from '../config'
import { WordCountContextProvider } from '../Components/WordCount/WordCountProvider'
import { useDocsUrlBar } from './useDocsUrlBar'

function ApplicationContainer() {
  void import('../tailwind.scss')

  const api = useApi()
  const driveCompat = useDriveCompat()

  const { API_URL } = useConfig()
  const { UID } = useAuthentication()

  const { openAction, updateParameters } = useDocsUrlBar()

  const [action, setAction] = useState<DocumentAction['mode']>()
  const [isCreatingNewDocument, setIsCreatingNewDocument] = useState<boolean>(false)
  const [didCreateNewDocument, setDidCreateNewDocument] = useState<boolean>(false)
  const [contentToInject, setContentToInject] = useState<FileToDocPendingConversion | undefined>(undefined)

  const application = useMemo(() => {
    return new Application(
      api,
      {
        apiUrl: API_URL,
        uid: UID,
      },
      driveCompat,
      APP_VERSION,
    )
    // Ensure only one application instance is created
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [isAppReady, setIsAppReady] = useState(false)

  useEffect(() => {
    if (!isAppReady) {
      setIsAppReady(true)
    }
  }, [application, isAppReady])

  const createNewDocInRoot = useCallback(async () => {
    const date = getPlatformFriendlyDateForFileName()
    const name = c('Title').t`Untitled document ${date}`

    const root =
      openAction && openAction.mode === 'create'
        ? {
            volumeId: openAction.volumeId,
            linkId: openAction.parentLinkId,
          }
        : await driveCompat.getMyFilesNodeMeta()
    const result = await driveCompat.createDocumentNode(root, name)

    return result
  }, [driveCompat, openAction])

  useEffect(() => {
    if (!isAppReady || isCreatingNewDocument) {
      return
    }

    const isOpeningDocsAtRootPage = !openAction
    const isOpeningDocsWithCreateAction = openAction && openAction.mode === 'create'
    const shouldCreateNewRootDoc = isOpeningDocsAtRootPage || isOpeningDocsWithCreateAction

    if (shouldCreateNewRootDoc) {
      setIsCreatingNewDocument(true)

      void createNewDocInRoot().then((result) => {
        updateParameters(result.volumeId, result.linkId)

        setIsCreatingNewDocument(false)
        setDidCreateNewDocument(true)
      })
    }

    const shouldOpenHistory = openAction && openAction.mode === 'history'
    if (shouldOpenHistory) {
      setAction('history')
      updateParameters(openAction.volumeId, openAction.linkId)
    }

    const shouldDownload = openAction && openAction.mode === 'download'
    if (shouldDownload) {
      setAction('download')
      updateParameters(openAction.volumeId, openAction.linkId)
    }
  }, [createNewDocInRoot, isAppReady, isCreatingNewDocument, openAction, updateParameters])

  const onConversionSuccess = useCallback(
    (result: FileToDocConversionResult) => {
      setContentToInject(result.dataToConvert)
      updateParameters(result.newShell.volumeId, result.newShell.linkId)
    },
    [updateParameters],
  )

  const editorInitializationConfig = useMemo((): EditorInitializationConfig | undefined => {
    if (contentToInject) {
      return {
        mode: 'conversion',
        ...contentToInject,
      }
    }
    if (didCreateNewDocument) {
      return {
        mode: 'creation',
      }
    }
    return undefined
  }, [contentToInject, didCreateNewDocument])

  if (!isAppReady) {
    return null
  }

  return (
    <ApplicationProvider application={application}>
      <WordCountContextProvider>
        <DocsLayout action={action}>
          <Switch>
            <Route path={'*'}>
              <Content
                onConversionSuccess={onConversionSuccess}
                openAction={openAction}
                actionMode={action}
                isCreatingNewDocument={isCreatingNewDocument}
                getNodeContents={driveCompat.getNodeContents}
                editorInitializationConfig={editorInitializationConfig}
              />
            </Route>
          </Switch>
          {driveCompat.modals}
        </DocsLayout>
      </WordCountContextProvider>
    </ApplicationProvider>
  )
}

function Content({
  isCreatingNewDocument,
  openAction,
  actionMode,
  onConversionSuccess,
  getNodeContents,
  editorInitializationConfig,
}: {
  openAction: DocumentAction | null
  actionMode: DocumentAction['mode'] | undefined
  isCreatingNewDocument: boolean
  onConversionSuccess: (result: FileToDocConversionResult) => void
  getNodeContents: DriveCompat['getNodeContents']
  editorInitializationConfig?: EditorInitializationConfig
}) {
  if (isCreatingNewDocument) {
    return (
      <div className="flex-column flex h-full w-full items-center justify-center gap-4">
        <CircleLoader size="large" />
        <div className="text-center">{c('Info').t`Creating new document...`}</div>
      </div>
    )
  }

  if (!openAction || openAction.mode === 'create') {
    return (
      <div className="m-auto">{c('Info')
        .jt`No document supplied in URL. Return to ${DRIVE_APP_NAME} and select a document.`}</div>
    )
  }

  const lookup = {
    volumeId: openAction.volumeId,
    linkId: openAction.linkId,
  }

  if (openAction.mode === 'convert') {
    return <DocumentConverter onSuccess={onConversionSuccess} getNodeContents={getNodeContents} lookup={lookup} />
  }

  return <DocumentViewer editorInitializationConfig={editorInitializationConfig} lookup={lookup} action={actionMode} />
}

export default ApplicationContainer
