import { useEffect, useRef, useState, useSyncExternalStore } from 'react'

import { useConfig } from '@proton/app-context/useConfig'
import { useGetUserSettings } from '@proton/account/userSettings/hooks'
import useAuthentication from '@proton/components/hooks/useAuthentication'
import { EditorSystemMode } from '@proton/docs-shared/EditorSystemMode'
import { useGenericAlertModal } from '@proton/docs-shared/components/GenericAlert'
import type { FileMenuAction } from '@proton/docs-shared/Bridge/EditorRequiresClientMethods'
import type { DataTypesThatDocumentCanBeExportedAs } from '@proton/docs-shared/ExportableDataType'
import type { DriveCompat } from '@proton/drive-store/lib/useDriveCompat'
import { getDrive } from '@proton/drive/sdk'
import { useGetFlag } from '@proton/unleash/useGetFlag'
import type { PrivateNodeMeta } from '@proton-docs/realtime-sdk'

import { EditorFrame } from '~/components/document/EditorFrame'
import { useApplication } from '~/utils/application-context'
import { useDebugMode } from '~/utils/debug-mode-context'
import { useEvent } from '~/utils/misc'

import { exportAndDownload } from '../__utils/downloadExport'
import { fetchExternalImageAsBase64 } from '../__utils/fetchExternalImageAsBase64'
import { getNodeName } from '../__utils/getNodeName'
import { handleFileMenuAction, openHelp } from '../__utils/handleFileMenuAction'
import type { LoaderDeps } from '../__utils/loadDocument'
import { getLoadingScreenStatus, isLocked } from '../__utils/loadingScreen'
import { createVersionHistory } from '../__utils/NativeVersionHistory'
import { useDocumentFileActions } from '../__utils/useDocumentFileActions'
import { useDocumentLoader } from '../__utils/useDocumentLoader'
import { sendEditorBasics, useEditorBasicsInSync, useIsEditorDarkMode, useUserName } from '../__utils/useEditorBasics'
import { useLiveDocumentNode } from '../__utils/useLiveDocumentNode'
import { useLeaveWarning } from '../__utils/useLeaveWarning'
import { usePauseWhileAway } from '../__utils/usePauseWhileAway'
import { usePresenceBridge } from '../__utils/usePresenceBridge'
import { useRealtimeClient } from '../__utils/useRealtimeClient'
import { useRetryOnActivity } from '../__utils/useRetryOnActivity'
import { useSessionNotices } from '../__utils/useSessionNotices'
import { useStopFollowUps } from '../__utils/useStopFollowUps'
import { BootstrapErrorPage } from './BootstrapErrorPage'
import { DocumentDebugMenu } from './DocumentDebugMenu'
import { DocumentHeaderV2 } from './DocumentHeaderV2'
import { DocumentShell } from './DocumentShell'
import { DocumentSizeLimitModal } from './DocumentSizeLimitModal'
import { useHistoryViewerModal } from './HistoryViewerModal'
import { IdleActivityCatcher } from './IdleActivityCatcher'
import { LoadingScreen } from './LoadingScreen'
import { OpenActionError } from './OpenActionError'
import { SessionStatus } from './SessionStatus'
import { WordCountOverlay, useWordCountState } from './WordCount'

export type DocumentViewerV2Props = {
  nodeMeta: PrivateNodeMeta
  /** Creates the new spreadsheet the title menu offers */
  driveCompat: DriveCompat
  /** Opens the document again from the start */
  onRetry: () => void
  /** Drive's Download: saves the document as docx once the editor shows it, then calls `onDownloadedOnOpen` */
  downloadOnOpen?: boolean
  onDownloadedOnOpen?: () => void
  /** `mode=history`: opens the version history once the editor shows the document, then calls onHistoryOpenedOnOpen */
  historyOnOpen?: boolean
  onHistoryOpenedOnOpen?: () => void
}

/**
 * Opens the text document `nodeMeta` for live editing, as far as the user's role allows, through the Loader
 * (`loadDocument.ts`), and renders its status: the Loading Screen over the page until the Reveal Point, an error page,
 * or the trashed document.
 */
