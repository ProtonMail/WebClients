import type {
  ClientRequiresEditorMethods,
  CommentMarkNodeChangeData,
  RtsMessagePayload,
  DocumentRoleType,
  TranslatedResult,
  SheetImportData,
} from '@proton/docs-shared'
import {
  BridgeOriginProvider,
  CommentsEvent,
  EDITOR_READY_POST_MESSAGE_EVENT,
  LiveCommentsEvent,
  SheetImportEvent,
} from '@proton/docs-shared'

import { bootstrapEditorApp } from '../Lib/Bootstrap'
import { c } from 'ttag'
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader'
import { Editor } from './Editor'
import { EditorSystemMode } from '@proton/docs-shared/lib/EditorSystemMode'
import { EditorUserMode } from '../Lib/EditorUserMode'
import { exportDataFromEditorState } from '../Conversion/Exporter/ExportDataFromEditorState'
import { loadLocales } from '@proton/account/bootstrap'
import { PreviewModeEditor } from './PreviewModeEditor'
import { rejectAllSuggestions } from '../Plugins/Suggestions/rejectAllSuggestions'
import { removeCommentThreadMarks } from '../Tools/removeCommentThreadMarks'
import { reportErrorToSentry } from '../Utils/errorMessage'
import { SHOW_ALL_COMMENTS_COMMAND } from '../Commands'
import {
  $getSelection,
  $isRangeSelection,
  $setSelection,
  type LexicalEditor,
  type SerializedEditorState,
} from 'lexical'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useSyncedState } from '../Hooks/useSyncedState'
import config from '../config'
import clsx from '@proton/utils/clsx'
import debounce from 'lodash/debounce'
import locales from '../locales'
import noop from '@proton/utils/noop'
import type { EditorState, BaseSelection, SerializedLexicalNode } from 'lexical'
import type { useBridge } from '../Lib/useBridge'
import useEffectOnce from '@proton/hooks/useEffectOnce'
import { useEditorStateValues } from '../Lib/useEditorStateValues'
import { useEditorState } from './EditorStateProvider'
import { IS_CHROME } from '../Shared/environment'
import { useStateRef } from '../Hooks/useStateRef'
import type { DocumentType } from '@proton/drive-store/store/_documents'
import { SpreadsheetProvider } from '@rowsncolumns/spreadsheet'
import type { SpreadsheetRef } from './Spreadsheet/Spreadsheet'
import { Spreadsheet } from './Spreadsheet/Spreadsheet'
import { $generateJSONFromSelectedNodes } from '@lexical/clipboard'
import { getEditorStateFromSerializedNodes } from '../Conversion/get-editor-state-from-nodes'
import { uint8ArrayToUtf8String } from '@proton/crypto/lib/utils'
import { copyTextToClipboard } from '../Utils/copy-to-clipboard'
import { ErrorBoundary, useNotifications } from '@proton/components'
import type { OpenLinkEventData } from './Spreadsheet/constants'
import { OPEN_LINK_EVENT } from './Spreadsheet/constants'

type AppProps = {
  documentType: DocumentType
  systemMode: EditorSystemMode
  bridgeState: ReturnType<typeof useBridge>
}

