import { render, screen } from '@testing-library/react'
import { CommentViewer } from './CommentViewer'
import { DocsDependenciesProvider } from '../../Containers/Docs/DocsDependenciesProvider'

jest.mock('./CommentsContext', () => ({
  useCommentsContext: jest.fn(() => ({
    openLink: jest.fn(),
  })),
}))

describe('CommentViewer', () => {
  it('renders fallback content when lexical state is invalid JSON', () => {
    const invalidContent = '{invalid json}'

    expect(() => {
      render(
        <DocsDependenciesProvider
          dependencies={{
            getDocumentUrl: jest.fn(),
            replaceDocumentUrl: jest.fn(),
            reportTelemetry: jest.fn(),
            openLink: jest.fn(),
            isDevOrBlack: jest.fn(),
            showGenericAlertModal: jest.fn(),
            createSuggestionThread: jest.fn(),
            getAllThreads: jest.fn(),
            reopenSuggestion: jest.fn(),
            rejectSuggestion: jest.fn(),
          }}
        >
          <CommentViewer content={invalidContent} className="test-class" />
        </DocsDependenciesProvider>,
      )
    }).not.toThrow()

    const fallback = screen.getByText(invalidContent)
    expect(fallback).toBeInTheDocument()
    expect(fallback).toHaveClass('test-class')
  })
})
