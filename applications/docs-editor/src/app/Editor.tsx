import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin'
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin'
import { TablePlugin } from '@lexical/react/LexicalTablePlugin'
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
import SeedInitialContentPlugin from './Plugins/Collaboration/SeedInitialContent'
import { EditorReadonlyPlugin } from './Plugins/EditorReadonlyPlugin'
import TableActionMenuPlugin from './Plugins/TableActionMenuPlugin'
import TableCellResizerPlugin from './Plugins/TableCellResizer'
import { LinkInfoPlugin } from './Plugins/Link/LinkInfoPlugin'
import { CircleLoader } from '@proton/atoms/CircleLoader'
import { ReadonlyLinkFixPlugin } from './Plugins/Link/ReadonlyLinkFixPlugin'
import { DefaultFont } from './Shared/Fonts'
import { LexicalEditor } from 'lexical'
import { EditorRefPlugin } from '@lexical/react/LexicalEditorRefPlugin'
import { sendErrorMessage } from './Utils/errorMessage'
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin'

const TypingBotEnabled = false

type Props = {
  docMap: YDocMap
  documentId: string
  username: string
  docState: DocStateInterface
  clientInvoker: EditorRequiresClientMethods
  isViewOnly: boolean
  hidden: boolean
  onEditorReady: () => void
  setEditorRef: (instance: LexicalEditor | null) => void
  injectWithNewContent?: FileToDocPendingConversion
}

export function Editor({
  clientInvoker,
  injectWithNewContent,
  docState,
  documentId,
  username,
  docMap,
  isViewOnly,
  hidden,
  onEditorReady,
  setEditorRef,
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

  return (
    <CollaborationContext.Provider
      value={{
        yjsDocMap: docMap,
        name: username,
        color: `hsl(${Math.floor(Math.random() * 360)}, 100%, 30%)`,
        clientID: 0,
        isCollabActive: false,
      }}
    >
      {hidden && (
        <div className="bg-norm absolute z-[100] flex h-full w-full flex-col items-center justify-center gap-4">
          <CircleLoader size="large" />
        </div>
      )}
      <LexicalComposer initialConfig={BuildInitialEditorConfig(null)}>
        {!isViewOnly && <Toolbar />}
        <RichTextPlugin
          contentEditable={
            <div className="relative overflow-auto [grid-column:1_/_3] [grid-row:2]">
              <ContentEditable
                className="DocumentEditor"
                style={{
                  fontFamily: DefaultFont.value,
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
        {injectWithNewContent && <SeedInitialContentPlugin docState={docState} content={injectWithNewContent} />}
        <TablePlugin hasCellBackgroundColor hasCellMerge hasTabHandler />
        <TableActionMenuPlugin />
        <TableCellResizerPlugin />
        <TabIndentationPlugin />
        <LinkPlugin />
        {!isViewOnly && <LinkInfoPlugin openLink={openLink} />}
        <TypingBotPlugin enabled={TypingBotEnabled} position={'beginning'} />
        <CollaborationPlugin
          id={documentId}
          providerFactory={yjsWebsockProvider!}
          shouldBootstrap={ShouldBootstrap}
          onCollabReady={onEditorReady}
        />
        <MergeSiblingListsPlugin />
        <CodeHighlightPlugin />
        <CommentPlugin controller={clientInvoker} username={username} />
        <ImagesPlugin />
        {!isViewOnly && <EditorReadonlyPlugin docState={docState} />}
        <ReadonlyLinkFixPlugin openLink={openLink} />
        <EditorRefPlugin editorRef={setEditorRef} />
      </LexicalComposer>
    </CollaborationContext.Provider>
  )
}
