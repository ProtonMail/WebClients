import { useCallback, useEffect, useRef, useState } from 'react'

import { useConfig } from '@proton/app-context/useConfig'
import { EditorSystemMode } from '@proton/docs-shared/EditorSystemMode'
import { useGenericAlertModal } from '@proton/docs-shared/components/GenericAlert'
import type { FileMenuAction } from '@proton/docs-shared/Bridge/EditorRequiresClientMethods'
import { useGetFlag } from '@proton/unleash/useGetFlag'
import type { PrivateNodeMeta } from '@proton-docs/realtime-sdk'

import { EditorFrame } from '~/components/document/EditorFrame'
import { useApplication } from '~/utils/application-context'
import { useDebugMode } from '~/utils/debug-mode-context'

import { ClientEditorBridge } from '../__utils/ClientEditorBridge'
import type { EditorInvoker } from '../__utils/EditorInvoker'
import { createClientHandler } from '../__utils/createClientHandler'
import { handleFileMenuAction, openHelp } from '../__utils/handleFileMenuAction'
import { sendBaseState, showDocument } from '../__utils/showDocument'
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
import { BootstrapErrorPage } from './BootstrapErrorPage'
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
  /** Opens the document again from the start */
  onRetry: () => void
}

/** Opens the text document `nodeMeta` for live editing, as far as the user's role allows. */
export function DocumentViewerV2({ nodeMeta, onRetry }: DocumentViewerV2Props) {
  const { logger } = useApplication()
  const { APP_VERSION } = useConfig()
  const isFlagEnabled = useGetFlag()
  const sessionState = useDocumentSession(useRealtimeClient(), nodeMeta)
  const [editorFrame, setEditorFrame] = useState<HTMLIFrameElement | null>(null)
  const [editorStatus, setEditorStatus] = useState<'loading' | 'shown' | 'failed'>('loading')
  const [editorInvoker, setEditorInvoker] = useState<EditorInvoker>()

  const [wordCount, setWordCountInfo] = useWordCountState()
  const [modal, showModal] = useGenericAlertModal()
  const { toggleDebugMode } = useDebugMode()
  const isDarkMode = useIsEditorDarkMode()
  const session = sessionState.status === 'ready' ? sessionState.session : undefined
  const role = sessionState.status === 'ready' ? sessionState.role : 'Viewer'
  const roleReads = sessionState.status === 'ready' ? sessionState.roleReads : 0
  // The editor is initialized once, for the role read first: a role read again after a rebootstrap changes the lock
  // and the header, never initializes the editor again
  const roleRef = useRef(role)
  roleRef.current = role
  const node = useLiveDocumentNode(sessionState.status === 'ready' ? sessionState.node : undefined)

  const failEditor = useCallback(
    (error: Error) => {
      logger.error('Failed to show the document in the editor', error)
      setEditorStatus('failed')
    },
    [logger],
  )
  const onFileMenuAction = useCallback(
    (action: FileMenuAction) => handleFileMenuAction(action, { openHelp, toggleDebugMode }, logger),
    [logger, toggleDebugMode],
  )

  const snapshot = useLiveEditing({ session, editorInvoker, role, roleReads, onEditorError: failEditor })
  usePauseWhileAway(session)
  const waitingForActivity = useRetryOnActivity(session)
  useStopFollowUps(session, showModal)
  useLeaveWarning(session)
  // Before the effect that initializes the editor, so the user name reaches the editor first
  useEditorBasics(editorInvoker, isDarkMode)
  const receivePresenceFromEditor = usePresenceBridge(session, editorStatus === 'failed' ? undefined : editorInvoker)

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
        sendUpdate: (update) => session.sendUpdate(update),
        isFlagEnabled,
        onEditorError,
        onWordCount: setWordCountInfo,
        showModal,
        onFileMenuAction,
        onPresenceUpdate: receivePresenceFromEditor,
        logger,
      }),
      logger,
    )
    // useLiveEditing connects once the editor holds the base state, so RTS's replay reaches the editor after it
    sendBaseState(bridge.editorInvoker, session).then(() => {
      if (!controller.signal.aborted) {
        setEditorInvoker(bridge.editorInvoker)
      }
    }, onEditorError)

    return () => {
      controller.abort()
      bridge.destroy()
      setEditorInvoker(undefined)
    }
  }, [
    editorFrame,
    failEditor,
    isFlagEnabled,
    logger,
    onFileMenuAction,
    receivePresenceFromEditor,
    session,
    setWordCountInfo,
    showModal,
  ])

  // As docs-core's EditorController, wait for RTS to replay the edits it has not committed yet: before that the
  // editor may hold nothing. While reconnecting or stopped before then, the loader stays, with SessionStatus in the header.
  const caughtUp = snapshot?.caughtUp === true
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

  const retryConnection = () => {
    // A second click, or a retry on activity after an idle eviction, may have left `stopped` already
    if (session?.getSnapshot().status.name !== 'stopped') {
      return
    }
    session.retry().catch((error) => logger.warn('Failed to reconnect the document session', error))
  }

  const header = node && (
    <DocumentHeaderV2
      node={node}
      role={role}
      editorInvoker={editorInvoker}
      wordCount={wordCount}
      onFileMenuAction={onFileMenuAction}
      status={editorInvoker && snapshot && <SessionStatus snapshot={snapshot} onRetry={retryConnection} />}
    />
  )

  return (
    <DocumentShell header={header}>
      <div className="flex-column flex h-full w-full flex-nowrap">
        <div className="relative w-full flex-1">
          <EditorFrame
            onFrameReady={setEditorFrame}
            systemMode={EditorSystemMode.Edit}
            logger={logger}
            isDarkMode={isDarkMode}
          />
          {editorStatus === 'loading' && <DocumentLoader className="bg-norm absolute left-0 top-0" />}
          {waitingForActivity && <IdleActivityCatcher />}
        </div>
        {editorStatus === 'shown' && <WordCountOverlay wordCount={wordCount} />}
        {modal}
        <DocumentSizeLimitModal session={session} />
      </div>
    </DocumentShell>
  )
}
