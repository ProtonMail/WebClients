import { useCallback, useId, useMemo, useRef, useState } from 'react'
import { EditorToClientBridge } from './Bridge/EditorToClientBridge'
import useEffectOnce from '@proton/hooks/useEffectOnce'
import { DocState } from '@proton/docs-shared/lib/Doc/DocState'
import type { RtsMessagePayload } from '@proton/docs-shared/lib/Doc/RtsMessagePayload'
import type { BroadcastSource } from '@proton/docs-shared/lib/Bridge/BroadcastSource'
import { Application } from './Application'
import type { DocsAwarenessStateChangeData } from '@proton/docs-shared/lib/DocAwarenessEvent'
import { DocAwarenessEvent } from '@proton/docs-shared/lib/DocAwarenessEvent'
import type { YDocMap } from '@proton/docs-shared/lib/YDocMap'
import type { Doc as YDoc } from 'yjs'
import { EditorSystemMode } from '@proton/docs-shared/lib/EditorSystemMode'
import type { EditorInitializationConfig } from '@proton/docs-shared/lib/EditorInitializationConfig'
import { reportErrorToSentry } from './Utils/errorMessage'

export type EditorConfig = {
  editorInitializationConfig?: EditorInitializationConfig
  documentId: string
  userAddress: string
}

export function useBridge({ systemMode }: { systemMode: EditorSystemMode }) {
  const [application] = useState(() => new Application())
  const [bridge] = useState(() => new EditorToClientBridge(window.parent))
  const [docState, setDocState] = useState<DocState | null>(null)

  const viewOnlyDocumentId = useId()

  const [didSetInitialConfig, setDidSetInitialConfig] = useState(false)
  const editorConfig = useRef<EditorConfig | null>(
    systemMode === EditorSystemMode.Revision || systemMode === EditorSystemMode.PublicView
      ? {
          documentId: viewOnlyDocumentId,
          userAddress: '',
        }
      : null,
  )

  const docMap = useMemo(() => {
    const map: YDocMap = new Map<string, YDoc>()
    return map
  }, [])

  const setEditorConfig = useCallback((config: EditorConfig) => {
    editorConfig.current = config
    setDidSetInitialConfig(true)
  }, [])

  useEffectOnce(() => {
    const newDocState = new DocState(
      {
        docStateRequestsPropagationOfUpdate: (message: RtsMessagePayload, debugSource: BroadcastSource) => {
          /** Return if the parent hasn't properly initialized us yet */
          if (!editorConfig.current) {
            application.logger.info('Doc state requested update before initialization was complete')
            return
          }

          if (
            application.getRole().isPublicViewer() ||
            systemMode === EditorSystemMode.PublicView ||
            systemMode === EditorSystemMode.Revision
          ) {
            return
          }

          bridge
            .getClientInvoker()
            .editorRequestsPropagationOfUpdate(message, debugSource)
            .catch((e: Error) => {
              void reportErrorToSentry(e)
            })
        },
        handleAwarenessStateUpdate: (states) => {
          /** Return if the parent hasn't properly initialized us yet */
          if (!editorConfig.current) {
            application.logger.info('Doc state requested awareness update before initialization was complete')
            return
          }

          if (
            application.getRole().isPublicViewer() ||
            systemMode === EditorSystemMode.PublicView ||
            systemMode === EditorSystemMode.Revision
          ) {
            return
          }

          bridge
            .getClientInvoker()
            .handleAwarenessStateUpdate(states)
            .catch((e: Error) => {
              void reportErrorToSentry(e)
            })

          application.eventBus.publish<DocsAwarenessStateChangeData>({
            type: DocAwarenessEvent.AwarenessStateChange,
            payload: {
              states,
            },
          })
        },
      },
      application.logger,
    )

    setDocState(newDocState)

    if (systemMode === EditorSystemMode.Revision || systemMode === EditorSystemMode.PublicView) {
      docMap.set(viewOnlyDocumentId, newDocState.getDoc())
    }
  })

  return { bridge, docState, application, docMap, editorConfig, setEditorConfig, didSetInitialConfig }
}