export function App({ documentType, systemMode, bridgeState }: AppProps) {
  const { application, bridge, docState, docMap, editorConfig, setEditorConfig, didSetInitialConfig } = bridgeState
  const { createNotification } = useNotifications()
  const { suggestionsEnabled } = useSyncedState()
  const { editorState } = useEditorState()
  const { userMode } = useEditorStateValues()
  const userModeRef = useStateRef(userMode)

  const [isPublicMode, setIsPublicMode] = useState(false)
  const [editorError, setEditorError] = useState<Error | undefined>(undefined)
  const [editorHidden, setEditorHidden] = useState(true)
  const [editingLocked, setEditingLocked] = useState(true)

  useEffect(() => {
    if (userMode === EditorUserMode.Suggest && !suggestionsEnabled) {
      editorState.userMode = EditorUserMode.Edit
    }
  }, [userMode, suggestionsEnabled, editorState])

  const [showTreeView, setShowTreeView] = useState(false)

  useEffectOnce(() => {
    ;(async () => {
      await bootstrapEditorApp({ config })
    })().catch(noop)
  })

  const editorRef = useRef<LexicalEditor | null>(null)
  const spreadsheetRef = useRef<SpreadsheetRef | null>(null)
  const latestSpreadsheetStateToLogRef = useRef<unknown>({})
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

  const updateFrameSize = useCallback(() => {
    if (!bridge || !editorRef.current) {
      return
    }
    const rootElement = editorRef.current.getRootElement()
    if (rootElement) {
      bridge.getClientInvoker().updateFrameSize(rootElement.scrollHeight)
    }
  }, [bridge])

  const setEditorRef = useCallback(
    (instance: LexicalEditor | null) => {
      editorRef.current = instance

      if (editorRef.current) {
        updateFrameSize()
      }

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
    [systemMode, updateFrameSize],
  )

  const notifyParentEditorIsReady = useCallback(() => {
    window.parent.postMessage(EDITOR_READY_POST_MESSAGE_EVENT, BridgeOriginProvider.GetClientOrigin())
  }, [])

  const scrollPositionBeforePrint = useRef<number | null>(null)
  const selectionBeforePrint = useRef<BaseSelection | null>(null)
  const applyBeforePrintFixesForChrome = useCallback(() => {
    const editor = editorRef.current
    if (!editor) {
      return
    }
    if (!IS_CHROME) {
      return
    }
    /**
     * Opening the print dialog directly on Chrome (e.g using the Cmd+P shortcut)
     * when the focus is in the editor scrolls the editor to the top, and if the
     * selection is collapsed correctly restores the scroll position after print.
     * However, if it is not collapsed it doesn't restore the scroll position.
     * So we store the current scroll position so that we can restore it ourselves.
     */
    const rootElement = editor.getRootElement()
    const scrollContainer = rootElement?.parentElement
    if (scrollContainer) {
      scrollPositionBeforePrint.current = scrollContainer.scrollTop
    }
    /*
     * Chrome has an issue when the editor is scrolled and there is
     * a selection, calling `window.print` only prints a cut-out version
     * of the document and opening print dialog directly prints a
     * shrunk down version of the document.
     * So we remove the selection before printing, and reinstate it on
     * afterprint.
     */
    if (!selectionBeforePrint.current) {
      editor.update(
        () => {
          const selection = $getSelection()
          selectionBeforePrint.current = selection ? selection.clone() : null
          $setSelection(null)
        },
        {
          discrete: true,
        },
      )
    }
  }, [])

  useEffect(() => {
    if (!docState) {
      return
    }

    const requestHandler: ClientRequiresEditorMethods = {
      async syncProperty(property, value) {
        void application.syncedState.setProperty(property, value)
      },

      async syncEvent(event) {
        void application.syncedState.emitEvent(event)
      },

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

      async initializeEditor(
        documentId: string,
        userAddress: string,
        role: DocumentRoleType,
        isPublicMode,
        appVersion,
        editorInitializationConfig,
      ) {
        docMap.set(documentId, docState.getDoc())
        application.setRole(role)
        setIsPublicMode(isPublicMode)
        application.setAppVersion(appVersion)
        application.logger.info('Initialized editor with role', role, 'config', editorInitializationConfig)

        const userCanEdit = application.getRole().canEdit()
        if (!userCanEdit) {
          editorState.userMode = EditorUserMode.Preview
        }

        if (editorInitializationConfig) {
          setEditorConfig({ documentId, userAddress, editorInitializationConfig: editorInitializationConfig })
          if (editorInitializationConfig.mode === 'conversion') {
            docState.setIsInConversionFromOtherFormat()
          }
        } else {
          setEditorConfig({ documentId, userAddress: userAddress })
        }
      },

      async broadcastPresenceState() {
        docState.broadcastPresenceState()
      },

      async exportData(format): Promise<Uint8Array<ArrayBuffer>> {
        if (editorRef.current) {
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
        } else if (spreadsheetRef.current) {
          return spreadsheetRef.current.exportData(format)
        }

        throw new Error('Could not export data for current doc/sheet')
      },

      async printAsPDF(): Promise<void> {
        applyBeforePrintFixesForChrome()
        if (IS_CHROME) {
          // Because of the chrome print bug, we need to wait for the
          // removal of the selection to actually get committed before
          // we call `window.print`. The timeout is not required when
          // the print dialog is opened directly.
          setTimeout(() => {
            window.print()
          })
        } else {
          window.print()
        }
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

      async copyCurrentSelection(format) {
        const editor = editorRef.current
        if (!editor) {
          return
        }

        try {
          const selection = editor.read(() => {
            const selection = $getSelection()
            if (!$isRangeSelection(selection) || selection.isCollapsed()) {
              return null
            }
            return selection
          })

          let editorState: SerializedEditorState<SerializedLexicalNode> | null = null
          if (selection) {
            editor.update(
              () => {
                const { nodes } = $generateJSONFromSelectedNodes(editor, selection)
                editorState = getEditorStateFromSerializedNodes(nodes)
              },
              {
                discrete: true,
              },
            )
          } else {
            editorState = editor.getEditorState().toJSON()
          }
          if (!editorState) {
            return
          }

          const result = await exportDataFromEditorState(editorState, format, {
            fetchExternalImageAsBase64: async (url) => bridge.getClientInvoker().fetchExternalImageAsBase64(url),
          })
          const resultString = uint8ArrayToUtf8String(result)
          copyTextToClipboard(resultString)
          createNotification({
            type: 'success',
            text: c('Info').t`Copied to clipboard`,
          })

          if (selection) {
            editor.update(
              () => {
                $setSelection(selection.clone())
              },
              {
                discrete: true,
              },
            )
          }
        } catch (error) {
          console.error('Could not copy as markdown', error)
        }
      },

      async getLocalSpreadsheetStateJSON() {
        return latestSpreadsheetStateToLogRef.current
      },

      async getYDocAsJSON() {
        const ydoc = docState.getDoc()
        return ydoc.toJSON()
      },

      async importDataIntoSheet(data) {
        application.eventBus.publish<SheetImportData>({
          type: SheetImportEvent,
          payload: data,
        })
      },

      async replaceLocalSpreadsheetState(state, broadcastPatches) {
        if (spreadsheetRef.current) {
          spreadsheetRef.current.replaceLocalSpreadsheetState(state, broadcastPatches)
        }
      },

      async focusSpreadsheet() {
        if (spreadsheetRef.current) {
          spreadsheetRef.current.focusSheet?.()
        }
      },

      async markImportUpdateAsSuccessful(uuid: string) {
        void docState.markImportUpdateAsSuccessful(uuid)
      },
    }

    application.logger.info('Setting request handler for bridge')
    bridge.setClientRequestHandler(requestHandler)

    notifyParentEditorIsReady()
  }, [
    bridge,
    docMap,
    application,
    docState,
    notifyParentEditorIsReady,
    setEditorConfig,
    applyBeforePrintFixesForChrome,
    userModeRef,
    editorState,
    createNotification,
  ])

  useEffect(() => {
    if (!bridge) {
      return
    }
    return application.eventBus.addEventCallback((data: OpenLinkEventData) => {
      bridge.getClientInvoker().openLink(data.link).catch(console.error)
    }, OPEN_LINK_EVENT)
  }, [application.eventBus, bridge])

  const onUserModeChange = useCallback(
    (mode: EditorUserMode) => {
      const canSwitchToSuggestionMode = suggestionsEnabled
      if (mode === EditorUserMode.Suggest && !canSwitchToSuggestionMode) {
        return
      }

      if ((mode === EditorUserMode.Edit || mode === EditorUserMode.Suggest) && !application.getRole().canEdit()) {
        return
      }

      editorState.userMode = mode
    },
    [application, editorState, suggestionsEnabled],
  )

  useEffect(() => {
    if (!bridge) {
      return
    }

    const updateFrameSizeDebounced = debounce(() => {
      updateFrameSize()
    }, 1_000)

    const removeListener = editorRef.current?.registerUpdateListener(updateFrameSizeDebounced)
    window.addEventListener('resize', updateFrameSizeDebounced)

    updateFrameSize()

    return () => {
      removeListener?.()
      window.removeEventListener('resize', updateFrameSizeDebounced)
    }
  }, [bridge, updateFrameSize])

  useEffect(() => {
    function handleBeforePrint(event: Event) {
      event.preventDefault()
      updateFrameSize()
      applyBeforePrintFixesForChrome()
    }

    function handleAfterPrint() {
      if (IS_CHROME) {
        editorRef.current?.update(() => {
          if (selectionBeforePrint.current) {
            $setSelection(selectionBeforePrint.current)
          }
          selectionBeforePrint.current = null
        })
        const rootElement = editorRef.current?.getRootElement()
        const scrollContainer = rootElement?.parentElement
        const scrollPositionBefore = scrollPositionBeforePrint.current
        if (scrollContainer && scrollPositionBefore !== null) {
          const scrollPositionAfter = scrollContainer.scrollTop
          if (scrollPositionBefore !== scrollPositionAfter) {
            scrollContainer.scrollTop = scrollPositionBefore
          }
        }
      }
    }

    window.addEventListener('beforeprint', handleBeforePrint)
    window.addEventListener('afterprint', handleAfterPrint)

    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint)
      window.removeEventListener('afterprint', handleAfterPrint)
    }
  }, [applyBeforePrintFixesForChrome, updateFrameSize])

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
      {documentType === 'doc' ? (
        <>
          {isPreviewMode && clonedEditorState && (
            <div style={{ display: 'contents' }}>
              <PreviewModeEditor
                clonedEditorState={clonedEditorState}
                role={application.getRole()}
                onUserModeChange={onUserModeChange}
                clientInvoker={bridge.getClientInvoker()}
              />
            </div>
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
              isSuggestionsFeatureEnabled={suggestionsEnabled}
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
              userAddress={editorConfig.current.userAddress}
            />
          </div>
        </>
      ) : (
        <ErrorBoundary
          onError={(error) => {
            reportErrorToSentry(error)
          }}
        >
          <SpreadsheetProvider>
            <Spreadsheet
              ref={spreadsheetRef}
              docState={docState}
              hidden={editorHidden}
              onEditorLoadResult={onEditorLoadResult}
              editorInitializationConfig={editorConfig.current.editorInitializationConfig}
              systemMode={systemMode}
              editingLocked={editingLocked || userMode === EditorUserMode.Preview}
              updateLocalStateToLog={(state) => {
                latestSpreadsheetStateToLogRef.current = state
              }}
              clientInvoker={bridge.getClientInvoker()}
              isPublicMode={isPublicMode}
            />
          </SpreadsheetProvider>
        </ErrorBoundary>
      )}
    </div>
  )
}
