import { useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuButton,
  Icon,
  SimpleDropdown,
  useConfirmActionModal,
} from '@proton/components/components'
import clsx from '@proton/utils/clsx'

import { CommentTime } from './CommentTime'
import { CommentViewer } from './CommentEditor'
import { CommentInterface, CommentThreadInterface, CommentThreadState } from '@proton/docs-shared'
import { Button } from '@proton/atoms'
import { CommentsComposer } from './CommentsComposer'
import { EditorRequiresClientMethods } from '@proton/docs-shared'
import { c } from 'ttag'

export function CommentsPanelListComment({
  comment,
  thread,
  controller,
  isFirstComment,
  resolveMarkNode,
  unresolveMarkNode,
  removeMarkNode,
  setIsDeletingThread,
  username,
}: {
  username: string
  comment: CommentInterface
  thread: CommentThreadInterface
  controller: EditorRequiresClientMethods
  isFirstComment: boolean
  resolveMarkNode: (id: string) => void
  unresolveMarkNode: (id: string) => void
  removeMarkNode: (id: string) => void
  setIsDeletingThread: (isDeleting: boolean) => void
}): JSX.Element {
  const [confirmModal, showConfirmModal] = useConfirmActionModal()

  const [isDeleting, setIsDeleting] = useState(false)

  const [isEditing, setIsEditing] = useState(false)

  const deleteThread = async () => {
    showConfirmModal({
      title: c('Title').t`Delete thread`,
      submitText: c('Action').t`Delete`,
      message: c('Info').t`Are you sure you want to delete this thread?`,
      onSubmit: async () => {
        setIsDeleting(true)
        setIsDeletingThread(true)
        controller
          .deleteThread(thread.id)
          .then((deleted) => {
            if (deleted) {
              removeMarkNode(thread.markID)
            }
          })
          .catch(console.error)
          .finally(() => {
            setIsDeleting(false)
            setIsDeletingThread(false)
          })
      },
    })
  }

  const deleteComment = () => {
    showConfirmModal({
      title: c('Title').t`Delete comment`,
      submitText: c('Action').t`Delete`,
      message: c('Info').t`Are you sure you want to delete this comment?`,
      onSubmit: async () => {
        setIsDeleting(true)
        controller
          .deleteComment(thread.id, comment.id)
          .catch(console.error)
          .finally(() => {
            setIsDeleting(false)
          })
      },
    })
  }

  const isAuthorCurrentUser = comment.author === username

  const canShowOptions =
    isAuthorCurrentUser && !comment.isPlaceholder && !thread.isPlaceholder && !isDeleting && !isEditing

  const isThreadActive = thread.state === CommentThreadState.Active

  return (
    <>
      {confirmModal}
      <li className={clsx('group/comment mb-3 text-sm', comment.isPlaceholder || isDeleting ? 'opacity-50' : '')}>
        <div className="mb-1.5 flex flex-nowrap items-center gap-1.5">
          <div className="mr-auto flex flex-col overflow-hidden">
            <span className="mb-1 w-full overflow-hidden text-ellipsis whitespace-nowrap font-semibold">
              {comment.author || 'Author'}
            </span>
            <span className="select-none text-xs opacity-50">
              <CommentTime createTime={comment.createTime} />
              {comment.createTime.milliseconds !== comment.modifyTime.milliseconds && ' • Edited'}
            </span>
          </div>
          {canShowOptions && (
            <>
              {isFirstComment && isThreadActive && (
                <Button
                  shape="ghost"
                  size="small"
                  icon
                  onClick={() => {
                    controller.resolveThread(thread.id).catch(console.error)
                  }}
                >
                  <Icon size={4.5} name="checkmark-circle" alt="Resolve thread" />
                </Button>
              )}
              <SimpleDropdown
                as={Button}
                shape="ghost"
                size="small"
                icon
                content={<Icon size={4.5} name="three-dots-vertical" alt="More options" />}
                hasCaret={false}
              >
                <DropdownMenu>
                  {(!isFirstComment || isThreadActive) && (
                    <DropdownMenuButton
                      className="flex items-center gap-3 text-left text-sm"
                      onClick={() => {
                        setIsEditing(true)
                      }}
                    >
                      {c('Action').t`Edit comment`}
                    </DropdownMenuButton>
                  )}
                  {isFirstComment && !isThreadActive && (
                    <DropdownMenuButton
                      className="flex items-center gap-3 text-left text-sm"
                      onClick={() => {
                        controller.unresolveThread(thread.id).catch(console.error)
                      }}
                    >
                      {c('Action').t`Re-open`}
                    </DropdownMenuButton>
                  )}
                  <DropdownMenuButton
                    className="flex items-center gap-3 text-left text-sm hover:text-[color:--signal-danger]"
                    onClick={isFirstComment ? deleteThread : deleteComment}
                  >
                    {isFirstComment ? c('Action').t`Delete thread` : c('Action').t`Delete comment`}
                  </DropdownMenuButton>
                </DropdownMenu>
              </SimpleDropdown>
            </>
          )}
        </div>
        {isEditing ? (
          <CommentsComposer
            autoFocus
            initialContent={comment.content}
            placeholder={c('Placeholder').t`Edit comment...`}
            onSubmit={(content) => {
              controller.editComment(thread.id, comment.id, content).catch(console.error)
              setIsEditing(false)
              void controller.stoppedTypingInThread(thread.id)
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
            onCancel={() => setIsEditing(false)}
            controller={controller}
          />
        ) : (
          <CommentViewer key={comment.content} content={comment.content} className="leading-relaxed" />
        )}
      </li>
    </>
  )
}
