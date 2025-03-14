import React, { useCallback } from 'react'
import type { InitialConfigType } from '@lexical/react/LexicalComposer'
import DocumentEditorTheme from '../../Theme/Theme'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { reportErrorToSentry } from '../../Utils/errorMessage'
import { SafeLexicalComposer } from '../../Tools/SafeLexicalComposer'
import { sanitizeLexicalState } from '../../Utils/SanitizeLexicalState'
import { CommentLexicalNodes } from './CommentLexicalNodes'
import { ReadonlyLinkFixPlugin } from '../Link/ReadonlyLinkFixPlugin'
import { useCommentsContext } from './CommentsContext'

interface CommentViewerProps {
  content: string
  className: string
}

export const CommentViewer: React.FC<CommentViewerProps> = ({ content, className }) => {
  const { controller } = useCommentsContext()

  const initialConfig: InitialConfigType = {
    namespace: 'CommentViewer',
    nodes: CommentLexicalNodes,
    onError: (error: Error) => {
      reportErrorToSentry(error)
    },
    theme: DocumentEditorTheme,
    editorState: sanitizeLexicalState(content),
    editable: false,
  }

  const openLink = useCallback(
    (url: string) => {
      void controller.openLink(url).catch(reportErrorToSentry)
    },
    [controller],
  )

  return (
    <SafeLexicalComposer initialConfig={initialConfig}>
      <RichTextPlugin
        contentEditable={<ContentEditable className={className} readOnly />}
        placeholder={null}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <ReadonlyLinkFixPlugin openLink={openLink} />
    </SafeLexicalComposer>
  )
}
