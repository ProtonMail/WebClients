import { useCallback, useEffect, useMemo, useState } from 'react'

import { CircleLoader } from '@proton/atoms'
import type { FileToDocConversionResult } from '@proton/docs-core'
import { getPlatformFriendlyDateForFileName } from '@proton/docs-core'
import type { EditorInitializationConfig, FileToDocPendingConversion } from '@proton/docs-shared'
import type { DocumentAction, DriveCompat, NodeMeta } from '@proton/drive-store'
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants'
import { c } from 'ttag'

import { SharedLayout } from '../SharedLayout'
import { DocumentConverter } from '../../Components/DocumentConverter'
import { DocumentViewer } from '../../Components/DocumentViewer'
import { WordCountContextProvider } from '../../Components/WordCount/WordCountProvider'
import { useApplication } from '../../Containers/ApplicationProvider'
import { useDocsUrlBar } from '../../Containers/useDocsUrlBar'
import { useUser } from '@proton/account/user/hooks'
import UserProvider from '../../Containers/DocsContextProvider'
import { PublicDocumentCopier } from '../../Components/PublicDocumentCopier'
import { getUrlPassword } from '@proton/drive-store/utils/url/password'
import { useEmailOptInModal } from '../../Components/Modals/EmailOptInModal/EmailOptInModal'
import { useDocsNotifications } from '../../Containers/DocsNotificationsProvider'
import { PrivateHookChangesToEvents } from './Hooks/PrivateHookChangesToEvents'
import { useFlag } from '@proton/unleash'

export default function SingleDocumentRoute({ driveCompat }: { driveCompat: DriveCompat }) {
  const application = useApplication()

  const [user] = useUser()

  const { openAction, updateParameters, navigateToAction } = useDocsUrlBar({ isDocsEnabled: driveCompat.isDocsEnabled })

  const [actionMode, setActionMode] = useState<DocumentAction['mode']>()
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
      application.logger.info('Opening doc through action', {
        mode: openAction.mode,
        linkId: 'linkId' in openAction ? openAction.linkId : undefined,
        volumeId: 'volumeId' in openAction ? openAction.volumeId : undefined,
      })
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
    const isUsingNewRoute = openAction && openAction.mode === 'new'
    const shouldCreateNewRootDoc = isOpeningDocsAtRootPage || isOpeningDocsWithCreateAction || isUsingNewRoute
    const isRedirectBackToPublicContext = openAction && openAction.mode === 'open-url-reauth'

    if (isRedirectBackToPublicContext) {
      application.logger.info('Redirecting back to public context', {
        action: openAction,
      })

      navigateToAction(
        {
          ...openAction,
          mode: 'open-url',
          urlPassword: getUrlPassword(),
        },
        'public',
      )
      return
    }

    if (shouldCreateNewRootDoc) {
      setIsCreatingNewDocument(true)

      void createNewDocInRoot().then((result) => {
        updateParameters({ newVolumeId: result.volumeId, newLinkId: result.linkId, pathname: 'doc' })

        setIsCreatingNewDocument(false)
        setDidCreateNewDocument(true)
      })
    }

    const shouldOpenHistory = openAction && openAction.mode === 'history'
    if (shouldOpenHistory) {
      setActionMode('history')
      updateParameters({ newVolumeId: openAction.volumeId, newLinkId: openAction.linkId })
    }

    const shouldDownload = openAction && openAction.mode === 'download'
    if (shouldDownload) {
      setActionMode('download')
      updateParameters({ newVolumeId: openAction.volumeId, newLinkId: openAction.linkId })
    }
  }, [
    application.logger,
    createNewDocInRoot,
    isAppReady,
    isCreatingNewDocument,
    navigateToAction,
    openAction,
    updateParameters,
  ])

  const onConversionSuccess = useCallback(
    (result: FileToDocConversionResult) => {
      setContentToInject(result.dataToConvert)
      updateParameters({ newVolumeId: result.newShell.volumeId, newLinkId: result.newShell.linkId })
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
      <UserProvider publicContext={undefined} privateContext={{ user, compat: driveCompat }}>
        <SharedLayout action={actionMode}>
          <PrivateHookChangesToEvents />
          <Content
            onConversionSuccess={onConversionSuccess}
            openAction={openAction}
            actionMode={actionMode}
            isCreatingNewDocument={isCreatingNewDocument}
            getNodeContents={driveCompat.getNodeContents}
            editorInitializationConfig={editorInitializationConfig}
          />
        </SharedLayout>
      </UserProvider>
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
  const [emailOptInModal, openEmailOptInModal] = useEmailOptInModal()
  const emailFeatureEnabled = useFlag('DocsEnableNotificationsOnNewComment')

  const { emailTitleEnabled, emailNotificationsEnabled, isReady: isNotificationsReady } = useDocsNotifications()

  useEffect(() => {
    if (!isNotificationsReady || !emailFeatureEnabled) {
      return
    }

    if (emailTitleEnabled === null || emailNotificationsEnabled === null) {
      openEmailOptInModal({})
    }
  }, [emailTitleEnabled, emailNotificationsEnabled, openEmailOptInModal, isNotificationsReady, emailFeatureEnabled])

  if (isCreatingNewDocument || openAction?.mode === 'new') {
    return (
      <div className="flex-column flex h-full w-full items-center justify-center gap-4">
        <CircleLoader size="large" />
        <div className="text-center">{c('Info').t`Creating new document...`}</div>
      </div>
    )
  }

  if (openAction?.mode === 'copy-public') {
    return <PublicDocumentCopier />
  }

  /** Waiting for redirection */
  if (openAction?.mode === 'open-url-reauth') {
    return (
      <div className="flex-column flex h-full w-full items-center justify-center gap-4">
        <CircleLoader size="large" />
      </div>
    )
  }

  if (
    !openAction ||
    openAction.mode === 'create' ||
    openAction.mode === 'open-url' ||
    !openAction.volumeId ||
    !openAction.linkId
  ) {
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
      <>
        {emailOptInModal}
        <DocumentViewer
          editorInitializationConfig={editorInitializationConfig}
          nodeMeta={nodeMeta}
          action={actionMode}
        />
      </>
    )
  }
}
