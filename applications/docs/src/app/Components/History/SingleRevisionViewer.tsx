import type { EditorInvoker } from '@proton/docs-core'
import type { YjsState } from '@proton/docs-shared'
import { EditorSystemMode, InternalEventBus } from '@proton/docs-shared'
import { EditorFrame } from '../EditorFrame'
import { useCallback } from 'react'
import { ClientToEditorBridge } from '@proton/docs-core'
import type { EditorOrchestratorInterface } from '@proton/docs-core'

export function SingleRevisionViewer({
  state,
  onEditorInvokerRef,
}: {
  state: YjsState
  onEditorInvokerRef: (editorInvoker: EditorInvoker) => void
}) {
  const onFrameReady = useCallback(
    async (frame: HTMLIFrameElement) => {
      const orchestrator = {
        provideEditorInvoker: () => {},
      } as unknown as EditorOrchestratorInterface

      const bridge = new ClientToEditorBridge(frame, orchestrator, new InternalEventBus())

      bridge.logger.setEnabled(false)

      const newEditorInvoker = bridge.editorInvoker

      newEditorInvoker.initializeEditor('DummyDocumentId', 'DummyUserAddress', 'Viewer').catch(console.error)

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
    [onEditorInvokerRef, state],
  )

  return <EditorFrame systemMode={EditorSystemMode.Revision} onFrameReady={onFrameReady} />
}
