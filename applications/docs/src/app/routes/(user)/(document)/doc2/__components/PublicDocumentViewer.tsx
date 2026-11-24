import { useState, useSyncExternalStore } from 'react'

import { useConfig } from '@proton/app-context/useConfig'
import useAuthentication from '@proton/components/hooks/useAuthentication'
import { AnonymousUserDisplayName } from '@proton/docs-shared/AnonymousUser'
import { EditorSystemMode } from '@proton/docs-shared/EditorSystemMode'
import { useGenericAlertModal } from '@proton/docs-shared/components/GenericAlert'
import type { FileMenuAction } from '@proton/docs-shared/Bridge/EditorRequiresClientMethods'
import type { DataTypesThatDocumentCanBeExportedAs } from '@proton/docs-shared/ExportableDataType'
import { generateNodeUid } from '@proton/drive/sdk'
import { getAppHref } from '@proton/shared/lib/apps/helper'
import { APPS } from '@proton/shared/lib/constants'
import { getCanWrite } from '@proton/shared/lib/drive/permissions'
import { assignUrl } from '@proton/shared/lib/helpers/location'
import { useGetFlag } from '@proton/unleash/useGetFlag'

import { EditorFrame } from '~/components/document/EditorFrame'
import { useApplication } from '~/utils/application-context'
import { useDebugMode } from '~/utils/debug-mode-context'
import { useEvent } from '~/utils/misc'

import { exportAndDownload } from '../__utils/downloadExport'
import { getNodeName } from '../__utils/getNodeName'
import { handleFileMenuAction, openHelp } from '../__utils/handleFileMenuAction'
import type { LoaderDeps } from '../__utils/loadDocument'
import { getLoadingScreenStatus } from '../__utils/loadingScreen'
import {
  type PublicLinkHandoff,
  getPrivateDocumentUrl,
  getPublicDocumentRole,
  hasAccessOfOwn,
} from '../__utils/publicLink'
import { sendEditorBasics, getUserName, useEditorBasicsInSync, useIsEditorDarkMode } from '../__utils/useEditorBasics'
import { useDocumentLoader } from '../__utils/useDocumentLoader'
import { useLeaveWarning } from '../__utils/useLeaveWarning'
import { usePauseWhileAway } from '../__utils/usePauseWhileAway'
import { usePresenceBridge } from '../__utils/usePresenceBridge'
import { usePublicRealtimeClient } from '../__utils/usePublicRealtimeClient'
import { useRetryOnActivity } from '../__utils/useRetryOnActivity'
import { useSessionNotices } from '../__utils/useSessionNotices'
import { useStopFollowUps } from '../__utils/useStopFollowUps'
import { BootstrapErrorPage } from './BootstrapErrorPage'
import { DocumentHeaderV2 } from './DocumentHeaderV2'
import { DocumentShell } from './DocumentShell'
import { DocumentSizeLimitModal } from './DocumentSizeLimitModal'
import { IdleActivityCatcher } from './IdleActivityCatcher'
import { LoadingScreen } from './LoadingScreen'
import { OpenActionError } from './OpenActionError'
import { SessionStatus } from './SessionStatus'
import { WordCountOverlay, useWordCountState } from './WordCount'

export type PublicDocumentViewerProps = {
  /** The share URL's token */
  token: string
  /** What the share URL's sign-in gave */
  handoff: PublicLinkHandoff
  /** `DocsPublicEditing`, read once Unleash is ready */
  publicEditing: boolean
  /** Opens the document again from the start */
  onRetry: () => void
}

/**
 * Opens a document through a share link, as `DocumentViewerV2` opens a member's, through the Loader with public
 * dependencies (`documentation/specs/doc2-public-links.md` in the realtime repo). An editor link edits live while
 * public editing is on; otherwise the visitor views the latest commit read-only and nothing connects. A viewer's editor
 * is in public view, as on /doc. The header is doc2's, without the member-only items, the user menu and the banner.
 */
