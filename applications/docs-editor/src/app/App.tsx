import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { EditorToClientBridge } from './Bridge/EditorToClientBridge'
import { Editor } from './Editor'
import {
  BridgeOriginProvider,
  BroadcastSource,
  ClientRequiresEditorMethods,
  CommentMarkNodeChangeData,
  CommentsEvent,
  ConvertibleDataType,
  DocState,
  EDITOR_READY_POST_MESSAGE_EVENT,
  LiveCommentsEvent,
  RtsMessagePayload,
  YDocMap,
  DocumentRoleType,
} from '@proton/docs-shared'
import { Doc as YDoc } from 'yjs'
import { Icons } from '@proton/components'
import { ApplicationProvider } from './ApplicationProvider'
import { CircleLoader } from '@proton/atoms/CircleLoader'
import { c } from 'ttag'
import useEffectOnce from '@proton/hooks/useEffectOnce'
import locales from './locales'
import { setTtagLocales } from '@proton/shared/lib/i18n/locales'
import { LexicalEditor } from 'lexical'
import { SHOW_ALL_COMMENTS_COMMAND } from './Commands'
import { generateEditorStatefromYDoc } from './Conversion/GenerateEditorStateFromYDoc'
import { exportDataFromEditorState } from './Conversion/ExportDataFromEditorState'
import { Application } from './Application'
import { ThemeStyles } from './Theme'
import { DocumentInteractionMode } from './DocumentInteractionMode'
import debounce from '@proton/utils/debounce'

type Props = {
  nonInteractiveMode: boolean
}

type InitialConfig = {
  initialData?: {
    data: Uint8Array
    type: ConvertibleDataType
  }
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
          initialData?: Uint8Array,
          initialDataType?: ConvertibleDataType,
        ) {
          docMap.set(documentId, newDocState.getDoc())
          application.setRole(role)

          if (initialData && initialDataType) {
            setInitialConfig({ documentId, username, initialData: { data: initialData, type: initialDataType } })
          } else {
            setInitialConfig({ documentId, username })
          }
        },

        async broadcastPresenceState() {
          newDocState.broadcastPresenceState()
        },

        async exportData(format): Promise<Uint8Array | Blob> {
          const editorState = generateEditorStatefromYDoc(newDocState.getDoc())
          return exportDataFromEditorState(editorState, format)
        },

        async printAsPDF(): Promise<void> {
          window.print()
        },
      }

      bridge.setClientRequestHandler(requestHandler)
    },
    [bridge, docMap, application],
  )

  const createInitialDocState = useCallback(() => {
    const newDocState = new DocState({
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
      },
    })

    return newDocState
  }, [bridge])

  useEffect(() => {
    if (docState) {
      return
    }

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
    docState,
    nonInteractiveMode,
    notifyParentEditorIsReady,
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

    const updateFrameSize = debounce(() => {
      const element = editorRef.current?.getRootElement()
      if (element) {
        void bridge.getClientInvoker().updateFrameSize(element.scrollHeight)
      }
    }, 1_000)

    const removeListener = editorRef.current.registerUpdateListener(updateFrameSize)
    window.addEventListener('resize', updateFrameSize)
    window.addEventListener('beforeprint', updateFrameSize)

    updateFrameSize()

    return () => {
      removeListener()
      window.removeEventListener('resize', updateFrameSize)
      window.removeEventListener('beforeprint', updateFrameSize)
    }
  }, [bridge])

  if (!initialConfig || !docState) {
    return (
      <div className="bg-norm flex h-full w-full flex-col items-center justify-center gap-4">
        <CircleLoader size="large" />
        {c('Info').t`Waiting for editor initialization...`}
      </div>
    )
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
          injectWithNewContent={initialConfig.initialData}
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
