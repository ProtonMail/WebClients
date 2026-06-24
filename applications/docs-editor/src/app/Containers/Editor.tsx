import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin'
import { BuildInitialEditorConfig, ShouldBootstrap } from '../Lib/InitialEditorConfig'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Provider } from '@lexical/yjs'
import type {
  EditorRequiresClientMethods,
  YDocMap,
  DocStateInterface,
  EditorInitializationConfig,
  DocumentRole,
} from '@proton/docs-shared'
import { AnonymousUserDisplayName, GenerateUUID, DocProvider, getRandomAnonymousUserLetter } from '@proton/docs-shared'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin'
import { MarkdownTransformers } from '../Tools/MarkdownTransformers'
import CodeHighlightPlugin from '../Plugins/CodeHighlightPlugin'
import CommentPlugin from '../Plugins/Comments/CommentPluginContainer'
import Toolbar from '../Toolbar/Toolbar'
import { CollaborationPlugin } from '../Plugins/Collaboration/CollaborationPlugin'
import ImagesPlugin from '../Plugins/Image/ImagePlugin'
import TypingBotPlugin from '../Plugins/TypingBot/TypingBotPlugin'
import { EditorReadonlyPlugin } from '../Plugins/EditorReadonlyPlugin'
import TableCellResizerPlugin from '../Plugins/TableCellResizer'
import { LinkInfoPlugin } from '../Plugins/Link/LinkInfoPlugin'
import { ReadonlyLinkFixPlugin } from '../Plugins/Link/ReadonlyLinkFixPlugin'
import { DefaultFont } from '../Shared/Fonts'
import type { LexicalEditor } from 'lexical'
import { EditorRefPlugin } from '@lexical/react/LexicalEditorRefPlugin'
import { reportErrorToSentry } from '../Utils/errorMessage'
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin'
import { TablePlugin } from '../Plugins/Table/TablePlugin'
import { SafeLexicalComposer } from '../Tools/SafeLexicalComposer'
import { CheckListPlugin } from '../Plugins/CheckListPlugin'
import { AutoFocusPlugin } from '../Plugins/AutoFocusPlugin'
import type { EditorLoadResult } from '../Lib/EditorLoadResult'
import { KeyboardShortcutsPlugin } from '../Plugins/KeyboardShortcuts/KeyboardShortcutsPlugin'
import { PasteLimitPlugin } from '../Plugins/PasteLimitPlugin'
import { SuggestionModePlugin } from '../Plugins/Suggestions/SuggestionModePlugin'
import { CustomOrderedListPlugin } from '../Plugins/CustomList/CustomListPlugin'
import { WordCountPlugin } from '../Plugins/WordCount/WordCountPlugin'
import TreeViewPlugin from '../Plugins/TreeView/TreeViewPlugin'
import { ProtonContentEditable } from '../ContentEditable/ProtonContentEditable'
import { MarkNodesProvider } from '../Plugins/MarkNodesContext'
import clsx from '@proton/utils/clsx'
import { ProtonLinkPlugin } from '../Plugins/Link/LinkPlugin'
import { FormattingPlugin } from '../Plugins/FormattingPlugin'
import { EditorUserMode } from '../Lib/EditorUserMode'
import { EditorSystemMode } from '@proton/docs-shared/lib/EditorSystemMode'
import { BlockTypePlugin } from '../Plugins/BlockTypePlugin'
import type { LoggerInterface } from '@proton/utils/logs'
import { YjsReadonlyPlugin } from '../Plugins/YjsReadonly/YjsReadonlyPlugin'
import { useSyncedState } from '../Hooks/useSyncedState'
import { FixBrokenListItemPlugin } from '../Plugins/FixBrokenListItemPlugin'
import { CustomCollaborationContextProvider } from '../Plugins/Collaboration/CustomCollaborationContext'
import { FixBrokenTabNode } from '../Plugins/FixBrokenTabNode'
import { getAccentColorForUsername } from '@proton/atoms/UserAvatar/getAccentColorForUsername'
import { PageBreakPlugin } from '../Plugins/PageBreak/PageBreakPlugin'
import { useApplication } from './ApplicationProvider'
import { SCROLL_TO_USER_CURSOR_COMMAND } from '../Plugins/Collaboration/ScrollToUserCursorPlugin'
import { useNotifications } from '@proton/components'
import { useGenericAlertModal } from '@proton/docs-shared/components/GenericAlert'
import { TableOfContents } from '../Components/TableOfContents'
import DocsLayout from './DocsLayout'
import { useIsAlpha } from '../Hooks/useIsAlpha'

const TypingBotEnabled = false