export function PublicDocumentViewer({ token, handoff, publicEditing, onRetry }: PublicDocumentViewerProps) {
  const { logger } = useApplication()
  const { APP_VERSION } = useConfig()
  const { getLocalID } = useAuthentication()
  const isFlagEnabled = useGetFlag()
  const client = usePublicRealtimeClient(handoff)
  const [wordCount, setWordCountInfo] = useWordCountState()
  const [modal, showModal] = useGenericAlertModal()
  const { toggleDebugMode } = useDebugMode()
  const isDarkMode = useIsEditorDarkMode()
  const userName = handoff.user ? getUserName(handoff.user) : AnonymousUserDisplayName
  // Stable, as the Loader builds the bridge with them once: each runs the latest render's code
  const sendBasics = useEvent<LoaderDeps['sendEditorBasics']>((editorInvoker) =>
    sendEditorBasics(editorInvoker, { isDarkMode, userName }, logger),
  )
  const checkFlag = useEvent(isFlagEnabled)
  const onWordCount = useEvent(setWordCountInfo)
  const onShowModal = useEvent(showModal)
  const onFileMenuAction = useEvent((action: FileMenuAction) =>
    handleFileMenuAction(
      action,
      {
        // The member-only actions, which the title menu doesn't offer a public visitor
        newDocument: () => {},
        newSpreadsheet: () => {},
        makeACopy: () => {},
        moveToFolder: () => {},
        moveToTrash: () => {},
        seeVersionHistory: () => {},
        // The visitor's Drive, as the document's folder is not theirs
        openProtonDrive: () => window.open(getAppHref('/', APPS.PROTONDRIVE), '_blank'),
        openHelp,
        toggleDebugMode,
        print,
        download,
      },
      logger,
    ),
  )
  const onPresenceUpdate = useEvent((update: Uint8Array<ArrayBuffer>) => receivePresenceFromEditor(update))
  const isEditorLink = getCanWrite(handoff.linkInfo.permissions)
  // Known before the Loader reads the node, so the editor frame boots in the right mode
  const linkRole = getPublicDocumentRole({ isEditorLink, publicEditing })
  // The viewer is keyed by the document, so these never change for it
  const [loaderDeps] = useState<LoaderDeps>(() => ({
    publicLink: {
      client,
      nodeMeta: { token, linkId: handoff.linkInfo.linkId },
      getNode: () => handoff.publicDrive.getNode(generateNodeUid(handoff.linkInfo.volumeId, handoff.linkInfo.linkId)),
      isEditorLink,
      publicEditing,
      hasAccessOfOwn: (node) => hasAccessOfOwn(handoff.linkInfo, node),
      openPrivately: (nodeMeta) => assignUrl(getPrivateDocumentUrl(nodeMeta, getLocalID())),
    },
    logger,
    appVersion: APP_VERSION,
    sendEditorBasics: sendBasics,
    bridgeHandlers: {
      isFlagEnabled: checkFlag,
      onWordCount,
      showModal: onShowModal,
      onFileMenuAction,
      onPresenceUpdate,
      // As /doc's public view, which has no image proxy: an export leaves external images out
      fetchExternalImageAsBase64: async () => undefined,
      logger,
    },
  }))
  const { status, onFrameReady } = useDocumentLoader(loaderDeps)

  const session = 'session' in status ? status.session : undefined
  // With public editing off, the session never connects, so nothing follows its connection
  const liveSession = publicEditing ? session : undefined
  const editorInvoker = 'editorInvoker' in status ? status.editorInvoker : undefined
  const revealed = status.name === 'revealed'
  const role = ('role' in status && status.role) || linkRole
  const node = 'node' in status ? status.node : undefined
  const snapshot = useSyncExternalStore(session?.subscribe ?? subscribeToNothing, session?.getSnapshot ?? getNothing)

  const retryConnection = () => {
    if (liveSession?.getSnapshot().status.name !== 'stopped') {
      return
    }
    liveSession.retry().catch((error) => logger.warn('Failed to reconnect the document session', error))
  }

  // Only once revealed does the editor hold the edits RTS replayed and its Lexical editor, which exports need
  const exportInvoker = revealed ? editorInvoker : undefined
  const print = () => {
    exportInvoker?.printAsPDF().catch((error) => logger.warn('Failed to print the document', error))
  }
  const download = (format: DataTypesThatDocumentCanBeExportedAs) => {
    const name = node && getNodeName(node)
    if (!exportInvoker || !name) {
      return
    }
    exportAndDownload(exportInvoker, name, format).catch((error) =>
      logger.error('Failed to download the document', error),
    )
  }

  useSessionNotices(liveSession)
  usePauseWhileAway(liveSession)
  const waitingForActivity = useRetryOnActivity(liveSession)
  useStopFollowUps(liveSession, showModal)
  useLeaveWarning(liveSession)
  useEditorBasicsInSync(exportInvoker, { isDarkMode, userName })
  const receivePresenceFromEditor = usePresenceBridge(liveSession, editorInvoker)

  if (status.name === 'failed') {
    const { reason } = status
    if (reason === 'unsupported' || reason === 'unreadableUpdate' || reason === 'editorFailed') {
      return <OpenActionError reason={reason} onRetry={reason === 'unsupported' ? undefined : onRetry} isPublic />
    }
    return <BootstrapErrorPage failure={reason} onRetry={onRetry} isPublic />
  }

  const screenStatus = getLoadingScreenStatus(status)
  const header = node && (
    <DocumentHeaderV2
      node={node}
      role={role}
      participants={snapshot?.participants ?? []}
      editorInvoker={editorInvoker}
      exportInvoker={exportInvoker}
      wordCount={wordCount}
      trashState="not_trashed"
      isCreatingSpreadsheet={false}
      isMakingACopy={false}
      onFileMenuAction={onFileMenuAction}
      isPublic
      status={
        editorInvoker && liveSession && snapshot && <SessionStatus snapshot={snapshot} onRetry={retryConnection} />
      }
    />
  )

  return (
    <DocumentShell
      header={header}
      isPublic
      loadingScreen={
        screenStatus && (
          <LoadingScreen
            status={screenStatus}
            onRetry={status.name === 'stopped' && status.retryable ? retryConnection : undefined}
          />
        )
      }
    >
      <div className="flex-column flex h-full w-full flex-nowrap">
        <div className="relative w-full flex-1">
          <EditorFrame
            onFrameReady={onFrameReady}
            systemMode={linkRole === 'Viewer' ? EditorSystemMode.PublicView : EditorSystemMode.Edit}
            logger={logger}
            isDarkMode={isDarkMode}
          />
          {waitingForActivity && <IdleActivityCatcher />}
        </div>
        {revealed && <WordCountOverlay wordCount={wordCount} />}
        {modal}
        <DocumentSizeLimitModal
          session={liveSession}
          onDownloadCopy={exportInvoker && (() => onFileMenuAction({ type: 'download', format: 'docx' }))}
        />
      </div>
    </DocumentShell>
  )
}

const subscribeToNothing = () => () => {}
const getNothing = () => undefined