export function DocumentViewerV2({
  nodeMeta,
  driveCompat,
  onRetry,
  downloadOnOpen,
  onDownloadedOnOpen,
  historyOnOpen,
  onHistoryOpenedOnOpen,
}: DocumentViewerV2Props) {
  const { logger, isPublicMode } = useApplication()
  const { APP_VERSION, API_URL } = useConfig()
  const { UID } = useAuthentication()
  const isFlagEnabled = useGetFlag()
  const client = useRealtimeClient()
  const getUserSettings = useGetUserSettings()
  const [wordCount, setWordCountInfo] = useWordCountState()
  const [modal, showModal] = useGenericAlertModal()
  const { isDebugMode, toggleDebugMode } = useDebugMode()
  const isDarkMode = useIsEditorDarkMode()
  const userName = useUserName()
  // Stable, as the Loader builds the bridge with them once: each runs the latest render's code
  const sendBasics = useEvent<LoaderDeps['sendEditorBasics']>((editorInvoker) =>
    sendEditorBasics(
      editorInvoker,
      { isDarkMode, userName, getUserSettings: isPublicMode ? undefined : getUserSettings },
      logger,
    ),
  )
  const checkFlag = useEvent(isFlagEnabled)
  const onWordCount = useEvent(setWordCountInfo)
  const onShowModal = useEvent(showModal)
  const onFileMenuAction = useEvent((action: FileMenuAction) =>
    handleFileMenuAction(
      action,
      { ...fileActions, openHelp, toggleDebugMode, print, download, seeVersionHistory },
      logger,
    ),
  )
  const fetchImage = useEvent((url: string) => fetchExternalImageAsBase64(url, { apiUrl: API_URL, uid: UID }))
  const onPresenceUpdate = useEvent((update: Uint8Array<ArrayBuffer>) => receivePresenceFromEditor(update))
  // The viewer is keyed by the document, so these never change for it
  const [loaderDeps] = useState<LoaderDeps>(() => ({
    client,
    // Read when called: Drive's client is set up as the app starts
    drive: { getNodeHierarchy: (nodeUid) => getDrive().getNodeHierarchy(nodeUid) },
    nodeMeta,
    logger,
    appVersion: APP_VERSION,
    sendEditorBasics: sendBasics,
    bridgeHandlers: {
      isFlagEnabled: checkFlag,
      onWordCount,
      showModal: onShowModal,
      onFileMenuAction,
      onPresenceUpdate,
      fetchExternalImageAsBase64: fetchImage,
      logger,
    },
  }))
  const { status, onFrameReady } = useDocumentLoader(loaderDeps)

  const session = 'session' in status ? status.session : undefined
  const editorInvoker = 'editorInvoker' in status ? status.editorInvoker : undefined
  const revealed = status.name === 'revealed'
  const openedTrashed = status.name === 'trashed'
  const role = ('role' in status && status.role) || 'Viewer'
  const node = useLiveDocumentNode('node' in status ? status.node : undefined)
  const snapshot = useSyncExternalStore(session?.subscribe ?? subscribeToNothing, session?.getSnapshot ?? getNothing)
  // The editor's lock, as the Loader computes it, for what edits the document outside the editor: the history's restore
  const editRefused = status.name === 'revealed' && status.editRefused
  const isEditorLocked = !snapshot || isLocked({ snapshot, role, editRefused })

  const retryConnection = () => {
    // A second click, or a retry on activity after an idle eviction, may have left `stopped` already
    if (session?.getSnapshot().status.name !== 'stopped') {
      return
    }
    session.retry().catch((error) => logger.warn('Failed to reconnect the document session', error))
  }

  // Only once revealed does the editor hold the edits RTS replayed and its Lexical editor, which exports need
  const exportInvoker = revealed ? editorInvoker : undefined
  const fileActions = useDocumentFileActions({ node, role, driveCompat, client, exportInvoker })
  const [historyModal, showHistoryModal] = useHistoryViewerModal({
    liveEditorInvoker: exportInvoker,
    locked: isEditorLocked,
    makeACopyOfRevision: fileActions.makeACopyOfRevision,
    isMakingACopy: fileActions.isMakingACopy,
  })
  // Out of the trash, restored here or elsewhere: a document opened trashed opens now, and a session that stopped
  // while RTS refused the trashed document reconnects (one still trying reconnects by itself)
  const leaveTrash = useEvent(() => (openedTrashed ? onRetry() : retryConnection()))
  const inTrash = fileActions.trashState === 'trashed' || fileActions.trashState === 'restoring'
  const wasInTrashRef = useRef(false)
  useEffect(() => {
    if (inTrash) {
      wasInTrashRef.current = true
    } else if (wasInTrashRef.current && fileActions.trashState === 'not_trashed') {
      wasInTrashRef.current = false
      leaveTrash()
    }
  }, [fileActions.trashState, inTrash, leaveTrash])
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
  // The version history, read from the session's History Log as it opens, once the editor shows the document. A
  // restore replaces the live editor's state: an ordinary edit, sent as the editor's own are.
  const seeVersionHistory = () => {
    const name = node && getNodeName(node)
    if (!session || !exportInvoker || !name) {
      return
    }
    showHistoryModal({ versionHistory: createVersionHistory(session.getHistory()), documentName: name })
  }

  useSessionNotices(session)
  usePauseWhileAway(session)
  const waitingForActivity = useRetryOnActivity(session)
  useStopFollowUps(session, showModal)
  useLeaveWarning(session)
  useEditorBasicsInSync(exportInvoker, { isDarkMode, userName })
  const receivePresenceFromEditor = usePresenceBridge(session, editorInvoker)

  useEffect(() => {
    if (downloadOnOpen && exportInvoker && node) {
      onDownloadedOnOpen?.()
      onFileMenuAction({ type: 'download', format: 'docx' })
    }
  }, [downloadOnOpen, exportInvoker, node, onDownloadedOnOpen, onFileMenuAction])
  // `mode=history`: the history opens once, at the Reveal Point, through the menu's See version history. Adapted from
  // `applications/docs/src/app/components/document/DocumentLayout/DocumentHeader/DocumentTitleDropdown/DocumentTitleDropdown.tsx`,
  // its history action mode
  // It waits for what See version history needs, so it never counts as opened when the history couldn't open
  useEffect(() => {
    if (historyOnOpen && exportInvoker && session && node && getNodeName(node)) {
      onHistoryOpenedOnOpen?.()
      onFileMenuAction({ type: 'see-version-history' })
    }
  }, [historyOnOpen, exportInvoker, node, session, onHistoryOpenedOnOpen, onFileMenuAction])

  if (status.name === 'failed') {
    const { reason } = status
    if (reason === 'unsupported' || reason === 'unreadableUpdate' || reason === 'editorFailed') {
      return <OpenActionError reason={reason} onRetry={reason === 'unsupported' ? undefined : onRetry} />
    }
    return <BootstrapErrorPage failure={reason} onRetry={onRetry} />
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
      trashState={fileActions.trashState}
      isCreatingSpreadsheet={fileActions.isCreatingSpreadsheet}
      isMakingACopy={fileActions.isMakingACopy}
      onFileMenuAction={onFileMenuAction}
      status={editorInvoker && snapshot && <SessionStatus snapshot={snapshot} onRetry={retryConnection} />}
    />
  )

  return (
    <DocumentShell
      header={header}
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
            systemMode={EditorSystemMode.Edit}
            logger={logger}
            isDarkMode={isDarkMode}
          />
          {waitingForActivity && <IdleActivityCatcher />}
        </div>
        {revealed && <WordCountOverlay wordCount={wordCount} />}
        {isDebugMode && session && snapshot && exportInvoker && (
          <DocumentDebugMenu session={session} snapshot={snapshot} editorInvoker={exportInvoker} />
        )}
        {modal}
        {historyModal}
        {fileActions.modals}
        <DocumentSizeLimitModal
          session={session}
          onDownloadCopy={exportInvoker && (() => onFileMenuAction({ type: 'download', format: 'docx' }))}
        />
      </div>
    </DocumentShell>
  )
}

const subscribeToNothing = () => () => {}
const getNothing = () => undefined
