import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { EditorToClientBridge } from './Bridge/EditorToClientBridge'
import { Editor } from './Editor'
import type {
  BroadcastSource,
  ClientRequiresEditorMethods,
  CommentMarkNodeChangeData,
  RtsMessagePayload,
  YDocMap,
  DocumentRoleType,
  DocsAwarenessStateChangeData,
  EditorInitializationConfig,
} from '@proton/docs-shared'
import {
  BridgeOriginProvider,
  CommentsEvent,
  DocState,
  EDITOR_READY_POST_MESSAGE_EVENT,
  LiveCommentsEvent,
  DocAwarenessEvent,
} from '@proton/docs-shared'
import type { Doc as YDoc } from 'yjs'
import { Icons } from '@proton/components'
import { ApplicationProvider } from './ApplicationProvider'
import useEffectOnce from '@proton/hooks/useEffectOnce'
import locales from './locales'
import { setTtagLocales } from '@proton/shared/lib/i18n/locales'
import type { LexicalEditor, SerializedEditorState } from 'lexical'
import { SHOW_ALL_COMMENTS_COMMAND } from './Commands'
import { generateEditorStatefromYDoc } from './Conversion/GenerateEditorStateFromYDoc'
import { exportDataFromEditorState } from './Conversion/ExportDataFromEditorState'
import { Application } from './Application'
import { ThemeStyles } from './Theme'
import type { DocumentInteractionMode } from './DocumentInteractionMode'
import debounce from '@proton/utils/debounce'

type Props = {
  nonInteractiveMode: boolean
}

type InitialConfig = {
  editorInitializationConfig?: EditorInitializationConfig
  documentId: string
  username: string
}

