import { render, screen } from '@testing-library/react'
import { CommentViewer } from './CommentViewer'

jest.mock('./CommentsContext', () => ({
  useCommentsContext: jest.fn(() => ({
    openLink: jest.fn(),
  })),
}))

describe('CommentViewer', () => {
  it('renders fallback content when lexical state is invalid JSON', () => {
    const invalidContent = '{invalid json}'

    expect(() => {
      render(<CommentViewer content={invalidContent} className="test-class" />)
    }).not.toThrow()

    const fallback = screen.getByText(invalidContent)
    expect(fallback).toBeInTheDocument()
    expect(fallback).toHaveClass('test-class')
  })
})
