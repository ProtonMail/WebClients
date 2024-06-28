import { useCallback, useEffect, useMemo, useState } from 'react'
import { Application } from '@proton/docs-core'
import { useApi, useUser } from '@proton/components/hooks'
import { DocsLayout } from '../Components'
import { Route, Switch, useLocation } from 'react-router-dom'
import ApplicationProvider from './ApplicationProvider'
import { DocumentViewer } from '../Components/DocumentViewer'
import { CircleLoader } from '@proton/atoms/CircleLoader'
import { c } from 'ttag'
import { DocumentConverter } from '../Components/DocumentConverter'
import { useDriveCompat, DocumentAction, DriveCompat } from '@proton/drive-store'
import { FileToDocConversionResult } from '@proton/docs-core'
import { FileToDocPendingConversion } from '@proton/docs-shared'
import { APPS, DRIVE_APP_NAME } from '@proton/shared/lib/constants'
import useEffectOnce from '@proton/hooks/useEffectOnce'
import { getAppHref } from '@proton/shared/lib/apps/helper'
import { getPlatformFriendlyDateForFileName } from '@proton/docs-core'

function ApplicationContainer() {
  import('../tailwind.scss')

  const api = useApi()
  const [user] = useUser()
  const driveCompat = useDriveCompat()

  const { search } = useLocation()
  const searchParams = new URLSearchParams(search)
  const [openAction, setOpenAction] = useState<DocumentAction | null>(null)
  const [action, setAction] = useState<DocumentAction['mode']>()
  const [isCreatingNewDocument, setIsCreatingNewDocument] = useState<boolean>(false)
  const [contentToInject, setContentToInject] = useState<FileToDocPendingConversion | undefined>(undefined)

  const application = useMemo(() => {
    return new Application(api, user, driveCompat)
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
      window.location.assign(getAppHref('/', APPS.PROTONDRIVE))
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

  if (!isAppReady) {
    return null
  }

  return (
    <ApplicationProvider application={application}>
      <DocsLayout action={action}>
        <Switch>
          <Route path={'*'}>
            <Content
              onConversionSuccess={onConversionSuccess}
              openAction={openAction}
              isCreatingNewDocument={isCreatingNewDocument}
              injectWithNewContent={contentToInject}
              getNodeContents={driveCompat.getNodeContents}
            />
          </Route>
        </Switch>
        {driveCompat.modals}
      </DocsLayout>
    </ApplicationProvider>
  )
}

function Content({
  isCreatingNewDocument,
  openAction,
  onConversionSuccess,
  injectWithNewContent,
  getNodeContents,
}: {
  openAction: DocumentAction | null
  isCreatingNewDocument: boolean
  onConversionSuccess: (result: FileToDocConversionResult) => void
  injectWithNewContent?: FileToDocPendingConversion
  getNodeContents: DriveCompat['getNodeContents']
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

  return <DocumentViewer injectWithNewContent={injectWithNewContent} lookup={lookup} />
}

export default ApplicationContainer
