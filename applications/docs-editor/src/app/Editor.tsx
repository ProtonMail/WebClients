import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin'
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin'
import { BuildInitialEditorConfig, ShouldBootstrap } from './InitialEditorConfig'
import { useCallback, useMemo } from 'react'
import type { Provider } from '@lexical/yjs'
import { CollaborationContext } from '@lexical/react/LexicalCollaborationContext'
import type {
  EditorRequiresClientMethods,
  YDocMap,
  DocStateInterface,
  EditorInitializationConfig,
} from '@proton/docs-shared'
import { LexicalDocProvider, getAccentColorForUsername } from '@proton/docs-shared'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin'
import { MarkdownTransformers } from './Tools/MarkdownTransformers'
import CodeHighlightPlugin from './Plugins/CodeHighlightPlugin'
import CommentPlugin from './Plugins/Comments/CommentPluginContainer'
import { MergeSiblingListsPlugin } from './Plugins/MergeSiblingListsPlugin'
import Toolbar from './Toolbar/Toolbar'
import { CollaborationPlugin } from './Plugins/Collaboration/CollaborationPlugin'
import ImagesPlugin from './Plugins/Image/ImagePlugin'
import TypingBotPlugin from './Plugins/TypingBot/TypingBotPlugin'
import { EditorReadonlyPlugin } from './Plugins/EditorReadonlyPlugin'
import TableCellResizerPlugin from './Plugins/TableCellResizer'
import { LinkInfoPlugin } from './Plugins/Link/LinkInfoPlugin'
import { ReadonlyLinkFixPlugin } from './Plugins/Link/ReadonlyLinkFixPlugin'
import { DefaultFont } from './Shared/Fonts'
import type { LexicalEditor } from 'lexical'
import { EditorRefPlugin } from '@lexical/react/LexicalEditorRefPlugin'
import { sendErrorMessage } from './Utils/errorMessage'
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin'
import type { DocumentInteractionMode } from './DocumentInteractionMode'
import { TablePlugin } from './Plugins/Table/TablePlugin'
import { SafeLexicalComposer } from './Tools/SafeLexicalComposer'
import { CheckListPlugin } from './Plugins/CheckListPlugin'
import { AutoFocusPlugin } from './Plugins/AutoFocusPlugin'
import type { EditorLoadResult } from './EditorLoadResult'
import { KeyboardShortcutsPlugin } from './Plugins/KeyboardShortcuts/KeyboardShortcutsPlugin'
import { PasteLimitPlugin } from './Plugins/PasteLimitPlugin'
import { CustomOrderedListPlugin } from './Plugins/CustomList/CustomListPlugin'

const TypingBotEnabled = false

type Props = {
  clientInvoker: EditorRequiresClientMethods
  docMap: YDocMap
  docState: DocStateInterface
  documentId: string
  editingLocked: boolean
  hasEditAccess: boolean
  onEditorError: (error: Error) => void
  hidden: boolean
  editorInitializationConfig?: EditorInitializationConfig
  /** Non-interactive mode is used when displaying the editor to show a previous history revision */
  nonInteractiveMode: boolean
  onEditorLoadResult: EditorLoadResult
  onInteractionModeChange: (mode: DocumentInteractionMode) => void
  setEditorRef: (instance: LexicalEditor | null) => void
  username: string
}

export function Editor({
  clientInvoker,
  docMap,
  docState,
  documentId,
  editingLocked,
  editorInitializationConfig,
  hasEditAccess,
  hidden,
  nonInteractiveMode: nonInteractiveMode,
  onEditorError,
  onEditorLoadResult,
  onInteractionModeChange,
  setEditorRef,
  username,
}: Props) {
  const yjsWebsockProvider = useMemo(() => {
    const baseProvider = (): Provider => {
      return new LexicalDocProvider(docState)
    }

    return baseProvider
  }, [docState])

  const openLink = useCallback(
    (url: string) => {
      clientInvoker.openLink(url).catch(sendErrorMessage)
    },
    [clientInvoker],
  )

  const showGenericAlertModal = useCallback(
    (message: string) => {
      clientInvoker.showGenericAlertModal(message)
    },
    [clientInvoker],
  )

  const color = useMemo(() => {
    return getAccentColorForUsername(username)
  }, [username])

  return (
    <CollaborationContext.Provider
      value={{
        yjsDocMap: docMap,
        name: username,
        color,
        clientID: 0,
        isCollabActive: false,
      }}
    >
      {hidden && (
        <div className="bg-norm absolute z-[100] flex h-full w-full flex-col items-center justify-center gap-4"></div>
      )}
      <SafeLexicalComposer initialConfig={BuildInitialEditorConfig({ onError: onEditorError })}>
        <KeyboardShortcutsPlugin />
        {!nonInteractiveMode && (
          <Toolbar hasEditAccess={hasEditAccess} onInteractionModeChange={onInteractionModeChange} />
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
              <ContentEditable
                className="DocumentEditor w-[80%] max-w-[80%] lg:w-[816px] lg:max-w-[816px] print:w-full print:max-w-full"
                style={{
                  fontFamily: DefaultFont.value,
                  gridRow: 1,
                  gridColumn: 1,
                  // eslint-disable-next-line custom-rules/deprecate-classes
                  justifySelf: 'center',
                }}
              />
            </div>
          }
          placeholder={null}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <MarkdownShortcutPlugin transformers={MarkdownTransformers} />
        <HorizontalRulePlugin />
        <ListPlugin />
        <CheckListPlugin />
        <CustomOrderedListPlugin />
        <TablePlugin hasCellBackgroundColor hasTabHandler />
        <TableCellResizerPlugin />
        <TabIndentationPlugin />
        <LinkPlugin />
        {!nonInteractiveMode && <LinkInfoPlugin openLink={openLink} />}
        <TypingBotPlugin enabled={TypingBotEnabled} position={'beginning'} />
        <CollaborationPlugin
          id={documentId}
          providerFactory={yjsWebsockProvider!}
          shouldBootstrap={ShouldBootstrap}
          onLoadResult={onEditorLoadResult}
          editorInitializationConfig={editorInitializationConfig}
        />
        <MergeSiblingListsPlugin />
        <CodeHighlightPlugin />
        <CommentPlugin controller={clientInvoker} username={username} />
        <ImagesPlugin />
        {!nonInteractiveMode && <EditorReadonlyPlugin editingEnabled={!editingLocked} />}
        {!nonInteractiveMode && <PasteLimitPlugin showGenericAlertModal={showGenericAlertModal} />}
        <AutoFocusPlugin isEditorHidden={hidden} />
        <ReadonlyLinkFixPlugin openLink={openLink} />
        <EditorRefPlugin editorRef={setEditorRef} />
      </SafeLexicalComposer>
    </CollaborationContext.Provider>
  )
}
