/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import { useRef, useState } from 'react'
import { CommentEditor, CommentEditorHandle } from './CommentEditor'
import { Icon } from '@proton/components'
import { EditorRequiresClientMethods } from '@proton/docs-shared'

export function CommentsComposer({
  autoFocus,
  initialContent,
  controller,
  placeholder,
  onSubmit,
  onTextContentChange,
  onBlur,
  onCancel,
  hideCancelButton = !onCancel,
}: {
  controller: EditorRequiresClientMethods
  onSubmit: (content: string) => void
  placeholder: string
  autoFocus?: boolean
  initialContent?: string
  onTextContentChange?: (textContent: string) => void
  onBlur?: () => void
  onCancel?: () => void
  hideCancelButton?: boolean
}) {
  const [canSubmit, setCanSubmit] = useState(false)
  const composerRef = useRef<HTMLDivElement>(null)
  const commentEditorRef = useRef<CommentEditorHandle>(null)

  const submitComment = () => {
    if (canSubmit) {
      const editorHandle = commentEditorRef.current
      if (!editorHandle) {
        return
      }
      const content = editorHandle.getStringifiedJSON()
      if (!content) {
        return
      }
      onSubmit(content)
      editorHandle.clearEditor()
    }
  }

  return (
    <div
      ref={composerRef}
      className="relative flex flex-wrap items-center justify-between gap-1 rounded border border-[--border-weak] px-1.5 py-1 text-sm ring-[--primary] focus-within:border-[--primary] focus-within:ring focus-within:ring-[--primary-minor-1]"
      onClick={(event) => {
        if (event.target === composerRef.current) {
          commentEditorRef.current?.focus()
        }
      }}
    >
      <CommentEditor
        autoFocus={autoFocus}
        className="min-w-0 flex-grow border border-[transparent] px-0.5 py-1 text-sm caret-[--primary]"
        onKeyDown={(event) => {
          if (event.ctrlKey && event.key === 'Enter' && canSubmit) {
            event.preventDefault()
            submitComment()
          }
          if (event.key === 'Escape' && onCancel) {
            onCancel?.()
          }
        }}
        onTextContentChange={(textContent) => {
          setCanSubmit(textContent.length > 0)
          onTextContentChange?.(textContent)
        }}
        onBlur={onBlur}
        placeholder={<div className="pointer-events-none absolute left-2.5 top-2 opacity-50">{placeholder}</div>}
        ref={commentEditorRef}
        initialContent={initialContent}
      />
      <div className="ml-auto mr-0.5 flex items-center gap-1.5">
        <button
          className="flex items-center justify-center rounded border border-[transparent] bg-[--primary] p-1.5 text-sm text-[--primary-contrast] enabled:hover:brightness-125 disabled:bg-[--background-strong] disabled:text-[--text-norm] disabled:opacity-50"
          onClick={submitComment}
          disabled={!canSubmit}
          aria-label="Send"
          title="Send"
        >
          <Icon name="arrow-up" className="h-4 w-4 fill-current" />
        </button>
        {onCancel && !hideCancelButton && (
          <button
            className="flex items-center justify-center rounded border border-[--border-weak] bg-[--background-norm] p-1.5 text-sm text-[--text-weak] hover:bg-[--background-strong]"
            onClick={onCancel}
            aria-label="Cancel"
            title="Cancel"
          >
            <Icon name="cross" className="h-4 w-4 fill-current" />
          </button>
        )}
      </div>
    </div>
  )
}
