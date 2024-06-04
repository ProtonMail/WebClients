import type { LexicalEditor, NodeKey } from 'lexical'
import { $isMarkNode, MarkNode } from '@lexical/mark'
import { $getNodeByKey } from 'lexical'
import { useEffect, useMemo, useState } from 'react'
import clsx from '@proton/utils/clsx'
import { CommentsPanelListComment } from './CommentsPanelListComment'
import { CommentsComposer } from './CommentsComposer'
import {
  CommentThreadState,
  CommentThreadInterface,
  LiveCommentsEvent,
  LiveCommentsTypeStatusChangeData,
} from '@proton/docs-shared'
import { Icon } from '@proton/components'
import { EditorRequiresClientMethods } from '@proton/docs-shared'
import { useInternalEventBus } from '../../InternalEventBusProvider'
import { c, msgid } from 'ttag'
import { sendErrorMessage } from '../../Utils/errorMessage'

export function CommentsPanelListThread({
  editor,
  thread,
  controller,
  markNodeMap,
  activeIDs,
  resolveMarkNode,
  unresolveMarkNode,
  removeMarkNode,
  username,
}: {
  username: string
  thread: CommentThreadInterface
  controller: EditorRequiresClientMethods
  activeIDs: string[]
  editor: LexicalEditor
  markNodeMap: Map<string, Set<NodeKey>>
  resolveMarkNode: (markID: string) => void
  unresolveMarkNode: (markID: string) => void
  removeMarkNode: (markID: string) => void
}) {
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
        const markNode = $getNodeByKey<MarkNode>(markNodeKey)
        if ($isMarkNode(markNode)) {
          quote = markNode.getTextContent()
        }
      }
    })
    return quote
  }, [editor, markID, markNodeMap])

  const handleClickThread = () => {
    const markNodeKeys = markNodeMap.get(markID)
    if (markNodeKeys !== undefined && (activeIDs === null || activeIDs.indexOf(markID) === -1)) {
      const activeElement = document.activeElement
      // Move selection to the start of the mark, so that we
      // update the UI with the selected thread.
      editor.update(
        () => {
          const markNodeKey = Array.from(markNodeKeys)[0]
          const markNode = $getNodeByKey<MarkNode>(markNodeKey)
          if ($isMarkNode(markNode)) {
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

  const canSelect = markNodeMap.has(markID) && !activeIDs.includes(markID)

  const isResolved = thread.state === CommentThreadState.Resolved

  const firstTyper = typers[0]
  const allTypersExceptLast = typers.slice(0, -1).join(', ')
  const lastTyper = typers[typers.length - 1]
  // translator: list of names (eg: "Tom, John and Henry")
  const usersTranslation = typers.length === 1 ? firstTyper : c('Info').t`${allTypersExceptLast} and ${lastTyper}`

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events
    <li
      data-thread-mark-id={markID}
      onClick={handleClickThread}
      className={clsx(
        'group mb-3.5 overflow-hidden rounded border bg-[--background-norm] last:mb-0',
        isResolved ? 'border-[--primary-minor-1]' : 'border-[--border-weak]',
        canSelect && 'cursor-pointer hover:border-[--primary]',
        thread.isPlaceholder || isDeleting ? 'pointer-events-none opacity-50' : '',
      )}
    >
      {isResolved && (
        <div className="flex items-center gap-2 rounded rounded-b-none bg-[--primary-minor-1] px-2.5 py-1.5 text-sm">
          <Icon name="checkmark-circle" />
          {
            // translator: Signify the comments thread is resolved by a user
            c('Info').t`Resolved`
          }
        </div>
      )}
      {quote && (
        <blockquote className="mx-3 my-3 line-clamp-2 border-l border-[--signal-warning] px-2.5 py-0.5 text-xs font-medium before:content-none after:content-none">
          {quote}
        </blockquote>
      )}
      <ul className="my-3 px-3.5">
        {thread.comments.map((comment, index) => (
          <CommentsPanelListComment
            username={username}
            key={comment.id}
            comment={comment}
            thread={thread}
            controller={controller}
            isFirstComment={index === 0}
            resolveMarkNode={resolveMarkNode}
            unresolveMarkNode={unresolveMarkNode}
            removeMarkNode={removeMarkNode}
            setIsDeletingThread={setIsDeleting}
          />
        ))}
      </ul>
      {!thread.isPlaceholder && !isDeleting && !isResolved && (
        <div className="my-3 px-3.5">
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
