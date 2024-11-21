import { useCallback, useEffect, useRef, useState } from 'react'
import { Editor } from './Editor'
import { c } from 'ttag'
import type {
  ClientRequiresEditorMethods,
  CommentMarkNodeChangeData,
  RtsMessagePayload,
  DocumentRoleType,
  TranslatedResult,
} from '@proton/docs-shared'
import {
  BridgeOriginProvider,
  CommentsEvent,
  EDITOR_READY_POST_MESSAGE_EVENT,
  LiveCommentsEvent,
} from '@proton/docs-shared'
import { ApplicationProvider } from './ApplicationProvider'
import useEffectOnce from '@proton/hooks/useEffectOnce'
import locales from './locales'

import type { EditorState } from 'lexical'
import { type LexicalEditor, type SerializedEditorState } from 'lexical'
import { SHOW_ALL_COMMENTS_COMMAND } from './Commands'
import { exportDataFromEditorState } from './Conversion/Exporter/ExportDataFromEditorState'
import { ThemeStyles } from './Theme'
import debounce from '@proton/utils/debounce'
import { loadLocales } from '@proton/account/bootstrap'
import Icons from '@proton/icons/Icons'
import clsx from '@proton/utils/clsx'
import { EditorSystemMode } from '@proton/docs-shared/lib/EditorSystemMode'
import { EditorUserMode } from './EditorUserMode'
import { CircleLoader } from '@proton/atoms/index'
import { useBridge } from './useBridge'
import { removeCommentThreadMarks } from './Tools/removeCommentThreadMarks'
import { rejectAllSuggestions } from './Plugins/Suggestions/rejectAllSuggestions'
import { PreviewModeEditor } from './PreviewModeEditor'
import { NotificationsChildren, NotificationsProvider } from '@proton/components'
import { reportErrorToSentry } from './Utils/errorMessage'
import * as config from './config'
import { bootstrapEditorApp } from './Bootstrap'
import noop from '@proton/utils/noop'

type Props = {
  systemMode: EditorSystemMode
}

