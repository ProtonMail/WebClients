import type { PropsWithChildren } from 'react'
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

function DependenciesWrapper({ children }: PropsWithChildren) {
  return (
    <DocsDependenciesProvider dependencies={{ reportError: jest.fn() } as unknown as DocsDependencies}>
      {children}
    </DocsDependenciesProvider>
  )
}

const acceptSuggestion = jest.fn(() => Promise.resolve(true))
const rejectSuggestion = jest.fn(() => Promise.resolve(true))

function renderComment({ verified = true }: { verified?: boolean } = {}) {
  jest.mocked(useCommentsContext).mockReturnValue({
    userAddress: 'me@proton.me',
    getDisplayNameForEmail: (email: string | undefined) => email ?? '',
    acceptSuggestion,
    rejectSuggestion,
    markNodeMap: new Map(),
    awarenessStates: [],
    canEdit: true,
    languageCode: 'en',
    logger: { info: jest.fn() },
    userName: 'Me',
    suggestionsEnabled: true,
  } as unknown as ReturnType<typeof useCommentsContext>)

  const time = { milliseconds: 0 }
  const comment = {
    id: 'comment-id',
    author: 'other@proton.me',
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
      isFirstComment
      isSuggestionThread
      setIsDeletingThread={jest.fn()}
    />,
    { wrapper: DependenciesWrapper },
  )
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

it('names the unverified signature warning and shows its tooltip on focus', async () => {
  renderComment({ verified: false })
  const warning = screen.getByRole('img', { name: 'Signature could not be verified' })
  expect(warning).toHaveAttribute('data-testid', 'comment-signature-unverified')

  act(() => warning.focus())

  expect(warning).toHaveFocus()
  await expectTooltipShown('Signature could not be verified')
})
