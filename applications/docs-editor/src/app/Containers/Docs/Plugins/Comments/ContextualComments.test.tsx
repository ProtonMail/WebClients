import type { PropsWithChildren } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { DocsCommentThread } from '../../contract/DocsCommentThread'
import { DocsDependenciesProvider, type DocsDependencies } from '../../DocsDependenciesProvider'
import { defaultDocsMessages } from '../../messages/defaultDocsMessages'
import { ThreadPopoverButton } from './ContextualComments'

// The thread itself needs an editor and comments state; only the popover around it is under test.
jest.mock('./CommentsPanelListThread', () => ({
  CommentsPanelListThread: () => (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
    <li tabIndex={0}>Thread content</li>
  ),
}))

function DependenciesWrapper({ children }: PropsWithChildren) {
  return (
    <DocsDependenciesProvider dependencies={{ defaultMessages: defaultDocsMessages } as DocsDependencies}>
      {children}
    </DocsDependenciesProvider>
  )
}

function renderThreadPopoverButton() {
  render(
    <>
      <ThreadPopoverButton thread={{ id: 'thread-id' } as DocsCommentThread} />
      <button>Outside</button>
    </>,
    { wrapper: DependenciesWrapper },
  )
  return screen.getByRole('button', { name: 'Show thread' })
}

async function openThread(trigger: HTMLElement) {
  fireEvent.click(trigger)
  return screen.findByRole('dialog', { name: 'Comments' })
}

it('opens the thread in a popover the trigger controls, and moves focus into it', async () => {
  const trigger = renderThreadPopoverButton()
  expect(trigger).toHaveAttribute('aria-expanded', 'false')

  const popover = await openThread(trigger)

  expect(popover).toHaveTextContent('Thread content')
  expect(trigger).toHaveAttribute('aria-expanded', 'true')
  expect(trigger).toHaveAttribute('aria-controls', popover.id)
  await waitFor(() => expect(popover).toContainElement(document.activeElement as HTMLElement))
})

it('closes on Escape and returns focus to the trigger', async () => {
  const trigger = renderThreadPopoverButton()
  // JSDOM has no layout; Ariakit checks visibility before restoring focus.
  Object.defineProperty(trigger, 'offsetWidth', { value: 1 })
  const popover = await openThread(trigger)
  await waitFor(() => expect(popover).toContainElement(document.activeElement as HTMLElement))

  fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'Escape' })

  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  await waitFor(() => expect(trigger).toHaveFocus())
  expect(trigger).toHaveAttribute('aria-expanded', 'false')
})

it('closes on a click outside it', async () => {
  const trigger = renderThreadPopoverButton()
  await openThread(trigger)
  const outside = screen.getByRole('button', { name: 'Outside' })

  fireEvent.pointerDown(outside)
  fireEvent.mouseDown(outside)
  fireEvent.focusIn(outside)
  fireEvent.click(outside)

  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
})

it('stays open while the thread inside it is used', async () => {
  const trigger = renderThreadPopoverButton()
  const popover = await openThread(trigger)
  const threadContent = screen.getByText('Thread content')

  fireEvent.pointerDown(threadContent)
  fireEvent.mouseDown(threadContent)
  fireEvent.click(threadContent)

  expect(popover).toBeVisible()
})
