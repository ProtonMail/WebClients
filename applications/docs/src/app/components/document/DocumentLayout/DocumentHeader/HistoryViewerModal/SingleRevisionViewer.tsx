import { useConfig } from '@proton/app-context/useConfig'
import type { EditorInvoker, EditorOrchestratorInterface } from '@proton/docs-core'
import type { YjsState, DocumentType } from '@proton/docs-shared'
import { EditorSystemMode, InternalEventBus, SyncedEditorState } from '@proton/docs-shared'
import { EditorFrame } from '../../../EditorFrame'
import { useCallback, useEffect, useState } from 'react'
import { ClientToEditorBridge } from '@proton/docs-core'
import { useApplication } from '~/utils/application-context'
import { useTheme } from '@proton/components/containers/themes/ThemeProvider'
import { useIsDarkThemeEnabled } from '~/utils/flags'

export type SingleRevisionViewerProps = {
  state: YjsState
  onEditorInvokerRef: (editorInvoker: EditorInvoker) => void
  documentType: DocumentType
}

export function SingleRevisionViewer({ state, onEditorInvokerRef, documentType }: SingleRevisionViewerProps) {
  const { logger } = useApplication()
  const { APP_VERSION } = useConfig()
  const isDarkThemeEnabled = useIsDarkThemeEnabled()
  const { information } = useTheme()
  const [editorInvoker, setEditorInvoker] = useState<EditorInvoker | null>(null)
  const isDarkMode = isDarkThemeEnabled && information.dark

  useEffect(() => {
    if (editorInvoker) {
      void editorInvoker.setDarkMode(isDarkMode)
    }
  }, [editorInvoker, isDarkMode])
  const onFrameReady = useCallback(
    async (frame: HTMLIFrameElement) => {
      const orchestrator = {
        provideEditorInvoker: () => {},
      } as unknown as EditorOrchestratorInterface

      const bridge = new ClientToEditorBridge(frame, orchestrator, new InternalEventBus(), new SyncedEditorState())

      bridge.logger.setEnabled(false)

      const newEditorInvoker = bridge.editorInvoker
      setEditorInvoker(newEditorInvoker)

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
      isDarkMode={isDarkMode}
    />
  )
}
