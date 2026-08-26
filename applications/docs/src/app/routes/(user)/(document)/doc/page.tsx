import { useCallback, useEffect, useMemo, useState } from 'react'

import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader'
import type { FileToDocConversionResult } from '@proton/docs-core'
import { getPlatformFriendlyDateForFileName } from '@proton/shared/lib/docs/utils/getPlatformFriendlyDateForFileName'
import type {
  DocumentAction,
  EditorInitializationConfig,
  FileToDocPendingConversion,
  NodeMeta,
} from '@proton/docs-shared'
import type { DriveCompat } from '@proton/drive-store'
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants'
import { c } from 'ttag'

import { DocumentLayout } from '~/components/document/DocumentLayout/DocumentLayout'
import { DocumentConverter } from './__components/DocumentConverter'
import { DocumentViewer } from '~/components/document/DocumentViewer/DocumentViewer'
import { WordCountProvider } from '~/components/document/WordCount'
import { useApplication } from '~/utils/application-context'
import { useDocsUrlBar } from '~/utils/docs-url-bar'
import { useUser } from '@proton/account/user/hooks'
import { DocsProvider } from '~/components/document/context'
import { PublicDocumentCopier } from './__components/PublicDocumentCopier'
import { getUrlPassword } from '@proton/drive-store/utils/url/password'
import { useEmailOptInModal } from './__components/EmailOptInModal/EmailOptInModal'
import { useDocsNotifications } from '../../__utils/notifications-context'
import { PrivateHookChangesToEvents } from './__components/PrivateHookChangesToEvents'
import { useFlag } from '@proton/unleash/useFlag'
import useEffectOnce from '@proton/hooks/useEffectOnce'
import { useLocation } from 'react-router-dom-v5-compat'
import { tmpConvertNewDocTypeToOld } from '@proton/drive-store/store/_documents'
import OpenTracer from '@proton/docs-shared/lib/Tracer/Module'

export default function UserDocumentPage({ driveCompat }: { driveCompat: DriveCompat }) {
  const application = useApplication()

  const [user] = useUser()

  const { openAction, searchParams, updateParameters, navigateToAction, removeLocalIDFromUrl } = useDocsUrlBar()

  useEffect(() => {
    void OpenTracer.trace('boot_doc_page_mount', { mode: openAction?.mode })
  }, [openAction, searchParams])

  useEffectOnce(() => {
    void OpenTracer.trace('boot_doc_page_remove_local_id')
    removeLocalIDFromUrl()
  })

  const [actionMode, setActionMode] = useState<DocumentAction['mode']>()
  const [isCreatingNewDocument, setIsCreatingNewDocument] = useState<boolean>(false)
  const [didCreateNewDocument, setDidCreateNewDocument] = useState<boolean>(false)
  const [contentToInject, setContentToInject] = useState<FileToDocPendingConversion | undefined>(undefined)

  useEffect(() => {
    if (openAction) {
      application.logger.info('Opening doc through action', {
        mode: openAction.mode,
        linkId: 'linkId' in openAction ? openAction.linkId : undefined,
        volumeId: 'volumeId' in openAction ? openAction.volumeId : undefined,
      })
      void OpenTracer.trace('boot_doc_page_open_action', {
        mode: openAction.mode,
        linkId: 'linkId' in openAction ? openAction.linkId : undefined,
        volumeId: 'volumeId' in openAction ? openAction.volumeId : undefined,
      })
    }
  }, [application.logger, openAction])

  const createNewDocInRoot = useCallback(async () => {
    application.logger.info('Creating new document in root')
    void OpenTracer.trace('boot_doc_page_create_new_doc_in_root')

    const date = getPlatformFriendlyDateForFileName()
    const docType = openAction?.type ?? 'doc'
    const name =
      docType === 'sheet' ? c('Title').t`Untitled spreadsheet ${date}` : c('Title').t`Untitled document ${date}`

    const root =
      openAction && openAction.mode === 'create'
        ? {
            volumeId: openAction.volumeId,
            linkId: openAction.parentLinkId,
          }
        : await driveCompat.getMyFilesNodeMeta()
    const result = await driveCompat.createDocumentNode(
      root,
      name,
      tmpConvertNewDocTypeToOld(openAction?.type ?? 'doc'),
    )

    return result
  }, [application.logger, driveCompat, openAction])

  useEffect(() => {
    if (isCreatingNewDocument) {
      return
    }

    const isOpeningDocsAtRootPage = !openAction && searchParams.size === 0
    const isOpeningDocsWithCreateAction = openAction && openAction.mode === 'create'
    const isUsingNewRoute = openAction && openAction.mode === 'new'
    const shouldCreateNewRootDoc = isOpeningDocsAtRootPage || isOpeningDocsWithCreateAction || isUsingNewRoute
    const isRedirectBackToPublicContext = openAction && openAction.mode === 'open-url-reauth'

    if (isRedirectBackToPublicContext) {
      application.logger.info('Redirecting back to public context', {
        action: openAction,
      })
      void OpenTracer.trace('boot_doc_page_redirect_back_to_public_context', { mode: openAction?.mode })

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
        void OpenTracer.trace('boot_doc_page_create_new_doc_in_root_success')
        updateParameters({
          newVolumeId: result.volumeId,
          newLinkId: result.linkId,
          pathname: tmpConvertNewDocTypeToOld(openAction?.type ?? 'doc'),
        })

        setIsCreatingNewDocument(false)
        setDidCreateNewDocument(true)
      })
    }

    const shouldOpenHistory = openAction && openAction.mode === 'history'
    if (shouldOpenHistory) {
      void OpenTracer.trace('boot_doc_page_should_open_history', { mode: openAction?.mode })
      setActionMode('history')
      updateParameters({ newVolumeId: openAction.volumeId, newLinkId: openAction.linkId })
    }

    const shouldDownload = openAction && openAction.mode === 'download'
    if (shouldDownload) {
      void OpenTracer.trace('boot_doc_page_should_download', { mode: openAction?.mode })
      setActionMode('download')
      updateParameters({ newVolumeId: openAction.volumeId, newLinkId: openAction.linkId })
    }
  }, [
    application.logger,
    createNewDocInRoot,
    isCreatingNewDocument,
    navigateToAction,
    openAction,
    searchParams.size,
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

  return (
    <WordCountProvider>
      <DocsProvider publicContext={undefined} privateContext={{ user, compat: driveCompat }}>
        <DocumentLayout documentType={tmpConvertNewDocTypeToOld(openAction?.type ?? 'doc')} actionMode={actionMode}>
          <PrivateHookChangesToEvents />
          <Content
            onConversionSuccess={onConversionSuccess}
            openAction={openAction}
            actionMode={actionMode}
            isCreatingNewDocument={isCreatingNewDocument}
            getNodeContents={driveCompat.getNodeContents}
            editorInitializationConfig={editorInitializationConfig}
          />
        </DocumentLayout>
      </DocsProvider>
    </WordCountProvider>
  )
}

