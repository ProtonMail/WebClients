import { useCallback, useId, useMemo, useRef, useState } from 'react'
import { EditorToClientBridge } from '../Bridge/EditorToClientBridge'
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
import { reportErrorToSentry } from '../Utils/errorMessage'
import { EditorState } from './EditorState'
import { c } from 'ttag'

export type EditorConfig = {
  editorInitializationConfig?: EditorInitializationConfig
  documentId: string
  userAddress: string
}

export function useBridge({ systemMode }: { systemMode: EditorSystemMode }) {
  const [application] = useState(() => new Application())
  const [bridge] = useState(() => new EditorToClientBridge(window.parent))
  const [docState, setDocState] = useState<DocState | null>(null)
  const [editorState] = useState<EditorState>(new EditorState(systemMode))

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
            if (message.type.wrapper === 'du') {
              application.logger.info('Doc state requested propagation of DU before initialization was complete')
            } else if (message.type.wrapper === 'events') {
              application.logger.info(
                `Doc state requested propagation of event ${message.type.eventType} before initialization was complete`,
              )
            } else {
              application.logger.info(
                `Doc state requested propagation of unknown message type ${message.type.wrapper} before initialization was complete`,
              )
            }

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
        handleErrorWhenReceivingDocumentUpdate: (error) => {
          if (error instanceof Error) {
            void reportErrorToSentry(error)
          }
          void bridge
            .getClientInvoker()
            .reportUserInterfaceError(
              new Error(
                c('Error')
                  .t`There was an error processing updates to the document. Please reload the page and try again.`,
              ),
              { irrecoverable: false, lockEditor: true },
            )
        },
      },
      application.logger,
    )

    setDocState(newDocState)

    if (systemMode === EditorSystemMode.Revision || systemMode === EditorSystemMode.PublicView) {
      docMap.set(viewOnlyDocumentId, newDocState.getDoc())
    }
  })

  return { bridge, docState, application, docMap, editorConfig, setEditorConfig, didSetInitialConfig, editorState }
}
