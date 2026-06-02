import { Button } from '@proton/atoms/Button/Button'
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip'
import { UserAvatar, UserAvatarSizeEnum } from '@proton/atoms/UserAvatar/UserAvatar'
import type { MouseEventHandler } from 'react'
import { useCallback, useState } from 'react'
import { DropdownMenu, DropdownMenuButton, SimpleDropdown, ToolbarButton } from '@proton/components'
import type { CommentInterface, CommentThreadInterface } from '@proton/docs-shared'
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark'
import { IcCheckmarkCircle } from '@proton/icons/icons/IcCheckmarkCircle'
import { IcCheckmarkCircleFilled } from '@proton/icons/icons/IcCheckmarkCircleFilled'
import { IcCross } from '@proton/icons/icons/IcCross'
import { IcCrossCircleFilled } from '@proton/icons/icons/IcCrossCircleFilled'
import { IcExclamationTriangleFilled } from '@proton/icons/icons/IcExclamationTriangleFilled'
import { IcPencil } from '@proton/icons/icons/IcPencil'
import { IcThreeDotsVertical } from '@proton/icons/icons/IcThreeDotsVertical'
import { IcTrash } from '@proton/icons/icons/IcTrash'
import { IcUser } from '@proton/icons/icons/IcUser'
import { AnonymousUserEmail, CommentThreadState } from '@proton/docs-shared'
import clsx from '@proton/utils/clsx'
import { c } from 'ttag'
import { reportErrorToSentry } from '../../Utils/errorMessage'
import { CommentsComposer } from './CommentsComposer'
import { useCommentsContext } from './CommentsContext'
import { CommentTime } from './CommentTime'
import { CommentViewer } from './CommentViewer'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { ACCEPT_SUGGESTION_COMMAND, REJECT_SUGGESTION_COMMAND } from '../Suggestions/Commands'
import { useSuggestionCommentContent } from './useSuggestionCommentContent'
import { generateSuggestionSummary } from '../Suggestions/generateSuggestionSummary'

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

  const {
    userAddress,
    getDisplayNameForEmail,
    acceptSuggestion,
    rejectSuggestion,
    deleteThread,
    deleteComment,
    editComment,
    resolveThread,
    unresolveThread,
    markNodeMap,
    removeMarkNode,
    awarenessStates,
    showConfirmModal,
    canEdit,
    languageCode,
    logger,
    userName,
    suggestionsEnabled,
    beganTypingInThread,
    stoppedTypingInThread,
  } = useCommentsContext()

  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false)

  const isSuggestionComment = isFirstComment && isSuggestionThread
  const suggestionID = isSuggestionComment ? thread.markID : null
  const suggestionContent = useSuggestionCommentContent(comment, thread, suggestionID, editor)

  const handleAcceptSuggestion: MouseEventHandler = (event) => {
    if (!suggestionID) {
      return
    }
    event.preventDefault()
    event.stopPropagation()
    const summary = JSON.stringify(generateSuggestionSummary(editor, markNodeMap, suggestionID))
    const didAccept = editor.dispatchCommand(ACCEPT_SUGGESTION_COMMAND, suggestionID)
    if (!didAccept) {
      return
    }
    logger.info('Accepting suggestion thread', thread.id)
    acceptSuggestion(thread.id, summary).catch(reportErrorToSentry)
    editor.focus()
  }

  const handleRejectSuggestion: MouseEventHandler = (event) => {
    if (!suggestionID) {
      return
    }
    event.preventDefault()
    event.stopPropagation()
    const summary = JSON.stringify(generateSuggestionSummary(editor, markNodeMap, suggestionID))
    const didReject = editor.dispatchCommand(REJECT_SUGGESTION_COMMAND, suggestionID)
    if (!didReject) {
      return
    }
    logger.info('Rejecting suggestion thread', thread.id)
    rejectSuggestion(thread.id, summary).catch(reportErrorToSentry)
    editor.focus()
  }

  const handleDeleteThread = async () => {
    showConfirmModal({
      title: c('Title').t`Delete thread`,
      submitText: c('Action').t`Delete`,
      message: c('Info').t`Are you sure you want to delete this thread?`,
      onSubmit: async () => {
        setIsDeleting(true)
        setIsDeletingThread(true)
        deleteThread(thread.id)
          .then((deleted) => {
            if (deleted) {
              removeMarkNode(thread.markID)
            }
          })
          .catch(reportErrorToSentry)
          .finally(() => {
            setIsDeleting(false)
            setIsDeletingThread(false)
          })
      },
    })
  }

  const handleDeleteComment = () => {
    showConfirmModal({
      title: c('Title').t`Delete comment`,
      submitText: c('Action').t`Delete`,
      message: c('Info').t`Are you sure you want to delete this comment?`,
      onSubmit: async () => {
        setIsDeleting(true)
        deleteComment(thread.id, comment.id)
          .catch(reportErrorToSentry)
          .finally(() => {
            setIsDeleting(false)
          })
      },
    })
  }

  const isAuthorCurrentUser = comment.author === userAddress || (!comment.author && userAddress === AnonymousUserEmail)

  const isThreadActive = thread.state === CommentThreadState.Active

  const authorDisplayName = isAuthorCurrentUser ? userName : getDisplayNameForEmail(comment.author)
  const color = awarenessStates.find((state) => state.name === comment.author)?.color

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
      <li
        className={clsx(
          'group/comment mb-3 text-sm',
          comment.isPlaceholder || isDeleting ? 'opacity-50' : '',
          isOptionsMenuOpen && 'options-open',
        )}
        data-testid="thread-comments-list"
      >
        <div className="mb-1.5 flex flex-nowrap items-center gap-1.5">
          {comment.author ? (
            <UserAvatar
              size={UserAvatarSizeEnum.Small}
              name={authorDisplayName}
              color={color ? { hsl: color } : undefined}
              className="mr-1 flex-shrink-0 rounded-[--border-radius-md] text-[0.75rem]"
            />
          ) : (
            <div
              className="h-custom w-custom bg-strong mr-1 flex flex-shrink-0 items-center justify-center rounded-lg"
              style={{ '--h-custom': '1.75rem', '--w-custom': '1.75rem' }}
            >
              <IcUser />
            </div>
          )}
          <div className="mr-auto flex flex-col overflow-hidden">
            <span
              className="mb-px w-full overflow-hidden text-ellipsis whitespace-nowrap font-semibold"
              data-testid="comment-author"
            >
              {authorDisplayName}
            </span>
            <span className="select-none text-xs opacity-50" data-testid="comment-creation-time">
              <CommentTime createTime={comment.createTime} languageCode={languageCode} />
              {comment.createTime.milliseconds !== comment.modifyTime.milliseconds && ' • Edited'}
            </span>
          </div>

          {isSuggestionComment && suggestionsEnabled && thread.state === CommentThreadState.Active && (
            <>
              <Tooltip title={c('Action').t`Decline suggestion`} onClick={handleRejectSuggestion}>
                <Button
                  icon
                  pill
                  shape="ghost"
                  size="small"
                  className={clsx(
                    'pointer-events-auto flex-shrink-0 opacity-0 hover:opacity-100 focus:opacity-100 group-hover/comment:opacity-100',
                    isFirstComment && 'group-focus-within/thread:opacity-100',
                  )}
                  data-testid="suggestion-reject-button"
                >
                  <IcCross size={4.5} />
                </Button>
              </Tooltip>
              <Tooltip title={c('Action').t`Accept suggestion`} onClick={handleAcceptSuggestion}>
                <Button
                  icon
                  pill
                  shape="ghost"
                  size="small"
                  className={clsx(
                    'pointer-events-auto flex-shrink-0 opacity-0 hover:opacity-100 focus:opacity-100 group-hover/comment:opacity-100',
                    isFirstComment && 'group-focus-within/thread:opacity-100',
                  )}
                  data-testid="suggestion-accept-button"
                >
                  <IcCheckmark size={4.5} />
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
              content={<IcThreeDotsVertical size={4.5} alt={c('Label').t`More options`} />}
              hasCaret={false}
              onToggle={setIsOptionsMenuOpen}
            >
              <DropdownMenu data-testid="comment-options-menu">
                {showEditButton && (
                  <DropdownMenuButton
                    className="flex items-center gap-3 text-left text-sm"
                    onClick={() => {
                      setIsEditing(true)
                    }}
                    data-testid="edit-button"
                  >
                    <IcPencil size={4.5} />
                    {c('Action').t`Edit`}
                  </DropdownMenuButton>
                )}
                {showResolveButton && (
                  <DropdownMenuButton
                    className="flex items-center gap-3 text-left text-sm"
                    onClick={() => {
                      resolveThread(thread.id).catch(reportErrorToSentry)
                    }}
                    data-testid="resolve-button"
                  >
                    <IcCheckmarkCircle size={4.5} />
                    {c('Action').t`Resolve`}
                  </DropdownMenuButton>
                )}
                {showReOpenButton && (
                  <DropdownMenuButton
                    className="flex items-center gap-3 text-left text-sm"
                    onClick={() => {
                      unresolveThread(thread.id).catch(reportErrorToSentry)
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
                        handleDeleteThread().catch(reportErrorToSentry)
                        return
                      }

                      handleDeleteComment()
                    }}
                    data-testid="delete-button"
                  >
                    <IcTrash size={4.5} />
                    {isFirstComment ? c('Action').t`Delete thread` : c('Action').t`Delete comment`}
                  </DropdownMenuButton>
                )}
              </DropdownMenu>
            </SimpleDropdown>
          )}
          {!comment.verificationResult.verified && comment.verificationResult.verificationAvailable && (
            <Tooltip
              title={c('Action').t`Signature could not be verified`}
              className="flex-shrink-0"
              data-testid="comment-signature-unverified"
            >
              <IcExclamationTriangleFilled size={4.5} />
            </Tooltip>
          )}
        </div>
        {/* eslint-disable-next-line no-nested-ternary */}
        {isEditing ? (
          <CommentsComposer
            autoFocus
            initialContent={comment.content}
            className="border-weak border ring-[--primary] focus-within:border-[--primary] focus-within:ring focus-within:ring-[--primary-minor-1]"
            placeholder={c('Placeholder').t`Edit comment...`}
            onSubmit={async (content) => {
              const success = await editComment(thread.id, comment.id, content)
              if (success) {
                setIsEditing(false)
                void stoppedTypingInThread(thread.id)
              }
              return success
            }}
            onTextContentChange={(textContent) => {
              if (textContent.length > 0) {
                void beganTypingInThread(thread.id)
              } else {
                void stoppedTypingInThread(thread.id)
              }
            }}
            onBlur={() => {
              void stoppedTypingInThread(thread.id)
            }}
            onCancel={cancelEditing}
            buttons={(canSubmit, submitComment) => (
              <>
                <ToolbarButton
                  className="rounded-full border-none"
                  title={c('Action').t`Cancel`}
                  icon={<IcCrossCircleFilled size={6} />}
                  onClick={cancelEditing}
                  data-testid="edit-comment-cancel-button"
                />
                <ToolbarButton
                  className="rounded-full border-none"
                  title={c('Action').t`Save`}
                  icon={<IcCheckmarkCircleFilled size={6} className="fill-[--primary]" />}
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
