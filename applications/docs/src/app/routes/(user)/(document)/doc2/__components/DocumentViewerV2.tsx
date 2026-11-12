import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'

import { useConfig } from '@proton/app-context/useConfig'
import useAuthentication from '@proton/components/hooks/useAuthentication'
import { EditorSystemMode } from '@proton/docs-shared/EditorSystemMode'
import { useGenericAlertModal } from '@proton/docs-shared/components/GenericAlert'
import type { FileMenuAction } from '@proton/docs-shared/Bridge/EditorRequiresClientMethods'
import type { DataTypesThatDocumentCanBeExportedAs } from '@proton/docs-shared/ExportableDataType'
import type { DriveCompat } from '@proton/drive-store/lib/useDriveCompat'
import { useGetFlag } from '@proton/unleash/useGetFlag'
import type { PrivateNodeMeta } from '@proton-docs/realtime-sdk'

import { EditorFrame } from '~/components/document/EditorFrame'
import { useApplication } from '~/utils/application-context'
import { useDebugMode } from '~/utils/debug-mode-context'
import { useEvent } from '~/utils/misc'

import { ClientEditorBridge } from '../__utils/ClientEditorBridge'
import { isParticipantLimitReached } from '../__utils/activeUsers'
import type { EditorInvoker } from '../__utils/EditorInvoker'
import { createClientHandler } from '../__utils/createClientHandler'
import { exportAndDownload } from '../__utils/downloadExport'
import { fetchExternalImageAsBase64 } from '../__utils/fetchExternalImageAsBase64'
import { getNodeName } from '../__utils/getNodeName'
import { handleFileMenuAction, openHelp } from '../__utils/handleFileMenuAction'
import { DocsLoadMark, markDocsLoad } from '../__utils/loadMarks'
import { sendBaseState, showDocument } from '../__utils/showDocument'
import { useDocumentFileActions } from '../__utils/useDocumentFileActions'
import { useDocumentSession } from '../__utils/useDocumentSession'
import { useEditorBasics, useIsEditorDarkMode } from '../__utils/useEditorBasics'
import { useLiveDocumentNode } from '../__utils/useLiveDocumentNode'
import { useLeaveWarning } from '../__utils/useLeaveWarning'
import { useLiveEditing } from '../__utils/useLiveEditing'
import { usePauseWhileAway } from '../__utils/usePauseWhileAway'
import { usePresenceBridge } from '../__utils/usePresenceBridge'
import { useRealtimeClient } from '../__utils/useRealtimeClient'
import { useRetryOnActivity } from '../__utils/useRetryOnActivity'
import { useStopFollowUps } from '../__utils/useStopFollowUps'
import { useUpdateRecorder } from '../__utils/useUpdateRecorder'
import { BootstrapErrorPage } from './BootstrapErrorPage'
import { DocumentDebugMenu } from './DocumentDebugMenu'
import { DocumentHeaderV2 } from './DocumentHeaderV2'
import { DocumentLoader } from './DocumentLoader'
import { DocumentShell } from './DocumentShell'
import { DocumentSizeLimitModal } from './DocumentSizeLimitModal'
import { IdleActivityCatcher } from './IdleActivityCatcher'
import { OpenActionError } from './OpenActionError'
import { SessionStatus } from './SessionStatus'
import { WordCountOverlay, useWordCountState } from './WordCount'

export const EDITOR_FRAME_READY_TIMEOUT_MS = 30_000

export type DocumentViewerV2Props = {
  nodeMeta: PrivateNodeMeta
  /** Creates the new spreadsheet the title menu offers */
  driveCompat: DriveCompat
  /** Opens the document again from the start */
  onRetry: () => void
  /** Drive's Download: saves the document as docx once the editor shows it, then calls `onDownloadedOnOpen` */
  downloadOnOpen?: boolean
  onDownloadedOnOpen?: () => void
}

