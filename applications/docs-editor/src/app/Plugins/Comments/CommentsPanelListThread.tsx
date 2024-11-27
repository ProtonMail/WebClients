import type { MouseEventHandler } from 'react'
import { useEffect, useMemo, useState } from 'react'
import clsx from '@proton/utils/clsx'
import { CommentsPanelListComment } from './CommentsPanelListComment'
import { CommentsComposer } from './CommentsComposer'
import type { CommentInterface, CommentThreadInterface, LiveCommentsTypeStatusChangeData } from '@proton/docs-shared'
import { CommentThreadState, CommentThreadType, CommentType, LiveCommentsEvent } from '@proton/docs-shared'
import { Icon, ToolbarButton } from '@proton/components'
import { useApplication } from '../../ApplicationProvider'
import { c, msgid } from 'ttag'
import { reportErrorToSentry } from '../../Utils/errorMessage'
import { useCommentsContext } from './CommentsContext'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $getNodeByKey, $getSelection, $isRangeSelection } from 'lexical'

export function CommentsPanelListThread({ thread, className }: { thread: CommentThreadInterface; className?: string }) {
  const [editor] = useLexicalComposerContext()
  const { controller, getMarkNodes, activeIDs } = useCommentsContext()

  const { application } = useApplication()
  const [isDeleting, setIsDeleting] = useState(false)

  const [typers, setTypers] = useState<string[]>([])

  const markID = thread.markID
  const markNodes = useMemo(() => {
    return getMarkNodes(markID) ?? []
  }, [getMarkNodes, markID])

  const isSuggestionThread = thread.type === CommentThreadType.Suggestion

  const [element, setElement] = useState<HTMLLIElement | null>(null)
  const [isFocusWithin, setIsFocusWithin] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  useEffect(() => {
    if (!element) {
      return
    }
    const onFocus = () => {
      setIsFocusWithin(true)
    }
    const onBlur = () => {
      setIsFocusWithin(false)
    }
    const onMouseEnter = () => {
      setIsHovering(true)
    }
    const onMouseLeave = () => {
      setIsHovering(false)
    }
    element.addEventListener('focusin', onFocus)
    element.addEventListener('focusout', onBlur)
    element.addEventListener('mouseenter', onMouseEnter)
    element.addEventListener('mouseleave', onMouseLeave)
    return () => {
      element.removeEventListener('focusin', onFocus)
      element.removeEventListener('focusout', onBlur)
      element.removeEventListener('mouseenter', onMouseEnter)
      element.removeEventListener('mouseleave', onMouseLeave)
    }
  }, [element])

  useEffect(() => {
    controller.getTypersExcludingSelf(thread.id).then(setTypers).catch(reportErrorToSentry)
    return application.eventBus.addEventCallback((data) => {
      const eventData = data as LiveCommentsTypeStatusChangeData
      const { threadId } = eventData
      if (threadId === thread.id) {
        controller.getTypersExcludingSelf(thread.id).then(setTypers).catch(reportErrorToSentry)
      }
    }, LiveCommentsEvent.TypingStatusChange)
  }, [controller, application, thread.id])

  const quote = useMemo(() => {
    if (isSuggestionThread) {
      return null
    }
    return editor.getEditorState().read(() => {
      const markNode = markNodes[0]
      if (!markNode) {
        return null
      }
      return markNode.getTextContent()
    })
  }, [editor, isSuggestionThread, markNodes])

  const scrollEditorToThreadLocation = () => {
    const firstMarkNode = markNodes[0]
    if (!firstMarkNode) {
      return
    }

    const activeElement = document.activeElement
    editor.update(
      () => {
        const rootElement = editor.getRootElement()?.parentElement
        const nodeKey = firstMarkNode.getKey()
        const firstMarkNodeLatest = $getNodeByKey(nodeKey)
        if (!firstMarkNodeLatest) {
          return
        }
        const markNodeElement = editor.getElementByKey(nodeKey)
        if (markNodeElement && rootElement) {
          const markRect = markNodeElement.getBoundingClientRect()
          const rootRect = rootElement.getBoundingClientRect()
          const shouldScroll = markRect.bottom < rootRect.top || markRect.top > rootRect.bottom
          if (shouldScroll) {
            const shouldSmoothScroll = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
            markNodeElement.scrollIntoView({
              // eslint-disable-next-line custom-rules/deprecate-classes
              block: 'center',
              behavior: shouldSmoothScroll ? 'smooth' : 'instant',
            })
          }
        }
        const selection = $getSelection()
        if ($isRangeSelection(selection)) {
          const focus = selection.focus.getNode()
          if (firstMarkNodeLatest.is(focus) || firstMarkNodeLatest.isParentOf(focus)) {
            return
          }
        }
        firstMarkNodeLatest.selectStart()
      },
      {
        discrete: true,
      },
    )
    if (activeElement !== null) {
      ;(activeElement as HTMLElement).focus()
    }
  }

  const handleClickThread: MouseEventHandler = (event) => {
    controller.markThreadAsRead(thread.id).catch(reportErrorToSentry)

    const target = event.target
    if (!(target instanceof Element)) {
      return
    }
    const shouldKeepSelectionInEditorAndNotScroll = !!target.closest('button, .comment-composer')
    if (shouldKeepSelectionInEditorAndNotScroll) {
      event.preventDefault()
      event.stopPropagation()
      return
    }

    scrollEditorToThreadLocation()
  }

  const isActive = activeIDs.includes(markID) || isFocusWithin
  useEffect(() => {
    if (!isActive && !isHovering) {
      return
    }
    const changedElems: HTMLElement[] = []
    const editorState = editor.getEditorState()
    for (const node of markNodes) {
      const element = editorState.read(() => editor.getElementByKey(node.getKey()))
      if (!element) {
        continue
      }
      element.classList.add('selected')
      changedElems.push(element)
    }
    return () => {
      for (const element of changedElems) {
        element.classList.remove('selected')
      }
    }
  }, [editor, isActive, isHovering, markNodes])

  const isResolved = thread.state === CommentThreadState.Resolved

  const firstTyper = typers[0]
  const allTypersExceptLast = typers.slice(0, -1).join(', ')
  const lastTyper = typers[typers.length - 1]
  // translator: list of names (eg: "Tom, John and Henry")
  const usersTranslation = typers.length === 1 ? firstTyper : c('Info').t`${allTypersExceptLast} and ${lastTyper}`

  const isSuggestionClosed =
    thread.state === CommentThreadState.Accepted || thread.state === CommentThreadState.Rejected

  const canShowReplyBox =
    application.getRole().canComment() && !thread.isPlaceholder && !isDeleting && !isResolved && !isSuggestionClosed

  const [suggestionSummaryComment, regularComments] = useMemo((): [
    CommentInterface | undefined,
    CommentInterface[],
  ] => {
    const regularComments: CommentInterface[] = []
    let suggestionSummaryComment: CommentInterface | undefined

    for (const comment of thread.comments) {
      if (comment.type === CommentType.Suggestion) {
        suggestionSummaryComment = comment
      } else {
        regularComments.push(comment)
      }
    }

    return [suggestionSummaryComment, regularComments]
  }, [thread.comments])

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events
    <li
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      ref={setElement}
      data-thread-mark-id={markID}
      onClick={handleClickThread}
      data-active={isActive ? true : undefined}
      className={clsx(
        'group/thread border-weak bg-norm mb-3.5 list-none overflow-hidden rounded-lg border transition-transform duration-[25ms] last:mb-0 focus:outline-none',
        isActive || isHovering ? 'shadow-raised relative' : '',
        !isActive && 'hover:bg-[--optional-background-lowered]',
        thread.isPlaceholder || isDeleting ? 'pointer-events-none opacity-50' : '',
        className,
      )}
      data-testid={isActive ? 'floating-thread-list-non-section' : 'floating-thread-list-section'}
    >
      {quote && (
        <blockquote
          className="color-weak mx-3 mb-1 mt-2 line-clamp-1 border-l border-[--signal-warning] px-2.5 py-px text-xs font-medium leading-none before:content-none after:content-none"
          data-testid="comment-thread-name"
        >
          {quote}
        </blockquote>
      )}
      <ul className="my-3 px-3.5">
        {suggestionSummaryComment && (
          <CommentsPanelListComment
            comment={suggestionSummaryComment}
            thread={thread}
            isFirstComment={true}
            isSuggestionThread={isSuggestionThread}
            setIsDeletingThread={setIsDeleting}
            data-testid={'first-comment'}
          />
        )}
        {regularComments.map((comment, index) => (
          <CommentsPanelListComment
            key={comment.id}
            comment={comment}
            thread={thread}
            isFirstComment={suggestionSummaryComment ? false : index === 0}
            isSuggestionThread={isSuggestionThread}
            setIsDeletingThread={setIsDeleting}
            data-testid={index === 0 ? 'first-comment' : 'thread-comments'}
          />
        ))}
      </ul>
      {canShowReplyBox && (
        <div
          className={clsx(
            'my-3 px-3.5',
            isActive ? '' : 'hidden group-focus-within/thread:block group-has-[.options-open]/thread:block',
          )}
        >
          <CommentsComposer
            className="border-weak border ring-[--primary] focus-within:border-[--primary] focus-within:ring focus-within:ring-[--primary-minor-1]"
            placeholder={c('Placeholder').t`Reply...`}
            data-testid="reply-in-thread-input"
            onSubmit={(content) => {
              controller.createComment(content, thread.id).catch(reportErrorToSentry)
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
                  data-testid="reply-in-send-button"
                />
              )
            }}
          />
        </div>
      )}
      {isResolved && !isSuggestionThread && (
        <div className="my-3 px-3.5">
          <button
            className="rounded border border-[--border-weak] px-2.5 py-1.5 text-sm hover:bg-[--background-weak] disabled:opacity-50"
            onClick={() => {
              controller.unresolveThread(thread.id).catch(reportErrorToSentry)
            }}
            data-testid="reopen-thread-button"
          >
            {c('Action').t`Re-open thread`}
          </button>
        </div>
      )}
      {typers.length > 0 && (
        <div className="px-3.5 py-1.5 text-xs text-[--text-weak]" data-testid="info-active-typing">
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
