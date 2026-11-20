import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { withNotificationAction } from './withNotificationAction'

describe('withNotificationAction', () => {
  test('passes a notification without an action through unchanged', () => {
    const createNotification = vi.fn()

    withNotificationAction(createNotification)({ type: 'error', text: 'Failed to trash document' })

    expect(createNotification).toHaveBeenCalledWith({ type: 'error', text: 'Failed to trash document' })
  })

  test("renders the action as Proton's notification button after the text", async () => {
    const createNotification = vi.fn()
    const onClick = vi.fn()

    withNotificationAction(createNotification)({
      type: 'success',
      text: 'Document moved to trash',
      action: { label: 'Undo', onClick },
    })

    const { type, text } = createNotification.mock.calls[0][0]
    expect(type).toBe('success')
    render(<>{text}</>)
    expect(screen.getByText('Document moved to trash')).toBeInTheDocument()
    await userEvent.click(screen.getByTestId('notification:undo-button'))
    expect(screen.getByTestId('notification:undo-button')).toHaveTextContent('Undo')
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