export function App({ nonInteractiveMode = false }: Props) {
  const viewOnlyDocumentId = useId()

  const [initialConfig, setInitialConfig] = useState<InitialConfig | null>(
    nonInteractiveMode
      ? {
          documentId: viewOnlyDocumentId,
          username: '',
        }
      : null,
  )
  const [bridge] = useState(() => new EditorToClientBridge(window.parent))
  const [docState, setDocState] = useState<DocState | null>(null)
  const [application] = useState(() => new Application())
  const [editorHidden, setEditorHidden] = useState(true)
  const [editingLocked, setEditingLocked] = useState(true)
  const [interactionMode, setInteractionMode] = useState<DocumentInteractionMode>('edit')

  useEffectOnce(() => {
    setTtagLocales(locales)
  })

  const editorRef = useRef<LexicalEditor | null>(null)
  const setEditorRef = useCallback((instance: LexicalEditor | null) => {
    editorRef.current = instance
  }, [])

  const docMap = useMemo(() => {
    const map: YDocMap = new Map<string, YDoc>()
    return map
  }, [])

  const notifyParentEditorIsReady = useCallback(() => {
    window.parent.postMessage(EDITOR_READY_POST_MESSAGE_EVENT, BridgeOriginProvider.GetClientOrigin())
  }, [])

  const setBridgeRequestHandler = useCallback(
    (newDocState: DocState) => {
      const requestHandler: ClientRequiresEditorMethods = {
        async receiveMessage(message: RtsMessagePayload) {
          void newDocState.receiveMessage(message)
        },

        async showEditor() {
          setEditorHidden(false)
        },

        async showCommentsPanel() {
          const editor = editorRef.current
          if (!editor) {
            return
          }
          editor.dispatchCommand(SHOW_ALL_COMMENTS_COMMAND, undefined)
        },

        async getClientId() {
          return newDocState.getClientId()
        },

        async performOpeningCeremony() {
          void newDocState.performOpeningCeremony()
        },

        async performClosingCeremony() {
          void newDocState.performClosingCeremony()
        },

        async getDocumentState() {
          return newDocState.getDocState()
        },

        async handleCommentsChange() {
          application.eventBus.publish({
            type: CommentsEvent.CommentsChanged,
            payload: undefined,
          })
        },

        async handleTypingStatusChange(threadId: string) {
          application.eventBus.publish({
            type: LiveCommentsEvent.TypingStatusChange,
            payload: {
              threadId,
            },
          })
        },

        async handleCreateCommentMarkNode(markID: string) {
          application.eventBus.publish<CommentMarkNodeChangeData>({
            type: CommentsEvent.CreateMarkNode,
            payload: {
              markID,
            },
          })
        },

        async handleRemoveCommentMarkNode(markID: string) {
          application.eventBus.publish<CommentMarkNodeChangeData>({
            type: CommentsEvent.RemoveMarkNode,
            payload: {
              markID,
            },
          })
        },

        async handleResolveCommentMarkNode(markID: string) {
          application.eventBus.publish<CommentMarkNodeChangeData>({
            type: CommentsEvent.ResolveMarkNode,
            payload: {
              markID,
            },
          })
        },

        async handleUnresolveCommentMarkNode(markID: string) {
          application.eventBus.publish<CommentMarkNodeChangeData>({
            type: CommentsEvent.UnresolveMarkNode,
            payload: {
              markID,
            },
          })
        },

        async changeLockedState(locked) {
          setEditingLocked(locked)
        },

        async initializeEditor(
          documentId: string,
          username: string,
          role: DocumentRoleType,
          editorInitializationConfig,
        ) {
          docMap.set(documentId, newDocState.getDoc())
          application.setRole(role)

          if (editorInitializationConfig) {
            setInitialConfig({ documentId, username, editorInitializationConfig: editorInitializationConfig })
            if (editorInitializationConfig.mode === 'conversion') {
              newDocState.setIsInConversionFromOtherFormat()
            }
          } else {
            setInitialConfig({ documentId, username })
          }
        },

        async broadcastPresenceState() {
          newDocState.broadcastPresenceState()
        },

        async exportData(format): Promise<Uint8Array | Blob> {
          const editorState = generateEditorStatefromYDoc(newDocState.getDoc())
          return exportDataFromEditorState(editorState, format, {
            fetchExternalImageAsBase64: async (url) => bridge.getClientInvoker().fetchExternalImageAsBase64(url),
          })
        },

        async printAsPDF(): Promise<void> {
          window.print()
        },

        async getCurrentEditorState(): Promise<SerializedEditorState | undefined> {
          if (!editorRef.current) {
            return undefined
          }
          return editorRef.current.getEditorState().toJSON()
        },
      }

      bridge.setClientRequestHandler(requestHandler)
    },
    [bridge, docMap, application],
  )

  const createInitialDocState = useCallback(() => {
    const newDocState = new DocState(
      {
        docStateRequestsPropagationOfUpdate: (message: RtsMessagePayload, debugSource: BroadcastSource) => {
          bridge
            .getClientInvoker()
            .editorRequestsPropagationOfUpdate(message, debugSource)
            .catch((e: Error) => {
              void bridge.getClientInvoker().reportError(e)
            })
        },
        handleAwarenessStateUpdate: (states) => {
          bridge
            .getClientInvoker()
            .handleAwarenessStateUpdate(states)
            .catch((e: Error) => {
              void bridge.getClientInvoker().reportError(e)
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

    return newDocState
  }, [application.eventBus, application.logger, bridge])

  useEffectOnce(() => {
    const newDocState = createInitialDocState()
    setDocState(newDocState)

    if (nonInteractiveMode) {
      docMap.set(viewOnlyDocumentId, newDocState.getDoc())
    }

    setBridgeRequestHandler(newDocState)

    notifyParentEditorIsReady()
  }, [
    createInitialDocState,
    docMap,
    notifyParentEditorIsReady,
    nonInteractiveMode,
    setBridgeRequestHandler,
    viewOnlyDocumentId,
  ])

  const onInteractionModeChange = useCallback(
    (mode: DocumentInteractionMode) => {
      if (mode === 'edit' && !application.getRole().canEdit()) {
        return
      }

      setInteractionMode(mode)
    },
    [setInteractionMode, application],
  )

  useEffect(() => {
    if (!bridge || !editorRef || !editorRef.current) {
      return
    }

    const updateFrameSize = () => {
      const element = editorRef.current?.getRootElement()
      if (element) {
        void bridge.getClientInvoker().updateFrameSize(element.scrollHeight)
      }
    }

    const updateFrameSizeDebounced = debounce(() => {
      updateFrameSize()
    }, 1_000)

    const removeListener = editorRef.current.registerUpdateListener(updateFrameSizeDebounced)
    window.addEventListener('resize', updateFrameSizeDebounced)
    window.addEventListener('beforeprint', updateFrameSize)

    updateFrameSize()

    return () => {
      removeListener()
      window.removeEventListener('resize', updateFrameSizeDebounced)
      window.removeEventListener('beforeprint', updateFrameSize)
    }
  }, [bridge])

  if (!initialConfig || !docState) {
    return null
  }

  return (
    <div
      className="relative grid h-full w-full overflow-hidden bg-[white]"
      style={{
        '--comments-width': 'max(20.5vw, 300px)',
        gridTemplateRows: 'min-content 1fr',
        gridTemplateColumns: '3fr var(--comments-width)',
      }}
    >
      <ThemeStyles />
      <ApplicationProvider application={application}>
        <Editor
          clientInvoker={bridge.getClientInvoker()}
          docMap={docMap}
          docState={docState}
          documentId={initialConfig.documentId}
          editingLocked={editingLocked || interactionMode === 'view'}
          hasEditAccess={application.getRole().canEdit()}
          hidden={editorHidden}
          editorInitializationConfig={initialConfig.editorInitializationConfig}
          nonInteractiveMode={nonInteractiveMode}
          onEditorReadyToReceiveUpdates={() => {
            docState.onEditorReadyToReceiveUpdates()
          }}
          onInteractionModeChange={onInteractionModeChange}
          setEditorRef={setEditorRef}
          username={initialConfig.username}
        />
      </ApplicationProvider>
      <Icons />
    </div>
  )
}
