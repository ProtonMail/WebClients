import { render, screen } from '@testing-library/react'
import { DocsDependenciesProvider, type DocsDependencies } from '../../DocsDependenciesProvider'
import { defaultDocsMessages } from '../../messages/defaultDocsMessages'
import { ShortcutKbd } from './ShortcutKbd'

function MessagesProvider({ children }: { children: React.ReactNode }) {
  return (
    <DocsDependenciesProvider dependencies={{ defaultMessages: defaultDocsMessages } as DocsDependencies}>
      {children}
    </DocsDependenciesProvider>
  )
}

it('renders a kbd element labelled with the shortcut, keeping the caller className', () => {
  render(<ShortcutKbd shortcut="Shift" className="caller-class" />, { wrapper: MessagesProvider })

  const kbd = screen.getByLabelText('Keyboard shortcut: Shift')
  expect(kbd.tagName).toBe('KBD')
  expect(kbd).toHaveTextContent('Shift')
  expect(kbd).toHaveClass('caller-class')
})
