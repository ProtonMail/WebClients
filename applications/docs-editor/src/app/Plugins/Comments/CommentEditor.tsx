import DocumentEditorTheme from '../../Theme/Theme'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import type { FocusEventHandler, KeyboardEventHandler } from 'react'
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import type { LexicalEditor } from 'lexical'
import {
  $nodesOfType,
  CLEAR_EDITOR_COMMAND,
  ParagraphNode,
  KEY_ENTER_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
} from 'lexical'
import { $rootTextContent } from '@lexical/text'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { EditorRefPlugin } from '@lexical/react/LexicalEditorRefPlugin'
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { ClearEditorPlugin } from '@lexical/react/LexicalClearEditorPlugin'
import clsx from '@proton/utils/clsx'
import { reportErrorToSentry } from '../../Utils/errorMessage'
import { SafeLexicalComposer } from '../../Tools/SafeLexicalComposer'

type Props = {
  initialContent: string | undefined
  onTextContentChange: (textContent: string) => void
  autoFocus?: boolean
  className?: string
  onEnter: (event: KeyboardEvent | null) => boolean
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
  ({ initialContent, className, autoFocus, onTextContentChange, onKeyDown, onEnter, onBlur, placeholder }, ref) => {
    const [editor, setEditor] = useState<LexicalEditor | null>(null)

    useEffect(() => {
      if (!editor) {
        return
      }

      return editor.registerCommand(KEY_ENTER_COMMAND, onEnter, COMMAND_PRIORITY_CRITICAL)
    }, [editor, onEnter])

    useImperativeHandle(ref, () => ({
      focus: () => {
        if (!editor) {
          throw new Error('Editor is not initialized')
        }
        editor.focus()
      },
      getStringifiedJSON: () => {
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
        if (!editor) {
          throw new Error('Editor is not initialized')
        }
        editor.dispatchCommand(CLEAR_EDITOR_COMMAND, undefined)
      },
    }))

    return (
      <SafeLexicalComposer
        initialConfig={{
          namespace: 'CommentEditor',
          nodes: [],
          onError: (e: Error) => reportErrorToSentry(e),
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
        <EditorRefPlugin editorRef={setEditor} />
        {autoFocus && <AutoFocusPlugin />}
        <HistoryPlugin />
        <ClearEditorPlugin />
      </SafeLexicalComposer>
    )
  },
)
