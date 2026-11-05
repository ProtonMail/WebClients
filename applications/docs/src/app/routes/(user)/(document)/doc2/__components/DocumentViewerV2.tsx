import { useCallback, useEffect, useState } from 'react'

import { useConfig } from '@proton/app-context/useConfig'
import { EditorSystemMode } from '@proton/docs-shared/EditorSystemMode'
import { useGetFlag } from '@proton/unleash/useGetFlag'
import type { PrivateNodeMeta } from '@proton-docs/realtime-sdk'

import { EditorFrame } from '~/components/document/EditorFrame'
import { useApplication } from '~/utils/application-context'

import { ClientEditorBridge } from '../__utils/ClientEditorBridge'
import type { EditorInvoker } from '../__utils/EditorInvoker'
import { createClientHandler } from '../__utils/createClientHandler'
import { showDocument } from '../__utils/showDocument'
import { useDocumentSession } from '../__utils/useDocumentSession'
import { useLiveEditing } from '../__utils/useLiveEditing'
import { usePauseWhileAway } from '../__utils/usePauseWhileAway'
import { useRealtimeClient } from '../__utils/useRealtimeClient'
import { DocumentLoader } from './DocumentLoader'
import { OpenActionError } from './OpenActionError'
import { SessionStatus } from './SessionStatus'

export const EDITOR_FRAME_READY_TIMEOUT_MS = 30_000

export type DocumentViewerV2Props = { nodeMeta: PrivateNodeMeta; onRetry: () => void }

/** Opens the text document `nodeMeta` for live editing, as far as the user's role allows. */
export function DocumentViewerV2({ nodeMeta, onRetry }: DocumentViewerV2Props) {
  const { logger } = useApplication()
  const { APP_VERSION } = useConfig()
  const isFlagEnabled = useGetFlag()
  const sessionState = useDocumentSession(useRealtimeClient(), nodeMeta)
  const [editorFrame, setEditorFrame] = useState<HTMLIFrameElement | null>(null)
  const [editorStatus, setEditorStatus] = useState<'loading' | 'shown' | 'failed'>('loading')
  const [editorInvoker, setEditorInvoker] = useState<EditorInvoker>()

  const session = sessionState.status === 'ready' ? sessionState.session : undefined
  const role = sessionState.status === 'ready' ? sessionState.role : 'Viewer'

  const failEditor = useCallback(
    (error: Error) => {
      logger.error('Failed to show the document in the editor', error)
      setEditorStatus('failed')
    },
    [logger],
  )
  const snapshot = useLiveEditing({ session, editorInvoker, role, onEditorError: failEditor })
  usePauseWhileAway(session)

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
        logger,
      }),
      logger,
    )
    showDocument(bridge.editorInvoker, session, role, APP_VERSION).then(() => {
      if (!controller.signal.aborted) {
        setEditorStatus('shown')
        setEditorInvoker(bridge.editorInvoker)
      }
    }, onEditorError)

    return () => {
      controller.abort()
      bridge.destroy()
      setEditorInvoker(undefined)
    }
  }, [APP_VERSION, editorFrame, failEditor, isFlagEnabled, logger, role, session])

  if (sessionState.status === 'failed') {
    const canRetry = sessionState.reason === 'bootstrapFailed' || sessionState.reason === 'unreadableUpdate'
    return <OpenActionError reason={sessionState.reason} onRetry={canRetry ? onRetry : undefined} />
  }

  if (editorStatus === 'failed') {
    return <OpenActionError reason="editorFailed" onRetry={onRetry} />
  }

  const retryConnection = () => {
    session?.retry().catch((error) => logger.warn('Failed to reconnect the document session', error))
  }

  return (
    <div className="flex-column flex h-full w-full flex-nowrap">
      {editorInvoker && snapshot && <SessionStatus status={snapshot.status} onRetry={retryConnection} />}
      <div className="relative w-full flex-1">
        <EditorFrame
          onFrameReady={setEditorFrame}
          systemMode={EditorSystemMode.Edit}
          logger={logger}
          isDarkMode={false}
        />
        {editorStatus === 'loading' && <DocumentLoader className="bg-norm absolute left-0 top-0" />}
      </div>
    </div>
  )
}
