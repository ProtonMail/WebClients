import type { PropsWithChildren, ReactNode } from 'react'
import { useState } from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { CommentInterface } from '@proton/docs-shared/CommentInterface'
import type { CommentThreadInterface } from '@proton/docs-shared/CommentThreadInterface'
import { CommentThreadState } from '@proton/docs-shared/CommentThreadState'
import { CommentsPanelListComment } from './CommentsPanelListComment'
import { useCommentsContext } from './CommentsContext'
import { DeleteCommentDialog, type DeleteCommentDialogOptions } from './DeleteCommentDialog'
import { DocsDependenciesProvider, type DocsDependencies } from '../../DocsDependenciesProvider'
import { defaultDocsMessages } from '../../messages/defaultDocsMessages'
import { ACCEPT_SUGGESTION_COMMAND, REJECT_SUGGESTION_COMMAND } from '../Suggestions/Commands'

const mockEditor = { dispatchCommand: jest.fn(() => true), focus: jest.fn() }

jest.mock('@lexical/react/LexicalComposerContext', () => ({
  useLexicalComposerContext: () => [mockEditor],
}))
jest.mock('./CommentsContext', () => ({ useCommentsContext: jest.fn() }))
jest.mock('./useSuggestionCommentContent', () => ({ useSuggestionCommentContent: () => null }))
jest.mock('./CommentTime', () => ({ CommentTime: () => null }))
jest.mock('../Suggestions/generateSuggestionSummary', () => ({ generateSuggestionSummary: () => [] }))
// The composer nests a Lexical editor of its own; only the buttons it asks this comment for are under test.
jest.mock('./CommentsComposer', () => ({
  CommentsComposer: ({
    buttons,
    onSubmit,
  }: {
    buttons: (canSubmit: boolean, submitComment: () => void) => ReactNode
    onSubmit: (content: string) => Promise<boolean>
  }) =>
    buttons(true, () => {
      onSubmit('edited content').catch(() => {})
    }),
}))

function DependenciesWrapper({ children }: PropsWithChildren) {
  return (
    <DocsDependenciesProvider
      dependencies={{ reportError: jest.fn(), defaultMessages: defaultDocsMessages } as unknown as DocsDependencies}
    >
      {children}
    </DocsDependenciesProvider>
  )
}

const acceptSuggestion = jest.fn(() => Promise.resolve(true))
const rejectSuggestion = jest.fn(() => Promise.resolve(true))
const editComment = jest.fn(() => Promise.resolve(true))
const deleteThread = jest.fn(() => Promise.resolve(true))
const deleteComment = jest.fn(() => Promise.resolve(true))
const removeMarkNode = jest.fn()
const showDeleteDialog = jest.fn()

type RenderOptions = {
  verified?: boolean
  author?: string
  awarenessColor?: string
  isFirstComment?: boolean
  isSuggestionThread?: boolean
}

function renderComment({
  verified = true,
  author = 'other@proton.me',
  awarenessColor,
  isFirstComment = true,
  isSuggestionThread = true,
}: RenderOptions = {}) {
  jest.mocked(useCommentsContext).mockReturnValue({
    userAddress: 'me@proton.me',
    getDisplayNameForEmail: (email: string | undefined) => email ?? '',
    acceptSuggestion,
    rejectSuggestion,
    editComment,
    deleteThread,
    deleteComment,
    removeMarkNode,
    showDeleteDialog,
    markNodeMap: new Map(),
    awarenessStates: awarenessColor ? [{ name: author, color: awarenessColor }] : [],
    canEdit: true,
    languageCode: 'en',
    logger: { info: jest.fn() },
    userName: 'Me',
    suggestionsEnabled: true,
    beganTypingInThread: jest.fn(),
    stoppedTypingInThread: jest.fn(),
  } as unknown as ReturnType<typeof useCommentsContext>)

  const time = { milliseconds: 0 }
  const comment = {
    id: 'comment-id',
    author,
    content: '',
    createTime: time,
    modifyTime: time,
    isPlaceholder: false,
    verificationResult: { verified, verificationAvailable: true },
  } as unknown as CommentInterface
  const thread = {
    id: 'thread-id',
    markID: 'mark-id',
    state: CommentThreadState.Active,
    isPlaceholder: false,
  } as unknown as CommentThreadInterface

  render(
    <CommentsPanelListComment
      comment={comment}
      thread={thread}
      isFirstComment={isFirstComment}
      isSuggestionThread={isSuggestionThread}
      setIsDeletingThread={jest.fn()}
    />,
    { wrapper: DependenciesWrapper },
  )
}

async function startEditing() {
  fireEvent.click(screen.getByRole('button', { name: 'More options' }))
  fireEvent.click(await screen.findByRole('menuitem', { name: 'Edit' }))
}

async function expectTooltipShown(text: string) {
  await waitFor(() => expect(screen.getByText(text, { selector: '[role="tooltip"] *' })).toBeVisible())
}

function DeleteDialogHost() {
  const [options, setOptions] = useState<DeleteCommentDialogOptions | null>(null)
  showDeleteDialog.mockImplementation(setOptions)
  return options && <DeleteCommentDialog {...options} onClose={() => setOptions(null)} />
}

afterEach(() => {
  jest.clearAllMocks()
  showDeleteDialog.mockReset()
})

it('accepts the suggestion from its named button and shows the tooltip on focus', async () => {
  renderComment()
  const accept = screen.getByRole('button', { name: 'Accept suggestion' })

  act(() => accept.focus())
  await expectTooltipShown('Accept suggestion')

  fireEvent.click(accept)
  expect(mockEditor.dispatchCommand).toHaveBeenCalledTimes(1)
  expect(mockEditor.dispatchCommand).toHaveBeenCalledWith(ACCEPT_SUGGESTION_COMMAND, 'mark-id')
  expect(acceptSuggestion).toHaveBeenCalledWith('thread-id', '[]')
})

