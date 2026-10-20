import type { FormEvent } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { Button, IconButton } from './ui'

it('renders a native button that does not submit an enclosing form', () => {
  const onClick = jest.fn()
  const onSubmit = jest.fn((event: FormEvent) => event.preventDefault())
  render(
    <form onSubmit={onSubmit}>
      <Button onClick={onClick}>Clear</Button>
    </form>,
  )

  const button = screen.getByRole('button', { name: 'Clear' })
  expect(button.tagName).toBe('BUTTON')
  fireEvent.click(button)
  expect(onClick).toHaveBeenCalledTimes(1)
  expect(onSubmit).not.toHaveBeenCalled()
})

it('keeps native disabled semantics, or aria-disabled when it must stay focusable', () => {
  const onClick = jest.fn()
  render(
    <>
      <Button disabled onClick={onClick}>
        Editing
      </Button>
      <Button disabled accessibleWhenDisabled onClick={onClick}>
        Viewing
      </Button>
    </>,
  )

  const disabled = screen.getByRole('button', { name: 'Editing' })
  expect(disabled).toBeDisabled()
  fireEvent.click(disabled)

  const focusable = screen.getByRole('button', { name: 'Viewing' })
  expect(focusable).toHaveAttribute('aria-disabled', 'true')
  act(() => focusable.focus())
  expect(focusable).toHaveFocus()
  fireEvent.click(focusable)
  expect(onClick).not.toHaveBeenCalled()
})

it('styles the solid and ghost variants with theme variables only', () => {
  render(
    <>
      <Button>Solid</Button>
      <Button shape="ghost">Ghost</Button>
      <Button shape="ghost" color="norm">
        Heading
      </Button>
    </>,
  )

  const solid = screen.getByRole('button', { name: 'Solid' })
  expect(solid).toHaveClass(
    'bg-[--interaction-weak]',
    'text-[--text-norm]',
    'focus-visible:shadow-[0_0_0_0.1875rem_var(--focus-ring)]',
  )
  expect(screen.getByRole('button', { name: 'Ghost' })).toHaveClass('bg-[--interaction-default]', 'text-[--text-norm]')
  expect(screen.getByRole('button', { name: 'Heading' })).toHaveClass(
    'bg-[--interaction-default]',
    'text-[--interaction-norm-major-1]',
    'hover:text-[--interaction-norm-major-2]',
  )
  for (const button of screen.getAllByRole('button')) {
    expect(button.className).not.toMatch(/(^|\s)button(-|\s|$)/)
    // Proton's stylesheet defines these too, with a different focus outline and border colour.
    expect(button).not.toHaveClass('outline-none', 'border', 'border-transparent')
  }
})

it('fills a solid norm button with the primary colour', () => {
  render(
    <Button shape="solid" color="norm">
      Send
    </Button>,
  )

  expect(screen.getByRole('button', { name: 'Send' })).toHaveClass(
    'bg-[--interaction-norm]',
    'text-[--interaction-norm-contrast]',
    'hover:bg-[--interaction-norm-major-1]',
  )
})

it('uses square padding for icon buttons and a pill radius when asked', () => {
  render(
    <>
      <Button size="small">Clear</Button>
      <Button size="small" icon pill aria-label="Accept suggestion" />
    </>,
  )

  expect(screen.getByRole('button', { name: 'Clear' })).toHaveClass(
    'px-[calc(11em/14)]',
    'py-[calc(3em/14)]',
    'rounded-[--border-radius-md]',
  )
  expect(screen.getByRole('button', { name: 'Accept suggestion' })).toHaveClass(
    'px-[calc(5em/14)]',
    'py-[calc(5em/14)]',
    'rounded-[2em]',
  )
})

it('drops a default the caller overrides, so the caller class always wins', () => {
  render(
    <>
      <Button className="px-2 text-[--text-norm]" shape="ghost" color="norm">
        Font
      </Button>
      <Button className="rounded py-2">Mode</Button>
    </>,
  )

  const font = screen.getByRole('button', { name: 'Font' })
  expect(font).toHaveClass('px-2', 'py-[calc(7em/14)]', 'text-[--text-norm]', 'hover:text-[--interaction-norm-major-2]')
  expect(font).not.toHaveClass('px-[calc(15em/14)]', 'text-[--interaction-norm-major-1]')

  const mode = screen.getByRole('button', { name: 'Mode' })
  expect(mode).toHaveClass('rounded', 'py-2', 'px-[calc(15em/14)]')
  expect(mode).not.toHaveClass('rounded-[--border-radius-md]', 'py-[calc(7em/14)]')
})

it('drops the shape background and its states when the caller sets a background', () => {
  render(
    <Button className="bg-[--background-norm] hover:bg-[--interaction-weak-minor-2]" shape="ghost">
      Options
    </Button>,
  )

  const options = screen.getByRole('button', { name: 'Options' })
  expect(options).toHaveClass('bg-[--background-norm]', 'hover:bg-[--interaction-weak-minor-2]')
  expect(options).not.toHaveClass(
    'bg-[--interaction-default]',
    'hover:bg-[--interaction-default-hover]',
    'active:bg-[--interaction-default-active]',
  )
})

it('names an icon button by its label and shows the label as a tooltip on focus', async () => {
  const onClick = jest.fn()
  render(
    <IconButton label="Decline suggestion" shape="ghost" size="small" onClick={onClick}>
      <svg aria-hidden="true" />
    </IconButton>,
  )

  const button = screen.getByRole('button', { name: 'Decline suggestion' })
  expect(button).toHaveClass('px-[calc(5em/14)]')
  act(() => button.focus())
  const tooltip = await screen.findByRole('tooltip', { hidden: true })
  expect(tooltip).toHaveTextContent('Decline suggestion')
  expect(tooltip).toHaveAttribute('aria-hidden', 'true')
  fireEvent.click(button)
  expect(onClick).toHaveBeenCalledTimes(1)
})
