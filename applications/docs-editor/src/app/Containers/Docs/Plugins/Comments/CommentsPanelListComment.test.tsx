import type { PropsWithChildren, ReactNode } from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { CommentThreadState, type CommentInterface, type CommentThreadInterface } from '@proton/docs-shared'
import { CommentsPanelListComment } from './CommentsPanelListComment'
import { useCommentsContext } from './CommentsContext'
import { DocsDependenciesProvider, type DocsDependencies } from '../../DocsDependenciesProvider'
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
    <DocsDependenciesProvider dependencies={{ reportError: jest.fn() } as unknown as DocsDependencies}>
      {children}
    </DocsDependenciesProvider>
  )
}

const acceptSuggestion = jest.fn(() => Promise.resolve(true))
const rejectSuggestion = jest.fn(() => Promise.resolve(true))
const editComment = jest.fn(() => Promise.resolve(true))

type RenderOptions = {
  verified?: boolean
  author?: string
  awarenessColor?: string
  isFirstComment?: boolean
}

function renderComment({
  verified = true,
  author = 'other@proton.me',
  awarenessColor,
  isFirstComment = true,
}: RenderOptions = {}) {
  jest.mocked(useCommentsContext).mockReturnValue({
    userAddress: 'me@proton.me',
    getDisplayNameForEmail: (email: string | undefined) => email ?? '',
    acceptSuggestion,
    rejectSuggestion,
    editComment,
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
      isSuggestionThread
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

afterEach(() => {
  jest.clearAllMocks()
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

it('names the unverified signature warning and shows its tooltip on focus', async () => {
  renderComment({ verified: false })
  const warning = screen.getByRole('img', { name: 'Signature could not be verified' })
  expect(warning).toHaveAttribute('data-testid', 'comment-signature-unverified')

  act(() => warning.focus())

  expect(warning).toHaveFocus()
  await expectTooltipShown('Signature could not be verified')
})
