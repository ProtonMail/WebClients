import { render, screen } from '@testing-library/react'
import { CommentViewer } from './CommentViewer'
import { DocsDependenciesProvider, type DocsDependencies } from '../../DocsDependenciesProvider'

jest.mock('./CommentsContext', () => ({
  useCommentsContext: jest.fn(() => ({
    openLink: jest.fn(),
  })),
}))

function createDependencies(reportError: DocsDependencies['reportError']): DocsDependencies {
  return {
    userName: 'Test user',
    suggestionsEnabled: true,
    isAlpha: false,
    canEdit: true,
    canComment: true,
    languageCode: 'en',
    getDisplayNameForEmail: (email) => email ?? 'Anonymous',
    comments: {
      getAllThreads: jest.fn(),
      createCommentThread: jest.fn(),
      createSuggestionThread: jest.fn(),
      createComment: jest.fn(),
      editComment: jest.fn(),
      deleteComment: jest.fn(),
      resolveThread: jest.fn(),
      unresolveThread: jest.fn(),
      deleteThread: jest.fn(),
      acceptSuggestion: jest.fn(),
      rejectSuggestion: jest.fn(),
      reopenSuggestion: jest.fn(),
      beganTypingInThread: jest.fn(),
      stoppedTypingInThread: jest.fn(),
      markThreadAsRead: jest.fn(),
      getTypersExcludingSelf: jest.fn(),
      subscribeToEvents: jest.fn(() => () => {}),
      subscribeToAwarenessStates: jest.fn(() => () => {}),
    },
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
    getDocumentUrl: jest.fn(),
    replaceDocumentUrl: jest.fn(),
    reportTelemetry: jest.fn(),
    reportError,
    openLink: jest.fn(),
    showGenericAlertModal: jest.fn(),
    createWarningNotification: jest.fn(),
    createInfoNotification: jest.fn(),
    showAlert: jest.fn(),
    reportToolbarInteraction: jest.fn(),
    reportWordCount: jest.fn(),
    subscribeToCollaboratorCursorNavigation: jest.fn(() => () => {}),
    createSuggestionThread: jest.fn(),
    getAllThreads: jest.fn(),
    reopenSuggestion: jest.fn(),
    rejectSuggestion: jest.fn(),
  }
}

describe('CommentViewer', () => {
  it('renders fallback content when lexical state is invalid JSON', () => {
    const invalidContent = '{invalid json}'

    expect(() => {
      render(
        <DocsDependenciesProvider dependencies={createDependencies(jest.fn())}>
          <CommentViewer content={invalidContent} className="test-class" />
        </DocsDependenciesProvider>,
      )
    }).not.toThrow()

    const fallback = screen.getByText(invalidContent)
    expect(fallback).toBeInTheDocument()
    expect(fallback).toHaveClass('test-class')
  })

  it('reports invalid lexical nodes through the injected reporter', () => {
    const reportError = jest.fn()
    const content = JSON.stringify({
      root: {
        type: 'root',
        version: 1,
        children: [{ type: 'unknown-node', version: 1 }],
        direction: null,
        format: '',
        indent: 0,
      },
    })

    render(
      <DocsDependenciesProvider dependencies={createDependencies(reportError)}>
        <CommentViewer content={content} className="test-class" />
      </DocsDependenciesProvider>,
    )

    expect(reportError).toHaveBeenCalledWith(expect.any(Error))
  })
})
