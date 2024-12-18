import React from 'react'
import type { InitialConfigType } from '@lexical/react/LexicalComposer'
import DocumentEditorTheme from '../../Theme/Theme'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { reportErrorToSentry } from '../../Utils/errorMessage'
import { SafeLexicalComposer } from '../../Tools/SafeLexicalComposer'
import { sanitizeLexicalState } from '../../Utils/SanitizeLexicalState'

interface CommentViewerProps {
  content: string
  className: string
}

export const CommentViewer: React.FC<CommentViewerProps> = ({ content, className }) => {
  const initialConfig: InitialConfigType = {
    namespace: 'CommentViewer',
    nodes: [],
    onError: (error: Error) => {
      reportErrorToSentry(error)
    },
    theme: DocumentEditorTheme,
    editorState: sanitizeLexicalState(content),
    editable: false,
  }

  return (
    <SafeLexicalComposer initialConfig={initialConfig}>
      <RichTextPlugin
        contentEditable={<ContentEditable className={className} readOnly />}
        placeholder={null}
        ErrorBoundary={LexicalErrorBoundary}
      />
    </SafeLexicalComposer>
  )
}
