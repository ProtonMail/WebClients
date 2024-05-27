import { LexicalComposer } from '@lexical/react/LexicalComposer'
import DocumentEditorTheme from '../../Theme/Theme'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary'
import { FocusEventHandler, KeyboardEventHandler, forwardRef, useImperativeHandle, useRef } from 'react'
import { $nodesOfType, CLEAR_EDITOR_COMMAND, LexicalEditor, ParagraphNode } from 'lexical'
import { $rootTextContent } from '@lexical/text'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { EditorRefPlugin } from '@lexical/react/LexicalEditorRefPlugin'
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { ClearEditorPlugin } from '@lexical/react/LexicalClearEditorPlugin'
import clsx from '@proton/utils/clsx'

type Props = {
  initialContent: string | undefined
  onTextContentChange: (textContent: string) => void
  autoFocus?: boolean
  className?: string
  onKeyDown?: KeyboardEventHandler
  onBlur?: FocusEventHandler
  placeholder?: JSX.Element
}

export type CommentEditorHandle = {
  focus: () => void
  getStringifiedJSON: () => string
  clearEditor: () => void
}

// eslint-disable-next-line react/display-name
export const CommentEditor = forwardRef<CommentEditorHandle, Props>(
  ({ initialContent, className, autoFocus, onTextContentChange, onKeyDown, onBlur, placeholder }, ref) => {
    const internalRef = useRef<LexicalEditor>(null)

    useImperativeHandle(ref, () => ({
      focus: () => {
        const editor = internalRef.current
        if (!editor) {
          throw new Error('Editor is not initialized')
        }
        editor.focus()
      },
      getStringifiedJSON: () => {
        const editor = internalRef.current
        if (!editor) {
          throw new Error('Editor is not initialized')
        }
        editor.update(
          () => {
            const paragraphs = $nodesOfType(ParagraphNode)
            paragraphs.forEach((node) => {
              if (node.isEmpty()) {
                node.remove()
              }
            })
          },
          { discrete: true },
        )
        return JSON.stringify(editor.getEditorState())
      },
      clearEditor: () => {
        const editor = internalRef.current
        if (!editor) {
          throw new Error('Editor is not initialized')
        }
        editor.dispatchCommand(CLEAR_EDITOR_COMMAND, undefined)
      },
    }))

    return (
      <LexicalComposer
        initialConfig={{
          namespace: 'CommentEditor',
          nodes: [],
          onError: (error) => {
            console.error(error)
          },
          theme: DocumentEditorTheme,
          editorState: initialContent ? initialContent : undefined,
        }}
      >
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              className={clsx('focus:shadow-none focus:outline-none', className)}
              onKeyDown={onKeyDown}
              onBlur={onBlur}
            />
          }
          placeholder={(isEditable) => (isEditable && !!placeholder ? placeholder : null)}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <OnChangePlugin
          onChange={(editorState) => {
            editorState.read(() => {
              const textContent = $rootTextContent()
              onTextContentChange(textContent)
            })
          }}
        />
        <EditorRefPlugin editorRef={internalRef} />
        {autoFocus && <AutoFocusPlugin />}
        <HistoryPlugin />
        <ClearEditorPlugin />
      </LexicalComposer>
    )
  },
)

export const CommentViewer = ({ content, className }: { content: string; className: string }) => {
  return (
    <LexicalComposer
      initialConfig={{
        namespace: 'CommentViewer',
        nodes: [],
        onError: (error) => {
          console.error(error)
        },
        theme: DocumentEditorTheme,
        editorState: content,
        editable: false,
      }}
    >
      <RichTextPlugin
        contentEditable={<ContentEditable className={className} readOnly />}
        placeholder={null}
        ErrorBoundary={LexicalErrorBoundary}
      />
    </LexicalComposer>
  )
}