export function App({ systemMode }: Props) {
  const { application, bridge, docState, docMap, editorConfig, setEditorConfig, didSetInitialConfig } = useBridge({
    systemMode,
  })

  const [editorError, setEditorError] = useState<Error | undefined>(undefined)
  const [editorHidden, setEditorHidden] = useState(true)
  const [editingLocked, setEditingLocked] = useState(true)
  const [userMode, setUserMode] = useState<EditorUserMode>(
    systemMode === EditorSystemMode.Edit ? EditorUserMode.Edit : EditorUserMode.Preview,
  )

  const [isSuggestionsFeatureEnabled, setIsSuggestionsFeatureEnabled] = useState(false)
  useEffect(() => {
    if (userMode === EditorUserMode.Suggest && !isSuggestionsFeatureEnabled) {
      setUserMode(EditorUserMode.Edit)
    }
  }, [userMode, isSuggestionsFeatureEnabled])

  const [showTreeView, setShowTreeView] = useState(false)

  useEffectOnce(() => {
    ;(async () => {
      await bootstrapEditorApp({ config })
    })().catch(noop)
  })

  const editorRef = useRef<LexicalEditor | null>(null)
  const [clonedEditorState, setClonedEditorState] = useState<EditorState>()

  useEffect(() => {
    if (userMode !== EditorUserMode.Preview) {
      return
    }

    if (!editorRef.current) {
      return
    }

    setClonedEditorState(editorRef.current.getEditorState().clone())

    return editorRef.current.registerUpdateListener(({ editorState }) => {
      setClonedEditorState(editorState.clone())
    })
  }, [userMode])

  const setEditorRef = useCallback(
    (instance: LexicalEditor | null) => {
      editorRef.current = instance

      /**
       * Remove comment marks if we are in system presentation mode.
       * Do not remove for UserMode, since once we remove them, we can't add them back once they back into edit mode.
       */
      if (
        (systemMode === EditorSystemMode.Revision || systemMode === EditorSystemMode.PublicView) &&
        editorRef.current
      ) {
        removeCommentThreadMarks(editorRef.current)
        rejectAllSuggestions(editorRef.current)
      }
    },
    [systemMode],
  )

  const notifyParentEditorIsReady = useCallback(() => {
    window.parent.postMessage(EDITOR_READY_POST_MESSAGE_EVENT, BridgeOriginProvider.GetClientOrigin())
  }, [])

  useEffect(() => {
    if (!docState) {
      return
    }

    const requestHandler: ClientRequiresEditorMethods = {
      async receiveMessage(message: RtsMessagePayload) {
        void docState.receiveMessage(message)
      },

      async loadUserSettings(settings) {
        void loadLocales({ locales, userSettings: settings })
        application.setLocale(settings.Locale)
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
        return docState.getClientId()
      },

      async performOpeningCeremony() {
        void docState.performOpeningCeremony()
      },

      async performClosingCeremony() {
        void docState.performClosingCeremony()
      },

      async getDocumentState() {
        return docState.getDocState()
      },

      async replaceEditorState(state: SerializedEditorState) {
        const editorState = editorRef.current?.parseEditorState(state)
        if (!editorState) {
          return
        }

        editorRef.current?.setEditorState(editorState)
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

      async initializeEditor(documentId: string, username: string, role: DocumentRoleType, editorInitializationConfig) {
        docMap.set(documentId, docState.getDoc())
        application.setRole(role)

        application.logger.info('Initialized editor with role', role, 'config', editorInitializationConfig)

        if (editorInitializationConfig) {
          setEditorConfig({ documentId, username, editorInitializationConfig: editorInitializationConfig })
          if (editorInitializationConfig.mode === 'conversion') {
            docState.setIsInConversionFromOtherFormat()
          }
        } else {
          setEditorConfig({ documentId, username })
        }
      },

      async broadcastPresenceState() {
        docState.broadcastPresenceState()
      },

      async exportData(format): Promise<Uint8Array> {
        if (!editorRef.current) {
          throw new Error('Editor is not initialized')
        }

        const editorState = editorRef.current.getEditorState().toJSON()

        try {
          const result = await exportDataFromEditorState(editorState, format, {
            fetchExternalImageAsBase64: async (url) => bridge.getClientInvoker().fetchExternalImageAsBase64(url),
          })
          return result
        } catch (error) {
          void bridge.getClientInvoker().showGenericAlertModal(c('Error').t`Failed to export document.`)
          throw error
        }
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

      async toggleDebugTreeView() {
        setShowTreeView((show) => !show)
      },

      async handleIsSuggestionsFeatureEnabled(enabled) {
        setIsSuggestionsFeatureEnabled(enabled)
      },
    }

    bridge.setClientRequestHandler(requestHandler)

    notifyParentEditorIsReady()
  }, [bridge, docMap, application, docState, notifyParentEditorIsReady, setEditorConfig])

  const onUserModeChange = useCallback(
    (mode: EditorUserMode) => {
      const canSwitchToSuggestionMode = isSuggestionsFeatureEnabled
      if (mode === EditorUserMode.Suggest && !canSwitchToSuggestionMode) {
        return
      }

      if ((mode === EditorUserMode.Edit || mode === EditorUserMode.Suggest) && !application.getRole().canEdit()) {
        return
      }

      setUserMode(mode)
    },
    [isSuggestionsFeatureEnabled, application],
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

  const onEditorLoadResult = useCallback(
    (result: TranslatedResult<void>) => {
      if (result.isFailed()) {
        const error = new Error(result.getTranslatedError())

        void bridge.getClientInvoker().reportUserInterfaceError(error, { irrecoverable: true })

        reportErrorToSentry(error)

        return
      }

      if (!docState) {
        throw new Error('docState is not set')
      }

      docState.onEditorReadyToReceiveUpdates()

      application.logger.info('Editor is ready to receive updates')
    },
    [docState, bridge, application.logger],
  )

  const onEditorError = useCallback(
    (error: Error) => {
      /** Report a UI displayable error */
      const message = c('Error')
        .t`An error occurred while loading the document. To prevent document corruption, the editor has been locked. Please reload the page and try again. If the error persists, please open Version History from the menu options to attempt to restore your document to an earlier version.`
      void bridge
        .getClientInvoker()
        .reportUserInterfaceError(new Error(message), { irrecoverable: false, lockEditor: true })

      /** Report the underlying error */
      reportErrorToSentry(error)

      application.logger.error('A lexical error occurred', error)

      setEditorError(error)
    },
    [application.logger, bridge],
  )

  if (!didSetInitialConfig || !editorConfig.current || !docState) {
    application.logger.debug('Attempting to render editor before it is ready', {
      didSetInitialConfig,
      editorConfig: editorConfig.current,
      docState,
    })

    return (
      <div className="flex-column absolute left-0 top-0 flex h-full w-full items-center justify-center">
        <CircleLoader size="large" />
      </div>
    )
  }

  const isSuggestionMode = userMode === EditorUserMode.Suggest
  const isPreviewMode = systemMode === EditorSystemMode.Edit && userMode === EditorUserMode.Preview

  return (
    <div
      className={clsx('relative grid h-full w-full overflow-hidden bg-[white]', isSuggestionMode && 'suggestion-mode')}
      style={{
        '--comments-width': 'max(20.5vw, 300px)',
        gridTemplateRows: 'min-content 1fr',
        gridTemplateColumns: '3fr var(--comments-width)',
      }}
    >
      <ThemeStyles />
      <ApplicationProvider
        application={application}
        isSuggestionMode={isSuggestionMode}
        isSuggestionsFeatureEnabled={isSuggestionsFeatureEnabled}
      >
        <NotificationsProvider>
          {isPreviewMode && clonedEditorState && (
            <PreviewModeEditor
              clonedEditorState={clonedEditorState}
              role={application.getRole()}
              onUserModeChange={onUserModeChange}
            />
          )}
          <div style={{ display: isPreviewMode ? 'none' : 'contents' }}>
            <Editor
              clientInvoker={bridge.getClientInvoker()}
              docMap={docMap}
              docState={docState}
              documentId={editorConfig.current.documentId}
              editingLocked={editingLocked || userMode === EditorUserMode.Preview}
              editorInitializationConfig={editorConfig.current.editorInitializationConfig}
              hidden={editorHidden}
              isSuggestionsFeatureEnabled={isSuggestionsFeatureEnabled}
              lexicalError={editorError}
              logger={application.logger}
              onEditorError={onEditorError}
              onEditorLoadResult={onEditorLoadResult}
              onUserModeChange={onUserModeChange}
              role={application.getRole()}
              setEditorRef={setEditorRef}
              showTreeView={showTreeView}
              systemMode={systemMode}
              userMode={userMode}
              username={editorConfig.current.username}
            />
          </div>
          <NotificationsChildren />
        </NotificationsProvider>
      </ApplicationProvider>
      <Icons />
    </div>
  )
}
