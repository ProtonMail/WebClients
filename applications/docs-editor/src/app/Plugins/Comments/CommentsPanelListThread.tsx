import { $getNodeByKey } from 'lexical'
import { useCallback, useEffect, useMemo, useState } from 'react'
import clsx from '@proton/utils/clsx'
import { CommentsPanelListComment } from './CommentsPanelListComment'
import { CommentsComposer } from './CommentsComposer'
import {
  CommentThreadState,
  CommentThreadInterface,
  LiveCommentsEvent,
  LiveCommentsTypeStatusChangeData,
} from '@proton/docs-shared'
import { Icon, ToolbarButton } from '@proton/components'
import { useInternalEventBus } from '../../InternalEventBusProvider'
import { c, msgid } from 'ttag'
import { sendErrorMessage } from '../../Utils/errorMessage'
import { useCommentsContext } from './CommentsContext'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $isCommentThreadMarkNode, CommentThreadMarkNode } from './CommentThreadMarkNode'

export function CommentsPanelListThread({ thread }: { thread: CommentThreadInterface }) {
  const [editor] = useLexicalComposerContext()
  const { controller, markNodeMap, activeIDs, setActiveIDs, threadToFocus, setThreadToFocus } = useCommentsContext()

  const eventBus = useInternalEventBus()
  const [isDeleting, setIsDeleting] = useState(false)

  const [typers, setTypers] = useState<string[]>([])

  useEffect(() => {
    controller.getTypersExcludingSelf(thread.id).then(setTypers).catch(sendErrorMessage)
    return eventBus.addEventCallback((data) => {
      const eventData = data as LiveCommentsTypeStatusChangeData
      const { threadId } = eventData
      if (threadId === thread.id) {
        controller.getTypersExcludingSelf(thread.id).then(setTypers).catch(sendErrorMessage)
      }
    }, LiveCommentsEvent.TypingStatusChange)
  }, [controller, eventBus, thread.id])

  const markID = thread.markID

  const quote = useMemo(() => {
    let quote: string | undefined
    editor.getEditorState().read(() => {
      const markNodeKeys = markNodeMap.get(markID)
      if (markNodeKeys !== undefined) {
        const markNodeKey = Array.from(markNodeKeys)[0]
        const markNode = $getNodeByKey<CommentThreadMarkNode>(markNodeKey)
        if ($isCommentThreadMarkNode(markNode)) {
          quote = markNode.getTextContent()
        }
      }
    })
    return quote
  }, [editor, markID, markNodeMap])

  const handleClickThread = () => {
    const markNodeKeys = markNodeMap.get(markID)
    if (!markNodeKeys) {
      setActiveIDs([])
      return
    }
    if (activeIDs === null || activeIDs.indexOf(markID) === -1) {
      const activeElement = document.activeElement
      // Move selection to the start of the mark, so that we
      // update the UI with the selected thread.
      editor.update(
        () => {
          const markNodeKey = Array.from(markNodeKeys)[0]
          const markNode = $getNodeByKey<CommentThreadMarkNode>(markNodeKey)
          if ($isCommentThreadMarkNode(markNode)) {
            markNode.selectStart()
          }
        },
        {
          onUpdate() {
            // Restore selection to the previous element
            if (activeElement !== null) {
              ;(activeElement as HTMLElement).focus()
            }
          },
        },
      )
    }
  }

  const isActive = activeIDs.includes(markID)
  const canSelect = markNodeMap.has(markID) && !isActive

  const isResolved = thread.state === CommentThreadState.Resolved

  const firstTyper = typers[0]
  const allTypersExceptLast = typers.slice(0, -1).join(', ')
  const lastTyper = typers[typers.length - 1]
  // translator: list of names (eg: "Tom, John and Henry")
  const usersTranslation = typers.length === 1 ? firstTyper : c('Info').t`${allTypersExceptLast} and ${lastTyper}`

  const focusThread = useCallback(
    (threadElement: HTMLLIElement | null) => {
      const shouldFocus = threadToFocus === thread.id
      if (!threadElement || !shouldFocus) {
        return
      }
      threadElement.focus()
      setThreadToFocus(null)
    },
    [setThreadToFocus, thread.id, threadToFocus],
  )

  const canShowReplyBox = !thread.isPlaceholder && !isDeleting && !isResolved

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events
    <li
      ref={focusThread}
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      data-thread-mark-id={markID}
      onClick={handleClickThread}
      className={clsx(
        'group/thread border-weak bg-norm mb-3.5 overflow-hidden rounded border last:mb-0',
        isActive
          ? 'shadow-raised'
          : 'focus-within:[box-shadow:_var(--shadow-raised-offset)_rgb(var(--shadow-color,_var(--shadow-default-color))/var(--shadow-raised-opacity))]',
        canSelect && 'hover:border-[--primary]',
        thread.isPlaceholder || isDeleting ? 'pointer-events-none opacity-50' : '',
      )}
    >
      {quote && (
        <blockquote className="color-weak mx-3 mb-1 mt-2 line-clamp-1 border-l border-[--signal-warning] px-2.5 py-px text-xs font-medium leading-none before:content-none after:content-none">
          {quote}
        </blockquote>
      )}
      <ul className="my-3 px-3.5">
        {thread.comments.map((comment, index) => (
          <CommentsPanelListComment
            key={comment.id}
            comment={comment}
            thread={thread}
            isFirstComment={index === 0}
            setIsDeletingThread={setIsDeleting}
          />
        ))}
      </ul>
      {canShowReplyBox && (
        <div className="my-3 hidden px-3.5 group-focus-within/thread:block">
          <CommentsComposer
            className="border-weak border ring-[--primary] focus-within:border-[--primary] focus-within:ring focus-within:ring-[--primary-minor-1]"
            placeholder={c('Placeholder').t`Reply...`}
            onSubmit={(content) => {
              controller.createComment(content, thread.id).catch(sendErrorMessage)
            }}
            onTextContentChange={(textContent) => {
              if (textContent.length > 0) {
                void controller.beganTypingInThread(thread.id)
              } else {
                void controller.stoppedTypingInThread(thread.id)
              }
            }}
            onBlur={() => {
              void controller.stoppedTypingInThread(thread.id)
            }}
            buttons={(canSubmit, submitComment) => {
              if (!canSubmit) {
                return null
              }
              return (
                <ToolbarButton
                  className="bg-primary rounded-full p-1"
                  title={c('Action').t`Reply`}
                  icon={<Icon name="arrow-up" size={3.5} />}
                  disabled={!canSubmit}
                  onClick={submitComment}
                />
              )
            }}
          />
        </div>
      )}
      {isResolved && (
        <div className="my-3 px-3.5">
          <button
            className="rounded border border-[--border-weak] px-2.5 py-1.5 text-sm hover:bg-[--background-weak] disabled:opacity-50"
            onClick={() => {
              controller.unresolveThread(thread.id).catch(sendErrorMessage)
            }}
          >
            {c('Action').t`Re-open thread`}
          </button>
        </div>
      )}
      {typers.length > 0 && (
        <div className="px-3.5 py-1.5 text-xs text-[--text-weak]">
          {c('Info').ngettext(
            msgid`${usersTranslation} is typing...`,
            `${usersTranslation} are typing...`,
            typers.length,
          )}
        </div>
      )}
    </li>
  )
}