type ContentPhase =
  'creating_new_document' | 'copy_public' | 'open_url_reauth' | 'invalid_open_action' | 'convert' | 'document_viewer'

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

  // creating a node meta object after the early returns causes too many downstream re-renders since it is not stable
  // so we memoize it beforehand and early-return if the memoized object is not available.
  const nodeMeta = useMemo((): NodeMeta | null => {
    if (!openAction) {
      return null
    }
    const hasVolumeId = 'volumeId' in openAction
    const hasLinkId = 'linkId' in openAction
    if (hasLinkId && hasVolumeId) {
      return {
        volumeId: openAction.volumeId,
        linkId: openAction.linkId,
      }
    }
    return null
  }, [openAction])

  const { search } = useLocation()

  const contentPhase = useMemo((): ContentPhase => {
    if (isCreatingNewDocument || openAction?.mode === 'new') {
      return 'creating_new_document'
    }
    if (openAction?.mode === 'copy-public') {
      return 'copy_public'
    }
    if (openAction?.mode === 'open-url-reauth') {
      return 'open_url_reauth'
    }
    if (
      !openAction ||
      openAction.mode === 'create' ||
      openAction.mode === 'open-url-download' ||
      openAction.mode === 'open-url' ||
      !openAction.volumeId ||
      !openAction.linkId ||
      !nodeMeta
    ) {
      return 'invalid_open_action'
    }
    if (openAction.mode === 'convert') {
      return 'convert'
    }
    return 'document_viewer'
  }, [isCreatingNewDocument, nodeMeta, openAction])

  useEffect(() => {
    switch (contentPhase) {
      case 'creating_new_document':
        void OpenTracer.trace('boot_doc_page_creating_new_document')
        break
      case 'copy_public':
        void OpenTracer.trace('boot_doc_page_copy_public', { mode: openAction?.mode })
        break
      case 'open_url_reauth':
        void OpenTracer.trace('boot_doc_page_open_url_reauth', { mode: openAction?.mode })
        break
      case 'invalid_open_action':
        void OpenTracer.trace('boot_doc_page_invalid_open_action', { mode: openAction?.mode })
        break
      case 'convert':
        void OpenTracer.trace('boot_doc_page_convert')
        break
    }
  }, [contentPhase, openAction?.mode])

  if (contentPhase === 'creating_new_document') {
    return (
      <div className="flex-column flex h-full w-full items-center justify-center gap-4">
        <CircleLoader size="large" />
        <div className="text-center">
          {openAction?.type === 'sheet'
            ? c('sheets_2025:Info').t`Creating new spreadsheet...`
            : c('Info').t`Creating new document...`}
        </div>
      </div>
    )
  }

  if (contentPhase === 'copy_public') {
    return <PublicDocumentCopier openAction={openAction} />
  }

  /** Waiting for redirection */
  if (contentPhase === 'open_url_reauth') {
    return (
      <div className="flex-column flex h-full w-full items-center justify-center gap-4">
        <CircleLoader size="large" />
      </div>
    )
  }

  if (contentPhase === 'invalid_open_action') {
    const isURLTruncatedBySlack = search.includes('[%E2%80%A6]')
    if (isURLTruncatedBySlack) {
      return (
        <div className="m-auto max-w-prose text-center" data-testid="invalid-openaction-error">{c('Info')
          .t`The URL you entered seems to have been copied from Slack incorrectly. When copying long links from Slack, right click the link, then choose "Copy link" rather than copying the truncated URL text directly.`}</div>
      )
    }

    return (
      <div className="m-auto" data-testid="invalid-openaction-error">{c('Info')
        .jt`No document supplied in URL. Return to ${DRIVE_APP_NAME} and select a document.`}</div>
    )
  }

  if (contentPhase === 'convert') {
    return <DocumentConverter onSuccess={onConversionSuccess} getNodeContents={getNodeContents} lookup={nodeMeta!} />
  } else {
    return (
      <>
        {emailOptInModal}
        <DocumentViewer
          editorInitializationConfig={editorInitializationConfig}
          nodeMeta={nodeMeta!}
          openAction={openAction!}
          actionMode={actionMode}
          providerType="private"
          documentType={openAction!.type}
        />
      </>
    )
  }
}
