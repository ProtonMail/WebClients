import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react'
import { Redirect, Route, Switch } from 'react-router-dom'

import { CircleLoader } from '@proton/atoms'
import { useApi, useAuthentication, useConfig } from '@proton/components'
import type { FileToDocConversionResult } from '@proton/docs-core'
import { Application, getPlatformFriendlyDateForFileName } from '@proton/docs-core'
import type { EditorInitializationConfig, FileToDocPendingConversion } from '@proton/docs-shared'
import type { DocumentAction, DriveCompat, NodeMeta } from '@proton/drive-store'
import { useDriveCompat } from '@proton/drive-store'
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants'
import { c } from 'ttag'

import { UserLayout } from '../../Components'
import { DocumentConverter } from '../../Components/DocumentConverter'
import { DocumentViewer } from '../../Components/DocumentViewer'
import { useDriveDocsLandingPageFeatureFlag } from '../../Components/Homepage/useDriveDocsLandingPageFeatureFlag'
import { WordCountContextProvider } from '../../Components/WordCount/WordCountProvider'
import { APP_VERSION } from '../../config'
import ApplicationProvider, { useApplication } from '../../Containers/ApplicationProvider'
import { useDocsUrlBar } from '../../Containers/useDocsUrlBar'

const HomepageRoute = lazy(() => import('../../Components/Homepage/HomepageRoute'))

function UserApplicationContent() {
  const api = useApi()
  const driveCompat = useDriveCompat()
  const { API_URL } = useConfig()
  const { UID } = useAuthentication()
  const isLandingPageEnabled = useDriveDocsLandingPageFeatureFlag()

  const application = useMemo(() => {
    return new Application(
      api,
      undefined,
      {
        apiUrl: API_URL,
        uid: UID,
      },
      { userCompat: driveCompat },
      APP_VERSION,
    )
    // Ensure only one application instance is created
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <ApplicationProvider application={application}>
      <Switch>
        <Route path={'/doc'}>
          <DocsRoute driveCompat={driveCompat} />
        </Route>
        <Route path={['/most-recent', '/owned-by-me', '/owned-by-others']}>
          {isLandingPageEnabled ? (
            <Suspense>
              <HomepageRoute />
            </Suspense>
          ) : (
            <Redirect to="/doc" />
          )}
        </Route>
        <Route
          path="*"
          render={(props) => {
            const isOpenDocumentLink = props.location.search.includes('mode=open')
            return isLandingPageEnabled && !isOpenDocumentLink ? (
              <Redirect to="/most-recent" />
            ) : (
              <Redirect to={{ pathname: '/doc', search: props.location.search }} />
            )
          }}
        />
      </Switch>
      {driveCompat.modals}
    </ApplicationProvider>
  )
}

function DocsRoute({ driveCompat }: { driveCompat: DriveCompat }) {
  void import('../../tailwind.scss')
  const application = useApplication()

  const { openAction, updateParameters } = useDocsUrlBar({ isDocsEnabled: driveCompat.isDocsEnabled })

  const [action, setAction] = useState<DocumentAction['mode']>()
  const [isCreatingNewDocument, setIsCreatingNewDocument] = useState<boolean>(false)
  const [didCreateNewDocument, setDidCreateNewDocument] = useState<boolean>(false)
  const [contentToInject, setContentToInject] = useState<FileToDocPendingConversion | undefined>(undefined)

  const [isAppReady, setIsAppReady] = useState(false)

  useEffect(() => {
    if (!isAppReady) {
      setIsAppReady(true)
    }
  }, [application, isAppReady])

  useEffect(() => {
    if (openAction) {
      application.logger.info('Opening doc through action', openAction)
    }
  }, [application.logger, openAction])

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
    <WordCountContextProvider>
      <UserLayout action={action}>
        <Content
          onConversionSuccess={onConversionSuccess}
          openAction={openAction}
          actionMode={action}
          isCreatingNewDocument={isCreatingNewDocument}
          getNodeContents={driveCompat.getNodeContents}
          editorInitializationConfig={editorInitializationConfig}
        />
      </UserLayout>
    </WordCountContextProvider>
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

  if (!openAction || openAction.mode === 'create' || !openAction.volumeId || !openAction.linkId) {
    return (
      <div className="m-auto">{c('Info')
        .jt`No document supplied in URL. Return to ${DRIVE_APP_NAME} and select a document.`}</div>
    )
  }

  const nodeMeta: NodeMeta = {
    volumeId: openAction.volumeId,
    linkId: openAction.linkId,
  }

  if (openAction.mode === 'convert') {
    return <DocumentConverter onSuccess={onConversionSuccess} getNodeContents={getNodeContents} lookup={nodeMeta} />
  } else {
    return (
      <DocumentViewer editorInitializationConfig={editorInitializationConfig} nodeMeta={nodeMeta} action={actionMode} />
    )
  }
}

export default UserApplicationContent
