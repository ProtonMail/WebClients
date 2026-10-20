import { DropdownMenu, DropdownMenuButton, SimpleDropdown } from '../../Components/Dropdown'
import * as Ariakit from '@ariakit/react'
import type { MouseEventHandler, ReactElement } from 'react'
import { useCallback, useRef, useState } from 'react'
import { Icon } from '../../Components/Icon'
import { Avatar } from '../../Components/atoms'
import { IconButton, Tooltip } from '../../Components/ui'
import * as Icons from '../../Components/icons'
import type { DocsComment, DocsCommentThread } from '../../contract/DocsCommentThread'
import { CommentThreadStates } from '../../contract/DocsCommentThread'
import { AnonymousUserEmail } from '../../Utils/AnonymousUser'
import { clsx } from 'clsx'
import { c } from 'ttag'
import { useDocsDependencies } from '../../DocsDependenciesProvider'
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
  comment: DocsComment
  thread: DocsCommentThread
  isFirstComment: boolean
  isSuggestionThread: boolean
  setIsDeletingThread: (isDeleting: boolean) => void
}): JSX.Element {
  const { reportError } = useDocsDependencies()
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
    showDeleteDialog,
    canEdit,
    languageCode,
    dateFormat,
    logger,
    userName,
    suggestionsEnabled,
    beganTypingInThread,
    stoppedTypingInThread,
  } = useCommentsContext()

  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false)
  const optionsButtonRef = useRef<HTMLButtonElement>(null)

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
    acceptSuggestion(thread.id, summary).catch(reportError)
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
    rejectSuggestion(thread.id, summary).catch(reportError)
    editor.focus()
  }

  const handleDeleteThread = () => {
    showDeleteDialog({
      title: c('Title').t`Delete thread`,
      message: c('Info').t`Are you sure you want to delete this thread?`,
      finalFocus: optionsButtonRef,
      onDelete: () => {
        setIsDeleting(true)
        setIsDeletingThread(true)
        return deleteThread(thread.id)
          .then((deleted) => {
            if (deleted) {
              removeMarkNode(thread.markID)
            }
          })
          .finally(() => {
            setIsDeleting(false)
            setIsDeletingThread(false)
          })
      },
    })
  }

  const handleDeleteComment = () => {
    showDeleteDialog({
      title: c('Title').t`Delete comment`,
      message: c('Info').t`Are you sure you want to delete this comment?`,
      finalFocus: optionsButtonRef,
      onDelete: () => {
        setIsDeleting(true)
        return deleteComment(thread.id, comment.id).finally(() => {
          setIsDeleting(false)
        })
      },
    })
  }

  const isAuthorCurrentUser = comment.author === userAddress || (!comment.author && userAddress === AnonymousUserEmail)

  const isThreadActive = thread.state === CommentThreadStates.Active

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
          {/* The author's name is shown beside the avatar, so the avatar repeats nothing to a screen reader. */}
          {comment.author ? (
            <Avatar name={authorDisplayName} color={color} className="mr-1" aria-hidden />
          ) : (
            <Avatar className="mr-1" aria-hidden>
              <Icon data={Icons.user} />
            </Avatar>
          )}
          <div className="mr-auto flex flex-col overflow-hidden">
            <span
              className="mb-px w-full overflow-hidden text-ellipsis whitespace-nowrap font-semibold"
              data-testid="comment-author"
            >
              {authorDisplayName}
            </span>
            <span className="select-none text-xs opacity-50" data-testid="comment-creation-time">
              <CommentTime createTime={comment.createTime} languageCode={languageCode} dateFormat={dateFormat} />
            </span>
          </div>

          {isSuggestionComment && suggestionsEnabled && thread.state === CommentThreadStates.Active && (
            <>
              <IconButton
                label={c('Action').t`Decline suggestion`}
                onClick={handleRejectSuggestion}
                pill
                shape="ghost"
                size="small"
                className={clsx(
                  'pointer-events-auto flex-shrink-0 opacity-0 hover:opacity-100 focus:opacity-100 group-hover/comment:opacity-100',
                  isFirstComment && 'group-focus-within/thread:opacity-100',
                )}
                data-testid="suggestion-reject-button"
              >
                <Icon data={Icons.cross} size={4.5} />
              </IconButton>
              <IconButton
                label={c('Action').t`Accept suggestion`}
                onClick={handleAcceptSuggestion}
                pill
                shape="ghost"
                size="small"
                className={clsx(
                  'pointer-events-auto flex-shrink-0 opacity-0 hover:opacity-100 focus:opacity-100 group-hover/comment:opacity-100',
                  isFirstComment && 'group-focus-within/thread:opacity-100',
                )}
                data-testid="suggestion-accept-button"
              >
                <Icon data={Icons.checkmark} size={4.5} />
              </IconButton>
            </>
          )}
          {canShowOptions && (
            <SimpleDropdown
              ref={optionsButtonRef}
              shape="ghost"
              size="small"
              icon
              style={{
                pointerEvents: 'auto',
              }}
              className={clsx(
                'opacity-0 hover:opacity-100 focus:opacity-100 group-hover/comment:opacity-100 aria-expanded:opacity-100',
                isFirstComment && 'group-focus-within/thread:opacity-100',
              )}
              content={<Icon data={Icons.threeDotsVertical} size={4.5} alt={c('Label').t`More options`} />}
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
                    <Icon data={Icons.pencil} size={4.5} />
                    {c('Action').t`Edit`}
                  </DropdownMenuButton>
                )}
                {showResolveButton && (
                  <DropdownMenuButton
                    className="flex items-center gap-3 text-left text-sm"
                    onClick={() => {
                      resolveThread(thread.id).catch(reportError)
                    }}
                    data-testid="resolve-button"
                  >
                    <Icon data={Icons.checkmarkCircle} size={4.5} />
                    {c('Action').t`Resolve`}
                  </DropdownMenuButton>
                )}
                {showReOpenButton && (
                  <DropdownMenuButton
                    className="flex items-center gap-3 text-left text-sm"
                    onClick={() => {
                      unresolveThread(thread.id).catch(reportError)
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
                        handleDeleteThread()
                        return
                      }

                      handleDeleteComment()
                    }}
                    data-testid="delete-button"
                  >
                    <Icon data={Icons.trash} size={4.5} />
                    {isFirstComment ? c('Action').t`Delete thread` : c('Action').t`Delete comment`}
                  </DropdownMenuButton>
                )}
              </DropdownMenu>
            </SimpleDropdown>
          )}
          {!comment.verificationResult.verified && comment.verificationResult.verificationAvailable && (
            <LabelTooltip label={c('Action').t`Signature could not be verified`}>
              <Icon
                data={Icons.exclamationTriangleFilled}
                size={4.5}
                className="flex-shrink-0"
                aria-hidden={false}
                data-testid="comment-signature-unverified"
              />
            </LabelTooltip>
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
                <IconButton
                  label={c('Action').t`Cancel`}
                  shape="ghost"
                  size="small"
                  pill
                  onClick={cancelEditing}
                  data-testid="edit-comment-cancel-button"
                >
                  <Icon data={Icons.crossCircleFilled} size={6} />
                </IconButton>
                <IconButton
                  label={c('Action').t`Save`}
                  shape="ghost"
                  size="small"
                  pill
                  disabled={!canSubmit}
                  onClick={submitComment}
                  data-testid="edit-comment-save-button"
                >
                  <Icon data={Icons.checkmarkCircleFilled} size={6} className="fill-[--primary]" />
                </IconButton>
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

type LabelTooltipProps = {
  label: string
  children: ReactElement
}

function LabelTooltip({ label, children }: LabelTooltipProps) {
  return (
    <Ariakit.TooltipProvider>
      <Ariakit.TooltipAnchor render={children} aria-label={label} />
      <Tooltip aria-hidden="true" portal gutter={4}>
        {label}
      </Tooltip>
    </Ariakit.TooltipProvider>
  )
}
