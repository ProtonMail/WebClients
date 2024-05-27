import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin'
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin'
import { TablePlugin } from '@lexical/react/LexicalTablePlugin'
import { BuildInitialEditorConfig, ShouldBootstrap } from './InitialEditorConfig'
import { useEffect, useMemo } from 'react'
import { Provider } from '@lexical/yjs'
import { CollaborationContext } from '@lexical/react/LexicalCollaborationContext'
import {
  FileToDocPendingConversion,
  EditorRequiresClientMethods,
  LexicalDocProvider,
  YDocMap,
  DocStateInterface,
} from '@proton/docs-shared'
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary'
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin'
import { MarkdownTransformers } from './MarkdownTransformers'
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

const TypingBotEnabled = false

type Props = {
  docMap: YDocMap
  documentId: string
  username: string
  docState: DocStateInterface
  clientInvoker: EditorRequiresClientMethods
  injectWithNewContent?: FileToDocPendingConversion
}

export function Editor({ clientInvoker, injectWithNewContent, docState, documentId, username, docMap }: Props) {
  const yjsWebsockProvider = useMemo(() => {
    const baseProvider = (): Provider => {
      return new LexicalDocProvider(docState)
    }

    return baseProvider
  }, [docState])

  useEffect(() => {
    void clientInvoker.onEditorReady()
  }, [clientInvoker])

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
      <LexicalComposer initialConfig={BuildInitialEditorConfig(null)}>
        <Toolbar />
        <RichTextPlugin
          contentEditable={
            <div className="relative overflow-auto [grid-column:1_/_3] [grid-row:2]">
              <ContentEditable className="DocumentEditor" />
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
        <LinkPlugin />
        <LinkInfoPlugin />
        <TypingBotPlugin enabled={TypingBotEnabled} position={'beginning'} />
        <CollaborationPlugin id={documentId} providerFactory={yjsWebsockProvider!} shouldBootstrap={ShouldBootstrap} />
        <MergeSiblingListsPlugin />
        <CodeHighlightPlugin />
        <CommentPlugin controller={clientInvoker} username={username} />
        <ImagesPlugin />
        <EditorReadonlyPlugin docState={docState} />
      </LexicalComposer>
    </CollaborationContext.Provider>
  )
}
