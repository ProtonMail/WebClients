import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin'
import { BuildInitialEditorConfig, ShouldBootstrap } from '../Lib/InitialEditorConfig'
import { useCallback, useMemo, useRef, useState } from 'react'
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
import { getAccentColorForUsername } from '@proton/atoms'
import { CustomCollaborationContextProvider } from '../Plugins/Collaboration/CustomCollaborationContext'

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
        <KeyboardShortcutsPlugin />
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
        <RichTextPlugin
          contentEditable={
            <div
              className="relative overflow-auto"
              style={{
                gridColumn: '1 / 3',
                gridRow: '2',

                display: 'grid',
                gridTemplateRows: '1fr',
              }}
            >
              <ProtonContentEditable
                className={clsx(
                  'DocumentEditor w-full max-w-full overflow-x-hidden px-[10%] lg:w-full lg:max-w-full lg:px-[calc((100%-816px)/2)] print:w-full print:max-w-full',
                  isSuggestionMode && 'suggestion-mode',
                )}
                style={{
                  fontFamily: DefaultFont.value,
                  gridRow: 1,
                  gridColumn: 1,
                  // eslint-disable-next-line custom-rules/deprecate-classes
                  justifySelf: 'center',
                }}
                isSuggestionMode={isSuggestionMode}
                data-testid={systemMode === EditorSystemMode.Revision ? 'main-editor-revision' : 'main-editor'}
              />
              <div className="Lexical__cursorsContainer" ref={setCollabCursorsContainer} />
            </div>
          }
          placeholder={null}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <FormattingPlugin />
        <BlockTypePlugin />
        <MarkdownShortcutPlugin transformers={MarkdownTransformers} />
        <HorizontalRulePlugin />
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
            <CommentPlugin controller={clientInvoker} userAddress={userAddress} />
          )}
          {isSuggestionsFeatureEnabled && (
            <SuggestionModePlugin
              isSuggestionMode={isSuggestionMode}
              controller={clientInvoker}
              onUserModeChange={onUserModeChange}
            />
          )}
        </MarkNodesProvider>
      </SafeLexicalComposer>
    </CustomCollaborationContextProvider>
  )
}
