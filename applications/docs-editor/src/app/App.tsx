import { useEffect, useMemo, useRef, useState } from 'react'
import { EditorToClientBridge } from './Bridge/EditorToClientBridge'
import { Editor } from './Editor'
import {
  ClientRequiresEditorMethods,
  CommentMarkNodeChangeData,
  CommentsEvent,
  ConvertibleDataType,
  DocState,
  EditorEditableChangeEvent,
  LiveCommentsEvent,
  RtsMessagePayload,
  WebsocketConnectionEvent,
  WebsocketConnectionStatus,
  YDocMap,
} from '@proton/docs-shared'
import { Doc as YDoc } from 'yjs'
import { Icons } from '@proton/components'
import { InternalEventBus } from '@proton/docs-shared'
import { InternalEventBusProvider } from './InternalEventBusProvider'
import { CircleLoader } from '@proton/atoms/CircleLoader'

type Props = {}

type InitialConfig = {
  initialData?: {
    data: Uint8Array
    type: ConvertibleDataType
  }
  documentId: string
  username: string
}

export function App({}: Props) {
  const [initialConfig, setInitialConfig] = useState<InitialConfig | null>(null)
  const [bridge] = useState(() => new EditorToClientBridge(window.parent))
  const [docState, setDocState] = useState<DocState | null>(null)
  const stylesheetRef = useRef<HTMLStyleElement | null>(null)
  const [eventBus] = useState(() => new InternalEventBus())

  const docMap = useMemo(() => {
    const map: YDocMap = new Map<string, YDoc>()
    return map
  }, [])

  useEffect(() => {
    if (docState) {
      return
    }

    const newDocState = new DocState({
      docStateRequestsPropagationOfUpdate: (message: RtsMessagePayload, originator: string, debugSource: string) => {
        bridge
          .getClientInvoker()
          .editorRequestsPropagationOfUpdate(message, originator, debugSource)
          .catch(console.error)
      },
      handleAwarenessStateUpdate: (states) => {
        bridge.getClientInvoker().handleAwarenessStateUpdate(states).catch(console.error)
      },
    })

    setDocState(newDocState)

    const requestHandler: ClientRequiresEditorMethods = {
      async receiveMessage(message: RtsMessagePayload) {
        void newDocState.receiveMessage(message)
      },

      async receiveThemeChanges(styles: string) {
        if (!stylesheetRef.current) {
          return
        }

        stylesheetRef.current.innerHTML = styles
      },

      async getClientId() {
        return newDocState.getClientId()
      },

      async performClosingCeremony() {
        void newDocState.performOpeningCeremony()
      },

      async performOpeningCeremony() {
        void newDocState.performClosingCeremony()
      },

      async getDocumentState() {
        return newDocState.getDocState()
      },

      async handleCommentsChange() {
        eventBus.publish({
          type: CommentsEvent.CommentsChanged,
          payload: undefined,
        })
      },

      async handleTypingStatusChange(threadId: string) {
        eventBus.publish({
          type: LiveCommentsEvent.TypingStatusChange,
          payload: {
            threadId,
          },
        })
      },

      async handleCreateCommentMarkNode(markID: string) {
        eventBus.publish<CommentMarkNodeChangeData>({
          type: CommentsEvent.CreateMarkNode,
          payload: {
            markID,
          },
        })
      },
      async handleRemoveCommentMarkNode(markID: string) {
        eventBus.publish<CommentMarkNodeChangeData>({
          type: CommentsEvent.RemoveMarkNode,
          payload: {
            markID,
          },
        })
      },
      async handleResolveCommentMarkNode(markID: string) {
        eventBus.publish<CommentMarkNodeChangeData>({
          type: CommentsEvent.ResolveMarkNode,
          payload: {
            markID,
          },
        })
      },
      async handleUnresolveCommentMarkNode(markID: string) {
        eventBus.publish<CommentMarkNodeChangeData>({
          type: CommentsEvent.UnresolveMarkNode,
          payload: {
            markID,
          },
        })
      },

      async handleWSConnectionStatusChange(status) {
        eventBus.publish({
          type: WebsocketConnectionEvent.StatusChanged,
          payload: {
            status,
          },
        })
        switch (status) {
          case WebsocketConnectionStatus.Connected:
            newDocState.canBeEditable = true
            eventBus.publish({
              type: EditorEditableChangeEvent,
              payload: {
                editable: true,
              },
            })
            break
          default:
            newDocState.canBeEditable = false
            eventBus.publish({
              type: EditorEditableChangeEvent,
              payload: {
                editable: false,
              },
            })
            break
        }
      },

      async initializeEditor(
        documentId: string,
        username: string,
        initialData?: Uint8Array,
        initialDataType?: ConvertibleDataType,
      ) {
        docMap.set(documentId, newDocState.getDoc())

        if (initialData && initialDataType) {
          setInitialConfig({ documentId, username, initialData: { data: initialData, type: initialDataType } })
        } else {
          setInitialConfig({ documentId, username })
        }
      },

      async broadcastPresenceState() {
        newDocState.broadcastPresenceState()
      },

      async refreshPresenceState() {
        newDocState.refreshPresenceState()
      },
    }

    bridge.setRequestHandler(requestHandler)
  }, [bridge, docMap, docState, eventBus])

  if (!initialConfig || !docState) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-4">
        <CircleLoader size="large" />
        Waiting for editor initialization...
      </div>
    )
  }

  return (
    <div className="relative grid h-full w-full grid-cols-[3fr_max(20vw,300px)] grid-rows-[min-content_1fr] overflow-hidden bg-[white]">
      <InternalEventBusProvider eventBus={eventBus}>
        <Editor
          clientInvoker={bridge.getClientInvoker()}
          docMap={docMap}
          docState={docState}
          documentId={initialConfig.documentId}
          injectWithNewContent={initialConfig.initialData}
          username={initialConfig.username}
        />
      </InternalEventBusProvider>
      <Icons />
      <style ref={stylesheetRef}></style>
    </div>
  )
}