/** Opens the text document `nodeMeta` for live editing, as far as the user's role allows. */
export function DocumentViewerV2({
  nodeMeta,
  driveCompat,
  onRetry,
  downloadOnOpen,
  onDownloadedOnOpen,
}: DocumentViewerV2Props) {
  const { logger } = useApplication()
  const { APP_VERSION, API_URL } = useConfig()
  const { UID } = useAuthentication()
  const isFlagEnabled = useGetFlag()
  const client = useRealtimeClient()
  const sessionState = useDocumentSession(client, nodeMeta)
  const [editorFrame, setEditorFrame] = useState<HTMLIFrameElement | null>(null)
  const onFrameReady = useCallback((frame: HTMLIFrameElement) => {
    markDocsLoad(DocsLoadMark.FrameReady)
    setEditorFrame(frame)
  }, [])
  const [editorStatus, setEditorStatus] = useState<'loading' | 'shown' | 'failed'>('loading')
  const [editorInvoker, setEditorInvoker] = useState<EditorInvoker>()
  // Kept across bridges: the editor in the frame stays rendered
  const [isEditorRendered, setIsEditorRendered] = useState(false)

  const [wordCount, setWordCountInfo] = useWordCountState()
  const [modal, showModal] = useGenericAlertModal()
  const { isDebugMode, toggleDebugMode } = useDebugMode()
  const isDarkMode = useIsEditorDarkMode()
  const session = sessionState.status === 'ready' ? sessionState.session : undefined
  // A document opened in the trash has a role and a node, for the header and the trashed modal, and no session
  const openedTrashed = sessionState.status === 'trashed'
  const role = sessionState.status === 'ready' || openedTrashed ? sessionState.role : 'Viewer'
  const roleReads = sessionState.status === 'ready' ? sessionState.roleReads : 0
  // The editor is initialized once, for the role read first: a role read again after a rebootstrap changes the lock
  // and the header, never initializes the editor again
  const roleRef = useRef(role)
  roleRef.current = role
  const node = useLiveDocumentNode(sessionState.status === 'ready' || openedTrashed ? sessionState.node : undefined)

  const retryConnection = () => {
    // A second click, or a retry on activity after an idle eviction, may have left `stopped` already
    if (session?.getSnapshot().status.name !== 'stopped') {
      return
    }
    session.retry().catch((error) => logger.warn('Failed to reconnect the document session', error))
  }

  const failEditor = useCallback(
    (error: Error) => {
      logger.error('Failed to show the document in the editor', error)
      setEditorStatus('failed')
    },
    [logger],
  )
  // Only once the editor shows the document does it hold the edits RTS replayed, and it can export only once its Lexical
  // editor exists, which can come after it shows
  const exportInvoker = editorStatus === 'shown' && isEditorRendered ? editorInvoker : undefined
  const fileActions = useDocumentFileActions({ node, role, driveCompat, client, exportInvoker })
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
  // Stable, since the editor bridge is built with it: it runs the latest actions, for the latest node and role
  const onFileMenuAction = useEvent((action: FileMenuAction) =>
    handleFileMenuAction(action, { ...fileActions, openHelp, toggleDebugMode, print, download }, logger),
  )

  // Read here too, since useLiveEditing takes the participant limit and only then returns the snapshot
  const participants = useSyncExternalStore(
    session?.subscribe ?? subscribeToNothing,
    () => session?.getSnapshot().participants,
  )
  const snapshot = useLiveEditing({
    session,
    editorInvoker,
    role,
    roleReads,
    participantLimitReached: isParticipantLimitReached(participants ?? []),
    editorReady: editorStatus === 'shown' && isEditorRendered,
    onEditorError: failEditor,
  })
  usePauseWhileAway(session)
  const waitingForActivity = useRetryOnActivity(session)
  useStopFollowUps(session, showModal)
  useLeaveWarning(session)
  // Before the effect that initializes the editor, so the user name reaches the editor first
  useEditorBasics(editorInvoker, isDarkMode)
  const receivePresenceFromEditor = usePresenceBridge(session, editorStatus === 'failed' ? undefined : editorInvoker)
  const recorder = useUpdateRecorder(session)
  const sendAndRecordUpdate = useCallback(
    (update: Uint8Array<ArrayBuffer>) => {
      session?.sendUpdate(update)
      recorder?.recordSent(update)
    },
    [recorder, session],
  )

  useEffect(() => {
    if (editorFrame) {
      return
    }

    const timeout = setTimeout(() => {
      logger.error(
        'Failed to load the editor',
        new Error(`Editor frame was not ready within ${EDITOR_FRAME_READY_TIMEOUT_MS} ms`),
      )
      setEditorStatus('failed')
    }, EDITOR_FRAME_READY_TIMEOUT_MS)

    return () => clearTimeout(timeout)
  }, [editorFrame, logger])

  useEffect(() => {
    if (!editorFrame || !session) {
      return
    }

    const controller = new AbortController()
    const onEditorError = (error: Error) => {
      if (!controller.signal.aborted) {
        failEditor(error)
      }
    }

    const bridge = new ClientEditorBridge(
      editorFrame,
      createClientHandler({
        editorFrame,
        sendUpdate: sendAndRecordUpdate,
        isFlagEnabled,
        onEditorError,
        onWordCount: setWordCountInfo,
        onEditorRendered: () => setIsEditorRendered(true),
        showModal,
        onFileMenuAction,
        onPresenceUpdate: receivePresenceFromEditor,
        fetchExternalImageAsBase64: (url) => fetchExternalImageAsBase64(url, { apiUrl: API_URL, uid: UID }),
        logger,
      }),
      logger,
    )
    // useLiveEditing connects once the editor holds the base state, so RTS's replay reaches the editor after it
    sendBaseState(bridge.editorInvoker, session).then(() => {
      if (!controller.signal.aborted) {
        markDocsLoad(DocsLoadMark.BaseStateSent)
        setEditorInvoker(bridge.editorInvoker)
      }
    }, onEditorError)

    return () => {
      controller.abort()
      bridge.destroy()
      setEditorInvoker(undefined)
    }
  }, [
    API_URL,
    UID,
    editorFrame,
    failEditor,
    isFlagEnabled,
    logger,
    onFileMenuAction,
    receivePresenceFromEditor,
    sendAndRecordUpdate,
    session,
    setWordCountInfo,
    showModal,
  ])

  // As docs-core's EditorController, wait for RTS to replay the edits it has not committed yet: before that the
  // editor may hold nothing. While reconnecting or stopped before then, the loader stays, with SessionStatus in the header.
  const caughtUp = snapshot?.caughtUp === true
  useEffect(() => {
    if (caughtUp) {
      markDocsLoad(DocsLoadMark.CaughtUp)
    }
  }, [caughtUp])
  useEffect(() => {
    if (!session || !editorInvoker || !caughtUp) {
      return
    }

    let cancelled = false
    showDocument(editorInvoker, session, roleRef.current, APP_VERSION).then(
      () => {
        if (cancelled) {
          return
        }
        markDocsLoad(DocsLoadMark.EditorShown)
        setEditorStatus('shown')
        // So peers see the user at once rather than at the editor's next change; not worth failing the editor for
        editorInvoker
          .broadcastPresenceState()
          .catch((error) => logger.warn('Failed to have the editor broadcast its presence', error))
      },
      (error) => !cancelled && failEditor(error),
    )

    return () => {
      cancelled = true
    }
  }, [APP_VERSION, caughtUp, editorInvoker, failEditor, logger, session])

  useEffect(() => {
    if (downloadOnOpen && exportInvoker && node) {
      onDownloadedOnOpen?.()
      onFileMenuAction({ type: 'download', format: 'docx' })
    }
  }, [downloadOnOpen, exportInvoker, node, onDownloadedOnOpen, onFileMenuAction])

  // A failed editor is gone, so peers must stop seeing its last cursor, which the session would keep broadcasting
  const editorFailed = editorStatus === 'failed'
  useEffect(() => {
    if (editorFailed) {
      session?.setPresence(null)
    }
  }, [editorFailed, session])

  if (sessionState.status === 'failed') {
    const { reason } = sessionState
    if (reason === 'unsupported' || reason === 'unreadableUpdate') {
      return <OpenActionError reason={reason} onRetry={reason === 'unreadableUpdate' ? onRetry : undefined} />
    }
    return <BootstrapErrorPage failure={reason} onRetry={onRetry} />
  }

  if (editorStatus === 'failed') {
    return <OpenActionError reason="editorFailed" onRetry={onRetry} />
  }

  const header = node && (
    <DocumentHeaderV2
      node={node}
      role={role}
      participants={participants ?? []}
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
    <DocumentShell header={header}>
      <div className="flex-column flex h-full w-full flex-nowrap">
        <div className="relative w-full flex-1">
          <EditorFrame
            onFrameReady={onFrameReady}
            systemMode={EditorSystemMode.Edit}
            logger={logger}
            isDarkMode={isDarkMode}
          />
          {editorStatus === 'loading' && <DocumentLoader className="bg-norm absolute left-0 top-0" />}
          {waitingForActivity && <IdleActivityCatcher />}
        </div>
        {editorStatus === 'shown' && <WordCountOverlay wordCount={wordCount} />}
        {isDebugMode && session && snapshot && editorInvoker && recorder && editorStatus === 'shown' && (
          <DocumentDebugMenu
            session={session}
            snapshot={snapshot}
            editorInvoker={editorInvoker}
            recorder={recorder}
            sendUpdate={sendAndRecordUpdate}
          />
        )}
        {modal}
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
