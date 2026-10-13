import type { FormEvent } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { LinkIconButton } from './LinkIconButton'

it('gives an icon action a name and shows its tooltip on keyboard focus', async () => {
  const onClick = jest.fn()
  render(
    <LinkIconButton label="Copy link" onClick={onClick}>
      <svg aria-hidden="true" />
    </LinkIconButton>,
  )

  const button = screen.getByRole('button', { name: 'Copy link' })
  act(() => button.focus())
  expect(button).toHaveFocus()
  const tooltip = await screen.findByRole('tooltip', { hidden: true })
  expect(tooltip).toHaveTextContent('Copy link')
  expect(tooltip).toHaveAttribute('aria-hidden', 'true')
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  expect(tooltip.closest('[id^="portal/"]')?.parentElement).toBe(document.body)
  fireEvent.click(button)
  expect(onClick).toHaveBeenCalledTimes(1)
  expect(button).toHaveFocus()
})

it('keeps the icon action from submitting an enclosing form', () => {
  const onSubmit = jest.fn((event: FormEvent) => event.preventDefault())
  render(
    <form onSubmit={onSubmit}>
      <LinkIconButton label="Edit link" onClick={() => undefined}>
        <svg aria-hidden="true" />
      </LinkIconButton>
    </form>,
  )

  fireEvent.click(screen.getByRole('button', { name: 'Edit link' }))
  expect(onSubmit).not.toHaveBeenCalled()
})
