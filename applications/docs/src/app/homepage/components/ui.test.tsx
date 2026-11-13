import '@testing-library/jest-dom'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button, IconButton } from './ui'

describe('IconButton', () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => jest.useRealTimers())

  const user = () => userEvent.setup({ advanceTimers: jest.advanceTimersByTime })

  it('Is named by its label and shows it as a tooltip after a second of hover', async () => {
    render(<IconButton label="Move" />)

    const button = screen.getByRole('button', { name: 'Move' })
    await user().hover(button)
    act(() => jest.advanceTimersByTime(900))
    expect(screen.queryByText('Move')).toBeNull()
    act(() => jest.advanceTimersByTime(100))

    expect(screen.getByText('Move')).toBeVisible()
  })

  it('Keeps an aria-label that differs from the tooltip', async () => {
    render(<IconButton label="Sort by" aria-label="Change sort order" />)

    await user().hover(screen.getByRole('button', { name: 'Change sort order' }))
    act(() => jest.advanceTimersByTime(1000))

    expect(screen.getByText('Sort by')).toBeVisible()
  })

  it('Shows its tooltip on keyboard focus and hides it when focus moves on', async () => {
    render(
      <>
        <IconButton label="Move" />
        <IconButton label="Move to trash" />
      </>,
    )

    await user().tab()
    act(() => jest.advanceTimersByTime(1000))
    expect(screen.getByText('Move')).toBeVisible()

    await user().tab()
    act(() => jest.advanceTimersByTime(1000))

    expect(screen.queryByText('Move')).toBeNull()
  })
})

describe('Button', () => {
  it('Is disabled and busy while loading', () => {
    render(<Button loading>Accept</Button>)

    const button = screen.getByRole('button', { name: /^Accept/ })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
  })
})
