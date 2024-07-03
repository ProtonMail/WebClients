import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin'
import { BuildInitialEditorConfig, ShouldBootstrap } from './InitialEditorConfig'
import { useCallback, useMemo } from 'react'
import { Provider } from '@lexical/yjs'
import { CollaborationContext } from '@lexical/react/LexicalCollaborationContext'
import {
  FileToDocPendingConversion,
  EditorRequiresClientMethods,
  LexicalDocProvider,
  YDocMap,
  DocStateInterface,
  getAccentColorForUsername,
} from '@proton/docs-shared'
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
import { LexicalEditor } from 'lexical'
import { EditorRefPlugin } from '@lexical/react/LexicalEditorRefPlugin'
import { sendErrorMessage } from './Utils/errorMessage'
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin'
import { DocumentInteractionMode } from './DocumentInteractionMode'
import { TablePlugin } from './Plugins/Table/TablePlugin'
import DraggableBlockPlugin from './Plugins/DraggableBlockPlugin'
import { SafeLexicalComposer } from './Tools/SafeLexicalComposer'
import { CheckListPlugin } from './Plugins/CheckListPlugin'
import { AutoFocusPlugin } from './Plugins/AutoFocusPlugin'

const TypingBotEnabled = false

type Props = {
  clientInvoker: EditorRequiresClientMethods
  docMap: YDocMap
  docState: DocStateInterface
  documentId: string
  editingLocked: boolean
  hasEditAccess: boolean
  hidden: boolean
  injectWithNewContent?: FileToDocPendingConversion
  /** Non-interactive mode is used when displaying the editor to show a previous history revision */
  nonInteractiveMode: boolean
  onEditorReadyToReceiveUpdates: () => void
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
  hasEditAccess,
  hidden,
  injectWithNewContent,
  nonInteractiveMode: nonInteractiveMode,
  onEditorReadyToReceiveUpdates,
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
      <SafeLexicalComposer initialConfig={BuildInitialEditorConfig(null)}>
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
                className="DocumentEditor w-full md:max-w-[80%] lg:max-w-[50%] print:w-full print:max-w-full"
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
        <ListPlugin />
        <CheckListPlugin />
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
          onCollabReady={onEditorReadyToReceiveUpdates}
          injectWithNewContent={injectWithNewContent}
        />
        <MergeSiblingListsPlugin />
        <CodeHighlightPlugin />
        <CommentPlugin controller={clientInvoker} username={username} />
        <ImagesPlugin />
        {!nonInteractiveMode && <EditorReadonlyPlugin editingEnabled={!editingLocked} />}
        <AutoFocusPlugin isEditorHidden={hidden} />
        <ReadonlyLinkFixPlugin openLink={openLink} />
        <EditorRefPlugin editorRef={setEditorRef} />
        {!nonInteractiveMode && <DraggableBlockPlugin showGenericAlertModal={showGenericAlertModal} />}
      </SafeLexicalComposer>
    </CollaborationContext.Provider>
  )
}
