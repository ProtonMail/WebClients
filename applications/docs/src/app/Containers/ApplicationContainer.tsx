import { useCallback, useEffect, useMemo, useState } from 'react'
import { Application } from '@proton/docs-core'
import { useApi, useAuthentication, useConfig } from '@proton/components/hooks'
import { DocsLayout } from '../Components'
import { Route, Switch, useLocation } from 'react-router-dom'
import ApplicationProvider from './ApplicationProvider'
import { DocumentViewer } from '../Components/DocumentViewer'
import { CircleLoader } from '@proton/atoms/CircleLoader'
import { c } from 'ttag'
import { DocumentConverter } from '../Components/DocumentConverter'
import type { DocumentAction, DriveCompat } from '@proton/drive-store'
import { useDriveCompat } from '@proton/drive-store'
import type { FileToDocConversionResult } from '@proton/docs-core'
import type { EditorInitializationConfig, FileToDocPendingConversion } from '@proton/docs-shared'
import { APPS, DRIVE_APP_NAME } from '@proton/shared/lib/constants'
import useEffectOnce from '@proton/hooks/useEffectOnce'
import { getAppHref } from '@proton/shared/lib/apps/helper'
import { getPlatformFriendlyDateForFileName } from '@proton/docs-core'
import { APP_VERSION } from '../config'
import { WordCountContextProvider } from '../Components/WordCount/WordCountProvider'

function ApplicationContainer() {
  void import('../tailwind.scss')

  const api = useApi()
  const driveCompat = useDriveCompat()

  const { API_URL } = useConfig()
  const { UID, getLocalID } = useAuthentication()

  const { search } = useLocation()
  const searchParams = new URLSearchParams(search)
  const [openAction, setOpenAction] = useState<DocumentAction | null>(null)
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

  useEffectOnce(() => {
    const mode = searchParams.get('mode') ?? 'open'
    const parentLinkId = searchParams.get('parentLinkId')
    const volumeId = searchParams.get('volumeId')
    const linkId = searchParams.get('linkId')

    const hasRequiredParametersToLoadOrCreateADocument = volumeId && mode && (linkId || parentLinkId)

    if (!hasRequiredParametersToLoadOrCreateADocument && !driveCompat.isDocsEnabled) {
      window.location.assign(getAppHref('/', APPS.PROTONDRIVE, getLocalID()))
      return
    }

    if (!volumeId || !mode) {
      return
    }

    if (mode === 'open' || mode === 'convert') {
      if (!linkId) {
        return
      }

      setOpenAction({
        mode,
        volumeId,
        linkId,
      })
    } else if (mode === 'create') {
      if (!parentLinkId) {
        return
      }

      setOpenAction({
        mode,
        volumeId,
        parentLinkId,
      })
    }

    if (mode === 'history') {
      if (!linkId) {
        return
      }
      setOpenAction({
        mode,
        volumeId,
        linkId,
      })
    }

    if (mode === 'download') {
      if (!linkId) {
        return
      }
      setOpenAction({
        mode,
        volumeId,
        linkId,
      })
    }
  })

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

  const updateParameters = useCallback((newVolumeId: string, newLinkId: string) => {
    setOpenAction({
      mode: 'open',
      volumeId: newVolumeId,
      linkId: newLinkId,
    })

    const newUrl = new URL(location.href)
    newUrl.searchParams.set('mode', 'open')
    newUrl.searchParams.set('volumeId', newVolumeId)
    newUrl.searchParams.set('linkId', newLinkId)
    history.replaceState(null, '', newUrl.toString())
  }, [])

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