type Props = {
  clientInvoker: EditorRequiresClientMethods
  docMap: YDocMap
  docState: DocStateInterface
  documentId: string
  editingLocked: boolean
  role: DocumentRole
  onEditorError: (error: Error) => void
  hidden: boolean
  editorInitializationConfig?: EditorInitializationConfig
  systemMode: EditorSystemMode
  userMode: EditorUserMode
  onEditorLoadResult: EditorLoadResult
  onUserModeChange: (mode: EditorUserMode) => void
  setEditorRef: (instance: LexicalEditor | null) => void
  userAddress: string
  isSuggestionsFeatureEnabled: boolean
  showTreeView: boolean
  lexicalError?: Error
  logger: LoggerInterface
}

export function Editor({
  clientInvoker,
  docMap,
  docState,
  documentId,
  editingLocked,
  editorInitializationConfig,
  role,
  hidden,
  onEditorError,
  onEditorLoadResult,
  userMode,
  systemMode,
  onUserModeChange,
  setEditorRef: passEditorRefToParent,
  userAddress,
  showTreeView,
  isSuggestionsFeatureEnabled,
  lexicalError,
  logger,
}: Props) {
  const { application } = useApplication()
  const isAlpha = useIsAlpha()
  const editorRef = useRef<LexicalEditor | null>(null)

  const [collabCursorsContainer, setCollabCursorsContainer] = useState<HTMLDivElement | null>(null)

  const { userName } = useSyncedState()

  const setEditorRef = useCallback(
    (instance: LexicalEditor | null) => {
      editorRef.current = instance
      passEditorRefToParent(instance)
    },
    [passEditorRefToParent],
  )
  const safeMode = lexicalError != null && systemMode === EditorSystemMode.Revision

  const yjsWebsockProvider = useMemo(() => {
    const baseProvider = (): Provider => {
      return new DocProvider(docState)
    }

    return baseProvider
  }, [docState])

  const openLink = useCallback(
    (url: string) => {
      void clientInvoker.openLink(url).catch(reportErrorToSentry)
    },
    [clientInvoker],
  )

  const showGenericAlertModal = useCallback(
    (message: string) => {
      clientInvoker.showGenericAlertModal(message)
    },
    [clientInvoker],
  )

  const isAnonymousUser = userName === AnonymousUserDisplayName

  const isSuggestionMode = userMode === EditorUserMode.Suggest
  const hasMutationDisplay = systemMode === EditorSystemMode.Edit && userMode !== EditorUserMode.Preview

  const letterForAnonymousUser = useMemo(() => {
    if (!isAnonymousUser) {
      return null
    }
    return getRandomAnonymousUserLetter()
  }, [isAnonymousUser])

  const anonymousUserId = useRef(GenerateUUID())

  const awarenessData = useMemo(
    () => ({
      anonymousUserLetter: letterForAnonymousUser?.letter,
      userId: isAnonymousUser ? anonymousUserId.current : userName,
    }),
    [isAnonymousUser, letterForAnonymousUser?.letter, userName],
  )

  const color = useMemo(() => {
    if (letterForAnonymousUser) {
      return letterForAnonymousUser.hsl
    }
    return getAccentColorForUsername(userName)
  }, [letterForAnonymousUser, userName])

  useEffect(() => {
    return application.syncedState.subscribeToEvent('ScrollToUserCursorData', (data) => {
      const editor = editorRef.current
      if (!editor) {
        application.logger.error('Editor not found when trying to scroll to user cursor')
        return
      }
      editor.dispatchCommand(SCROLL_TO_USER_CURSOR_COMMAND, {
        state: data.state,
      })
    })
  }, [application.logger, application.syncedState])

  const createSuggestionThread = useMemo(
    () => clientInvoker.createSuggestionThread.bind(clientInvoker),
    [clientInvoker],
  )
  const getAllThreads = useMemo(() => clientInvoker.getAllThreads.bind(clientInvoker), [clientInvoker])
  const reopenSuggestion = useMemo(() => clientInvoker.reopenSuggestion.bind(clientInvoker), [clientInvoker])
  const rejectSuggestion = useMemo(() => clientInvoker.rejectSuggestion.bind(clientInvoker), [clientInvoker])

  const { createNotification } = useNotifications()
  const createWarningNotification = useCallback(
    (message: string) => {
      createNotification({
        text: message,
        type: 'warning',
      })
    },
    [createNotification],
  )

  const [alertModal, showAlertModal] = useGenericAlertModal()
  const showAlert = useCallback(
    (title: string, message: string) => {
      showAlertModal({
        title,
        translatedMessage: message,
      })
    },
    [showAlertModal],
  )

  const getDocumentUrl = useMemo(() => clientInvoker.getDocumentUrl.bind(clientInvoker), [clientInvoker])
  const replaceDocumentUrl = useMemo(() => clientInvoker.replaceDocumentUrl.bind(clientInvoker), [clientInvoker])

  return (
    <CustomCollaborationContextProvider
      value={{
        yjsDocMap: docMap,
        name: letterForAnonymousUser ? `Anonymous ${letterForAnonymousUser.name}` : userName,
        color,
        clientID: 0,
        isCollabActive: false,
        undoManager: null,
      }}
    >
      {hidden && (
        <div
          className="bg-norm absolute z-[100] flex h-full w-full flex-col items-center justify-center gap-4"
          data-testid="editor-curtain"
        ></div>
      )}
      <SafeLexicalComposer initialConfig={BuildInitialEditorConfig({ onError: onEditorError })}>
        {(systemMode === EditorSystemMode.Edit || systemMode === EditorSystemMode.PublicView) && (
          <Toolbar
            clientInvoker={clientInvoker}
            hasEditAccess={role.canEdit()}
            isEditorHidden={hidden}
            onUserModeChange={onUserModeChange}
            systemMode={systemMode}
            userMode={userMode}
          />
        )}
        <DocsLayout.Grid>
          {isAlpha && (
            <DocsLayout.LeftPanel>
              <TableOfContents getDocumentUrl={getDocumentUrl} replaceDocumentUrl={replaceDocumentUrl} />
            </DocsLayout.LeftPanel>
          )}
          <RichTextPlugin
            contentEditable={
              <DocsLayout.RightPanel>
                <ProtonContentEditable
                  className={clsx(
                    'DocumentEditor w-full max-w-full overflow-x-hidden px-[10%] lg:w-full lg:max-w-full lg:pl-4 lg:pr-[var(--right-panel-padding)] print:w-full print:max-w-full',
                    isSuggestionMode && 'suggestion-mode',
                  )}
                  style={{
                    fontFamily: DefaultFont.value,
                    gridRow: 1,
                    gridColumn: 1,
                    justifySelf: 'center',
                  }}
                  isSuggestionMode={isSuggestionMode}
                  data-testid={systemMode === EditorSystemMode.Revision ? 'main-editor-revision' : 'main-editor'}
                />
                <div className="Lexical__cursorsContainer" ref={setCollabCursorsContainer} />
              </DocsLayout.RightPanel>
            }
            placeholder={null}
            ErrorBoundary={LexicalErrorBoundary}
          />
        </DocsLayout.Grid>

        <FixBrokenTabNode />
        <KeyboardShortcutsPlugin />
        <FormattingPlugin />
        <BlockTypePlugin />
        <MarkdownShortcutPlugin transformers={MarkdownTransformers} />
        <HorizontalRulePlugin />
        {isAlpha && <PageBreakPlugin />}
        <ListPlugin />
        <CheckListPlugin />
        <CustomOrderedListPlugin />
        <TablePlugin />
        <TableCellResizerPlugin />
        <TabIndentationPlugin />
        <ProtonLinkPlugin />
        {hasMutationDisplay && <LinkInfoPlugin openLink={openLink} />}
        <TypingBotPlugin enabled={TypingBotEnabled} position={'beginning'} />
        {systemMode !== EditorSystemMode.Revision && (
          <CollaborationPlugin
            id={documentId}
            providerFactory={yjsWebsockProvider!}
            shouldBootstrap={ShouldBootstrap}
            onLoadResult={onEditorLoadResult}
            cursorsContainer={collabCursorsContainer}
            editorInitializationConfig={editorInitializationConfig}
            additionalAwarenessData={awarenessData}
          />
        )}
        {systemMode === EditorSystemMode.Revision && (
          <YjsReadonlyPlugin
            id={documentId}
            providerFactory={yjsWebsockProvider!}
            onLoadResult={onEditorLoadResult}
            lexicalError={lexicalError}
            logger={logger}
            safeMode={safeMode}
          />
        )}
        <FixBrokenListItemPlugin />
        <CodeHighlightPlugin />
        <ImagesPlugin />
        <EditorReadonlyPlugin editingEnabled={!editingLocked} />
        {hasMutationDisplay && <PasteLimitPlugin showGenericAlertModal={showGenericAlertModal} />}
        <AutoFocusPlugin isEditorHidden={hidden} />
        <ReadonlyLinkFixPlugin openLink={openLink} />
        <EditorRefPlugin editorRef={setEditorRef} />
        <WordCountPlugin
          onWordCountChange={(wordCountInfo) =>
            systemMode !== EditorSystemMode.Revision && clientInvoker.reportWordCount(wordCountInfo)
          }
        />
        {showTreeView && <TreeViewPlugin />}
        <MarkNodesProvider>
          {systemMode !== EditorSystemMode.Revision && (
            <CommentPlugin
              key={userMode} // force rerender of comments when user mode changes
              controller={clientInvoker}
              userAddress={userAddress}
            />
          )}
          {isSuggestionsFeatureEnabled && (
            <SuggestionModePlugin
              isSuggestionMode={isSuggestionMode}
              onUserModeChange={onUserModeChange}
              createSuggestionThread={createSuggestionThread}
              getAllThreads={getAllThreads}
              reopenSuggestion={reopenSuggestion}
              rejectSuggestion={rejectSuggestion}
              createWarningNotification={createWarningNotification}
              showAlert={showAlert}
            />
          )}
          {alertModal}
        </MarkNodesProvider>
      </SafeLexicalComposer>
    </CustomCollaborationContextProvider>
  )
}
