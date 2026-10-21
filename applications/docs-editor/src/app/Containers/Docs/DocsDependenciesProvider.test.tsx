import { render, screen } from '@testing-library/react'
import { DocsDependenciesProvider, useDocsMessages, type DocsDependencies } from './DocsDependenciesProvider'
import type { DocsMessages } from './messages/DocsMessages'
import { defaultDocsMessages } from './messages/defaultDocsMessages'

const translatedMessages: DocsMessages = {
  ...defaultDocsMessages,
  toolbar: { ...defaultDocsMessages.toolbar, Bold: 'Gras' },
}

function BoldLabel() {
  return <span>{useDocsMessages().toolbar.Bold}</span>
}

function dependencies(messageDependencies: Pick<DocsDependencies, 'messages' | 'defaultMessages'>) {
  return messageDependencies as DocsDependencies
}

it('refreshes an editor component when dependency messages change', () => {
  const { rerender } = render(
    <DocsDependenciesProvider dependencies={dependencies({ messages: defaultDocsMessages })}>
      <BoldLabel />
    </DocsDependenciesProvider>,
  )
  expect(screen.getByText('Bold')).toBeTruthy()
  rerender(
    <DocsDependenciesProvider dependencies={dependencies({ messages: translatedMessages })}>
      <BoldLabel />
    </DocsDependenciesProvider>,
  )
  expect(screen.getByText('Gras')).toBeTruthy()
})

it('prefers host messages, then inherited messages, over the defaults', () => {
  render(
    <DocsDependenciesProvider dependencies={dependencies({ messages: translatedMessages })}>
      <DocsDependenciesProvider dependencies={dependencies({ messages: defaultDocsMessages })}>
        <BoldLabel />
      </DocsDependenciesProvider>
      <DocsDependenciesProvider dependencies={dependencies({ defaultMessages: defaultDocsMessages })}>
        <BoldLabel />
      </DocsDependenciesProvider>
    </DocsDependenciesProvider>,
  )
  expect(screen.getAllByText(/^(Bold|Gras)$/).map((label) => label.textContent)).toEqual(['Bold', 'Gras'])
})

it('falls back to the default messages when the host supplies none', () => {
  render(
    <DocsDependenciesProvider dependencies={dependencies({ defaultMessages: defaultDocsMessages })}>
      <BoldLabel />
    </DocsDependenciesProvider>,
  )
  expect(screen.getByText('Bold')).toBeTruthy()
})

// Compiled by the app typecheck; this function is deliberately not executed.
function typecheckContract(messages: DocsMessages) {
  // @ts-expect-error Supplying an empty object must not silently fall back to English.
  const missing: DocsMessages = {}
  // @ts-expect-error Nested fields are required as well.
  const partial: DocsMessages = { ...messages, toolbar: { Bold: 'Bold' } }
  const { emoji, ...withoutEmoji } = messages
  // @ts-expect-error Entire groups are mandatory when supplying messages.
  const incomplete: DocsMessages = withoutEmoji
  // @ts-expect-error Every emoji category needs a label.
  const someCategories: DocsMessages = { ...messages, emoji: { ...emoji, categories: { people: 'People' } } }
  return { missing, partial, incomplete, someCategories }
}
void typecheckContract

it('fails clearly when message dependencies are missing', () => {
  const error = jest.spyOn(console, 'error').mockImplementation(() => {})
  try {
    expect(() => render(<BoldLabel />)).toThrow(
      'Docs requires messages from a host provider or the standalone English entry.',
    )
  } finally {
    error.mockRestore()
  }
})