it('declines the suggestion from its named button', () => {
  renderComment()

  fireEvent.click(screen.getByRole('button', { name: 'Decline suggestion' }))

  expect(mockEditor.dispatchCommand).toHaveBeenCalledTimes(1)
  expect(mockEditor.dispatchCommand).toHaveBeenCalledWith(REJECT_SUGGESTION_COMMAND, 'mark-id')
  expect(rejectSuggestion).toHaveBeenCalledWith('thread-id', '[]')
})

it('gives the author an avatar in their awareness colour, without repeating the name', () => {
  renderComment({ awarenessColor: 'hsl(300, 100%, 19%)' })

  const avatar = screen.getByText('o')
  expect(avatar).toHaveAttribute('aria-hidden', 'true')
  expect(avatar).toHaveStyle({ backgroundColor: 'hsl(300, 100%, 90%)', color: 'hsl(300, 100%, 10%)' })
  expect(screen.getAllByText('other@proton.me')).toHaveLength(1)
})

it('saves an edit from its named button', async () => {
  renderComment({ author: 'me@proton.me', isFirstComment: false })

  await startEditing()
  fireEvent.click(screen.getByRole('button', { name: 'Save' }))

  await waitFor(() => expect(editComment).toHaveBeenCalledWith('thread-id', 'comment-id', 'edited content'))
})

it('leaves editing from the named cancel button', async () => {
  renderComment({ author: 'me@proton.me', isFirstComment: false })

  await startEditing()
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

  await waitFor(() => expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument())
  expect(editComment).not.toHaveBeenCalled()
})

it('asks to confirm deleting the thread, and confirming waits for the deletion before removing its mark', async () => {
  let finishDeleting: (deleted: boolean) => void = () => {}
  deleteThread.mockImplementationOnce(() => new Promise<boolean>((resolve) => (finishDeleting = resolve)))
  renderComment({ author: 'me@proton.me', isSuggestionThread: false })

  fireEvent.click(screen.getByRole('button', { name: 'More options' }))
  fireEvent.click(await screen.findByRole('menuitem', { name: 'Delete thread' }))

  expect(showDeleteDialog).toHaveBeenCalledTimes(1)
  const [{ title, onDelete }] = showDeleteDialog.mock.calls[0]
  expect(title).toBe('Delete thread')
  expect(deleteThread).not.toHaveBeenCalled()

  let deleted = false
  let deletion = Promise.resolve()
  act(() => {
    deletion = onDelete().then(() => {
      deleted = true
    })
  })
  expect(deleteThread).toHaveBeenCalledWith('thread-id')
  await act(() => Promise.resolve())
  expect(deleted).toBe(false)

  await act(async () => {
    finishDeleting(true)
    await deletion
  })
  expect(deleted).toBe(true)
  expect(removeMarkNode).toHaveBeenCalledWith('mark-id')
})

it('asks to confirm deleting a reply, and confirming deletes only that comment', async () => {
  renderComment({ author: 'me@proton.me', isFirstComment: false })

  fireEvent.click(screen.getByRole('button', { name: 'More options' }))
  fireEvent.click(await screen.findByRole('menuitem', { name: 'Delete comment' }))

  const [{ title, onDelete }] = showDeleteDialog.mock.calls[0]
  expect(title).toBe('Delete comment')
  await act(() => onDelete())
  expect(deleteComment).toHaveBeenCalledWith('thread-id', 'comment-id')
  expect(removeMarkNode).not.toHaveBeenCalled()
})

it('returns focus to the options button when the delete dialog opened from its menu is dismissed', async () => {
  render(<DeleteDialogHost />, { wrapper: DependenciesWrapper })
  renderComment({ author: 'me@proton.me', isFirstComment: false })
  const options = screen.getByRole('button', { name: 'More options' })
  // JSDOM has no layout; Ariakit checks visibility before restoring focus.
  Object.defineProperty(options, 'offsetWidth', { value: 1 })
  act(() => options.focus())

  fireEvent.click(options)
  fireEvent.click(await screen.findByRole('menuitem', { name: 'Delete comment' }))
  const cancel = await screen.findByRole('button', { name: 'Cancel' })
  await waitFor(() => expect(cancel).toHaveFocus())
  fireEvent.keyDown(cancel, { key: 'Escape' })

  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  await waitFor(() => expect(options).toHaveFocus())
  expect(deleteComment).not.toHaveBeenCalled()
})

it('returns focus to the options button shown again after a deletion fails', async () => {
  // JSDOM has no layout; Ariakit checks visibility before restoring focus.
  jest.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(1)
  deleteComment.mockResolvedValueOnce(false)
  render(<DeleteDialogHost />, { wrapper: DependenciesWrapper })
  renderComment({ author: 'me@proton.me', isFirstComment: false })

  fireEvent.click(screen.getByRole('button', { name: 'More options' }))
  fireEvent.click(await screen.findByRole('menuitem', { name: 'Delete comment' }))
  fireEvent.click(await screen.findByRole('button', { name: 'Delete' }))

  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  expect(deleteComment).toHaveBeenCalledWith('thread-id', 'comment-id')
  await waitFor(() => expect(screen.getByRole('button', { name: 'More options' })).toHaveFocus())
  jest.restoreAllMocks()
})

it('names the unverified signature warning and shows its tooltip on focus', async () => {
  renderComment({ verified: false })
  const warning = screen.getByRole('img', { name: 'Signature could not be verified' })
  expect(warning).toHaveAttribute('data-testid', 'comment-signature-unverified')

  act(() => warning.focus())

  expect(warning).toHaveFocus()
  await expectTooltipShown('Signature could not be verified')
})
