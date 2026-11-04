import { useEffect, useState } from 'react'

import { useConfig } from '@proton/app-context/useConfig'
import { EditorSystemMode } from '@proton/docs-shared/EditorSystemMode'
import { useGetFlag } from '@proton/unleash/useGetFlag'
import type { PrivateNodeMeta } from '@proton-docs/realtime-sdk'

import { EditorFrame } from '~/components/document/EditorFrame'
import { useApplication } from '~/utils/application-context'

import { ClientEditorBridge } from '../__utils/ClientEditorBridge'
import { createClientHandler } from '../__utils/createClientHandler'
import { showReadOnlyDocument } from '../__utils/showReadOnlyDocument'
import { useDocumentSession } from '../__utils/useDocumentSession'
import { useRealtimeClient } from '../__utils/useRealtimeClient'
import { DocumentLoader } from './DocumentLoader'
import { OpenActionError } from './OpenActionError'

export const EDITOR_FRAME_READY_TIMEOUT_MS = 30_000

export type DocumentViewerV2Props = { nodeMeta: PrivateNodeMeta; onRetry: () => void }

/** Shows the text document `nodeMeta` read-only, from its base state, with no websocket. */
export function DocumentViewerV2({ nodeMeta, onRetry }: DocumentViewerV2Props) {
  const { logger } = useApplication()
  const { APP_VERSION } = useConfig()
  const isFlagEnabled = useGetFlag()
  const sessionState = useDocumentSession(useRealtimeClient(), nodeMeta)
  const [editorFrame, setEditorFrame] = useState<HTMLIFrameElement | null>(null)
  const [editorStatus, setEditorStatus] = useState<'loading' | 'shown' | 'failed'>('loading')

  const session = sessionState.status === 'ready' ? sessionState.session : undefined

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
      if (controller.signal.aborted) {
        return
      }
      logger.error('Failed to show the document in the editor', error)
      setEditorStatus('failed')
    }

    const bridge = new ClientEditorBridge(
      editorFrame,
      createClientHandler({ editorFrame, isFlagEnabled, onEditorError, logger }),
      logger,
    )
    showReadOnlyDocument(bridge.editorInvoker, session, APP_VERSION).then(() => {
      if (!controller.signal.aborted) {
        setEditorStatus('shown')
      }
    }, onEditorError)

    return () => {
      controller.abort()
      bridge.destroy()
    }
  }, [APP_VERSION, editorFrame, isFlagEnabled, logger, session])

  if (sessionState.status === 'failed') {
    const canRetry = sessionState.reason === 'bootstrapFailed' || sessionState.reason === 'unreadableUpdate'
    return <OpenActionError reason={sessionState.reason} onRetry={canRetry ? onRetry : undefined} />
  }

  if (editorStatus === 'failed') {
    return <OpenActionError reason="editorFailed" onRetry={onRetry} />
  }

  return (
    <div className="relative h-full w-full">
      <EditorFrame
        onFrameReady={setEditorFrame}
        systemMode={EditorSystemMode.Edit}
        logger={logger}
        isDarkMode={false}
      />
      {editorStatus === 'loading' && <DocumentLoader className="bg-norm absolute left-0 top-0" />}
    </div>
  )
}
