import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button, Checkbox, IconButton } from './ui'

describe('IconButton', () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }))
  afterEach(() => vi.useRealTimers())

  const user = () => userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

  it('Is named by its label and shows it as a tooltip after a second of hover', async () => {
    render(<IconButton label="Move" />)

    const button = screen.getByRole('button', { name: 'Move' })
    await user().hover(button)
    act(() => vi.advanceTimersByTime(900))
    expect(screen.queryByText('Move')).toBeNull()
    act(() => vi.advanceTimersByTime(100))

    expect(screen.getByText('Move')).toBeVisible()
  })

  it('Keeps an aria-label that differs from the tooltip', async () => {
    render(<IconButton label="Sort by" aria-label="Change sort order" />)

    await user().hover(screen.getByRole('button', { name: 'Change sort order' }))
    act(() => vi.advanceTimersByTime(1000))

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
    act(() => vi.advanceTimersByTime(1000))
    expect(screen.getByText('Move')).toBeVisible()

    await user().tab()
    act(() => vi.advanceTimersByTime(1000))

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

describe('Checkbox', () => {
  it('Shows "mixed" as a native indeterminate checkbox that is not checked', () => {
    render(<Checkbox checked="mixed" aria-label="Select all" />)

    const checkbox = screen.getByRole<HTMLInputElement>('checkbox', { name: 'Select all' })
    expect(checkbox.indeterminate).toBe(true)
    expect(checkbox).not.toBeChecked()
  })

  it('Calls onChange when clicked and keeps the checked state it is given', async () => {
    const onChange = vi.fn()
    render(<Checkbox checked={false} onChange={onChange} aria-label="Select Doc" data-testid="row-checkbox" />)

    await userEvent.click(screen.getByTestId('row-checkbox'))

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('checkbox', { name: 'Select Doc' })).not.toBeChecked()
  })

  it('Passes a shift-click on its label to labelOnClick', () => {
    const labelOnClick = vi.fn()
    const { container } = render(
      <Checkbox checked={false} expandClickArea labelOnClick={labelOnClick} aria-label="Select Doc" />,
    )

    fireEvent.click(container.querySelector('label')!, { shiftKey: true })

    expect(labelOnClick).toHaveBeenCalledWith(expect.objectContaining({ shiftKey: true }))
  })

  it('Disables the native checkbox', () => {
    render(<Checkbox checked disabled aria-label="Select Doc" />)

    expect(screen.getByRole('checkbox', { name: 'Select Doc' })).toBeDisabled()
  })
})
