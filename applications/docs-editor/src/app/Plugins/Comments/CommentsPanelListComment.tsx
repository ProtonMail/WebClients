import { Button } from '@proton/atoms'
import { useCallback, useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuButton,
  Icon,
  SimpleDropdown,
  ToolbarButton,
  Tooltip,
  useConfirmActionModal,
} from '@proton/components'
import type { CommentInterface, CommentThreadInterface } from '@proton/docs-shared'
import { CommentThreadState, UserAvatar } from '@proton/docs-shared'
import clsx from '@proton/utils/clsx'
import { c } from 'ttag'
import { useApplication } from '../../ApplicationProvider'
import { sendErrorMessage } from '../../Utils/errorMessage'
import { CommentsComposer } from './CommentsComposer'
import { useCommentsContext } from './CommentsContext'
import { CommentTime } from './CommentTime'
import { CommentViewer } from './CommentViewer'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { ACCEPT_SUGGESTION_COMMAND, REJECT_SUGGESTION_COMMAND } from '../Suggestions/Commands'
import { useSuggestionCommentContent } from './useSuggestionCommentContent'

export function CommentsPanelListComment({
  comment,
  thread,
  isFirstComment,
  isSuggestionThread,
  setIsDeletingThread,
}: {
  comment: CommentInterface
  thread: CommentThreadInterface
  isFirstComment: boolean
  isSuggestionThread: boolean
  setIsDeletingThread: (isDeleting: boolean) => void
}): JSX.Element {
  const [editor] = useLexicalComposerContext()

  const { application, isSuggestionsFeatureEnabled } = useApplication()

  const { username, controller, removeMarkNode, awarenessStates } = useCommentsContext()

  const [confirmModal, showConfirmModal] = useConfirmActionModal()

  const [isDeleting, setIsDeleting] = useState(false)

  const [isEditing, setIsEditing] = useState(false)

  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false)

  const isSuggestionComment = isFirstComment && isSuggestionThread

  const suggestionID = isSuggestionComment ? thread.markID : null

  const suggestionContent = useSuggestionCommentContent(comment, thread, suggestionID, editor)

  const acceptSuggestion = () => {
    if (!suggestionID) {
      return
    }
    const didAccept = editor.dispatchCommand(ACCEPT_SUGGESTION_COMMAND, suggestionID)
    if (!didAccept) {
      return
    }
    controller.acceptSuggestion(thread.id).catch(sendErrorMessage)
  }

  const rejectSuggestion = () => {
    if (!suggestionID) {
      return
    }
    const didReject = editor.dispatchCommand(REJECT_SUGGESTION_COMMAND, suggestionID)
    if (!didReject) {
      return
    }
    controller.rejectSuggestion(thread.id).catch(sendErrorMessage)
  }

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
          .catch(sendErrorMessage)
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
          .catch(sendErrorMessage)
          .finally(() => {
            setIsDeleting(false)
          })
      },
    })
  }

  const isAuthorCurrentUser = comment.author === username
  const canEdit = application.getRole().canEdit()

  const name = comment.author

  const color = awarenessStates.find((state) => state.name === comment.author)?.color

  const isThreadActive = thread.state === CommentThreadState.Active

  const showEditButton = (!isFirstComment || isThreadActive) && isAuthorCurrentUser && !isSuggestionComment
  const showResolveButton = isFirstComment && isThreadActive
  const showReOpenButton = isFirstComment && !isThreadActive
  const showDeleteButton = isAuthorCurrentUser

  const canShowOptions =
    canEdit &&
    !comment.isPlaceholder &&
    !thread.isPlaceholder &&
    !isDeleting &&
    !isEditing &&
    (showEditButton || showResolveButton || showReOpenButton || showDeleteButton) &&
    !isSuggestionComment

  const cancelEditing = useCallback(() => {
    setIsEditing(false)
  }, [])

  return (
    <>
      {confirmModal}
      <li
        className={clsx(
          'group/comment mb-3 text-sm',
          comment.isPlaceholder || isDeleting ? 'opacity-50' : '',
          isOptionsMenuOpen && 'options-open',
        )}
        data-testid="thread-comments-list"
      >
        <div className="mb-1.5 flex flex-nowrap items-center gap-1.5">
          <UserAvatar name={comment.author} color={color ? { hsl: color } : undefined} className="mr-1 flex-shrink-0" />
          <div className="mr-auto flex flex-col overflow-hidden">
            <span
              className="mb-px w-full overflow-hidden text-ellipsis whitespace-nowrap font-semibold"
              data-testid="comment-author"
            >
              {name}
            </span>
            <span className="select-none text-xs opacity-50" data-testid="comment-creation-time">
              <CommentTime createTime={comment.createTime} languageCode={application.languageCode} />
              {comment.createTime.milliseconds !== comment.modifyTime.milliseconds && ' • Edited'}
            </span>
          </div>
          {isSuggestionComment && isSuggestionsFeatureEnabled && thread.state === CommentThreadState.Active && (
            <>
              <Tooltip title={c('Action').t`Decline suggestion`} onClick={rejectSuggestion}>
                <Button icon pill shape="ghost" size="small">
                  <Icon size={4.5} name="cross" />
                </Button>
              </Tooltip>
              <Tooltip title={c('Action').t`Accept suggestion`} onClick={acceptSuggestion}>
                <Button icon pill shape="ghost" size="small">
                  <Icon size={4.5} name="checkmark" />
                </Button>
              </Tooltip>
            </>
          )}
          {canShowOptions && (
            <SimpleDropdown
              as={Button}
              shape="ghost"
              size="small"
              icon
              style={{
                pointerEvents: 'auto',
              }}
              className={clsx(
                'opacity-0 hover:opacity-100 focus:opacity-100 group-hover/comment:opacity-100',
                isFirstComment && 'group-focus-within/thread:opacity-100',
              )}
              content={<Icon size={4.5} name="three-dots-vertical" alt={c('Label').t`More options`} />}
              hasCaret={false}
              onToggle={setIsOptionsMenuOpen}
            >
              <DropdownMenu>
                {showEditButton && (
                  <DropdownMenuButton
                    className="flex items-center gap-3 text-left text-sm"
                    onClick={() => {
                      setIsEditing(true)
                    }}
                    data-testid="edit-button"
                  >
                    <Icon name="pencil" size={4.5} />
                    {c('Action').t`Edit`}
                  </DropdownMenuButton>
                )}
                {showResolveButton && (
                  <DropdownMenuButton
                    className="flex items-center gap-3 text-left text-sm"
                    onClick={() => {
                      controller.resolveThread(thread.id).catch(sendErrorMessage)
                    }}
                    data-testid="resolve-button"
                  >
                    <Icon name="checkmark-circle" size={4.5} />
                    {c('Action').t`Resolve`}
                  </DropdownMenuButton>
                )}
                {showReOpenButton && (
                  <DropdownMenuButton
                    className="flex items-center gap-3 text-left text-sm"
                    onClick={() => {
                      controller.unresolveThread(thread.id).catch(sendErrorMessage)
                    }}
                    data-testid="reopen-button"
                  >
                    {c('Action').t`Re-open`}
                  </DropdownMenuButton>
                )}
                {showDeleteButton && (
                  <DropdownMenuButton
                    className="flex items-center gap-3 text-left text-sm hover:text-[color:--signal-danger]"
                    onClick={() => {
                      if (isFirstComment) {
                        deleteThread().catch(sendErrorMessage)
                        return
                      }

                      deleteComment()
                    }}
                    data-testid="delete-button"
                  >
                    <Icon name={'trash'} size={4.5} />
                    {isFirstComment ? c('Action').t`Delete thread` : c('Action').t`Delete comment`}
                  </DropdownMenuButton>
                )}
              </DropdownMenu>
            </SimpleDropdown>
          )}
        </div>
        {/* eslint-disable-next-line no-nested-ternary */}
        {isEditing ? (
          <CommentsComposer
            autoFocus
            initialContent={comment.content}
            className="border-weak border ring-[--primary] focus-within:border-[--primary] focus-within:ring focus-within:ring-[--primary-minor-1]"
            placeholder={c('Placeholder').t`Edit comment...`}
            onSubmit={(content) => {
              controller.editComment(thread.id, comment.id, content).catch(sendErrorMessage)
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
            onCancel={cancelEditing}
            buttons={(canSubmit, submitComment) => (
              <>
                <ToolbarButton
                  className="rounded-full border-none"
                  title={c('Action').t`Cancel`}
                  icon={<Icon name="cross-circle-filled" size={6} />}
                  onClick={cancelEditing}
                  data-testid="edit-comment-cancel-button"
                />
                <ToolbarButton
                  className="rounded-full border-none"
                  title={c('Action').t`Save`}
                  icon={<Icon name="checkmark-circle-filled" size={6} className="fill-[--primary]" />}
                  disabled={!canSubmit}
                  onClick={submitComment}
                  data-testid="edit-comment-save-button"
                />
              </>
            )}
          />
        ) : isSuggestionComment ? (
          <div className="space-y-0.5">{suggestionContent}</div>
        ) : (
          <CommentViewer
            key={comment.content}
            content={comment.content}
            className="leading-relaxed"
            data-testid="comment-text-content"
          />
        )}
      </li>
    </>
  )
}
