import type { EditorInvoker, EditorOrchestratorInterface } from '@proton/docs-core'
import type { YjsState } from '@proton/docs-shared'
import { EditorSystemMode, InternalEventBus, SyncedEditorState } from '@proton/docs-shared'
import { EditorFrame } from '../../../EditorFrame'
import { useCallback } from 'react'
import { ClientToEditorBridge } from '@proton/docs-core'
import { useApplication } from '~/utils/application-context'
import type { DocumentType } from '@proton/drive-store/store/_documents'
import { useConfig } from '@proton/components'

export type SingleRevisionViewerProps = {
  state: YjsState
  onEditorInvokerRef: (editorInvoker: EditorInvoker) => void
  documentType: DocumentType
}

export function SingleRevisionViewer({ state, onEditorInvokerRef, documentType }: SingleRevisionViewerProps) {
  const { logger } = useApplication()
  const { APP_VERSION } = useConfig()
  const onFrameReady = useCallback(
    async (frame: HTMLIFrameElement) => {
      const orchestrator = {
        provideEditorInvoker: () => {},
      } as unknown as EditorOrchestratorInterface

      const bridge = new ClientToEditorBridge(frame, orchestrator, new InternalEventBus(), new SyncedEditorState())

      bridge.logger.setEnabled(false)

      const newEditorInvoker = bridge.editorInvoker

      newEditorInvoker
        .initializeEditor('DummyDocumentId', 'DummyUserAddress', 'Viewer', false, APP_VERSION)
        .catch(console.error)

      newEditorInvoker
        .receiveMessage({
          content: state,
          type: {
            wrapper: 'du',
          },
        })
        .catch(console.error)

      newEditorInvoker.showEditor().catch(console.error)

      onEditorInvokerRef(newEditorInvoker)
    },
    [APP_VERSION, onEditorInvokerRef, state],
  )

  return (
    <EditorFrame
      systemMode={EditorSystemMode.Revision}
      onFrameReady={onFrameReady}
      logger={logger}
      documentType={documentType}
    />
  )
}
