/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import type { ReactNode } from 'react'
import { useRef, useState } from 'react'
import type { CommentEditorHandle } from './CommentEditor'
import { CommentEditor } from './CommentEditor'
import clsx from '@proton/utils/clsx'
import { isMac } from '@proton/shared/lib/helpers/browser'

export function CommentsComposer({
  autoFocus,
  initialContent,
  placeholder,
  onSubmit,
  onTextContentChange,
  onBlur,
  onCancel,
  className,
  buttons,
}: {
  onSubmit: (content: string) => void
  placeholder: string
  autoFocus?: boolean
  initialContent?: string
  onTextContentChange?: (textContent: string) => void
  onBlur?: () => void
  onCancel?: () => void
  className?: string
  buttons: (canSubmit: boolean, submitComment: () => void) => ReactNode
}) {
  const [canSubmit, setCanSubmit] = useState(false)
  const [hasNewLines, setHasNewLines] = useState(false)
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
      className={clsx(
        'comment-composer relative flex flex-wrap gap-1 rounded-lg px-2 py-1 text-sm',
        hasNewLines ? 'flex-column' : 'items-center justify-between',
        className,
      )}
      onClick={(event) => {
        if (event.target === composerRef.current) {
          commentEditorRef.current?.focus()
        }
      }}
    >
      <CommentEditor
        autoFocus={autoFocus}
        className="min-w-0 flex-grow border border-[transparent] text-sm caret-[--primary]"
        onEnter={(event) => {
          if (!event) {
            return false
          }
          const hasModifier = isMac() ? event.metaKey : event.ctrlKey
          if (hasModifier && canSubmit) {
            event.preventDefault()
            submitComment()
            return true
          }
          return false
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && onCancel) {
            onCancel?.()
          }
          const { code, ctrlKey, metaKey, altKey } = event
          const hasModifier = isMac() ? metaKey : ctrlKey

          if (code === 'KeyM' && hasModifier && altKey) {
            event.preventDefault()
            onCancel?.()
          }
        }}
        onTextContentChange={(textContent) => {
          setCanSubmit(textContent.length > 0)
          onTextContentChange?.(textContent)
          setHasNewLines(textContent.search(/\n/) > 0)
        }}
        onBlur={onBlur}
        placeholder={<div className="pointer-events-none absolute left-2.5 opacity-50">{placeholder}</div>}
        ref={commentEditorRef}
        initialContent={initialContent}
      />
      <div className="ml-auto flex items-center gap-1.5">{buttons(canSubmit, submitComment)}</div>
    </div>
  )
}
