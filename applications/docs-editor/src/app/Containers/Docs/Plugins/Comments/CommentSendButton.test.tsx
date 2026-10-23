import { render, screen } from '@testing-library/react'
import { CommentSendButton } from './CommentSendButton'

it('is a small primary pill around a 12px arrow, 24px square at the composer font', () => {
  render(<CommentSendButton label="Add comment" onClick={jest.fn()} />)

  const sendButton = screen.getByRole('button', { name: 'Add comment' })
  expect(sendButton).toHaveClass('px-[calc(5em/14)]', 'py-[calc(5em/14)]', 'rounded-[2em]', 'bg-[--interaction-norm]')
  expect(sendButton.querySelector('svg')).toHaveClass('[:where(&)]:h-3', '[:where(&)]:w-3')
})
