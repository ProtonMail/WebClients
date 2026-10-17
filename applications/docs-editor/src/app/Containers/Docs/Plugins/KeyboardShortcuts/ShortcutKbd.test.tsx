import { render, screen } from '@testing-library/react'
import { ShortcutKbd } from './ShortcutKbd'

it('renders a kbd element labelled with the shortcut, keeping the caller className', () => {
  render(<ShortcutKbd shortcut="Shift" className="caller-class" />)

  const kbd = screen.getByLabelText('Keyboard shortcut: Shift')
  expect(kbd.tagName).toBe('KBD')
  expect(kbd).toHaveTextContent('Shift')
  expect(kbd).toHaveClass('caller-class')
})
