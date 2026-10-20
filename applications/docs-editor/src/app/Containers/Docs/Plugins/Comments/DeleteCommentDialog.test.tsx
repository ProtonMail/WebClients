import type { PropsWithChildren } from 'react'
import { useRef, useState } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { DeleteCommentDialog } from './DeleteCommentDialog'
import { DocsDependenciesProvider, type DocsDependencies } from '../../DocsDependenciesProvider'

const reportError = jest.fn()

function DependenciesWrapper({ children }: PropsWithChildren) {
  return (
    <DocsDependenciesProvider dependencies={{ reportError } as unknown as DocsDependencies}>
      {children}
    </DocsDependenciesProvider>
  )
}

function DialogWithTrigger({ onDelete }: { onDelete: () => Promise<unknown> }) {
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  return (
    <>
      <button ref={triggerRef} type="button" onClick={() => setIsOpen(true)}>
        Open
      </button>
      {isOpen && (
        <DeleteCommentDialog
          title="Delete thread"
          message="Are you sure you want to delete this thread?"
          onDelete={onDelete}
          finalFocus={triggerRef}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  )
}

function renderDialog(onDelete: () => Promise<unknown> = () => Promise.resolve(true)) {
  render(<DialogWithTrigger onDelete={onDelete} />, { wrapper: DependenciesWrapper })
  const trigger = screen.getByRole('button', { name: 'Open' })
  // JSDOM has no layout; Ariakit checks visibility before restoring focus.
  Object.defineProperty(trigger, 'offsetWidth', { value: 1 })
  trigger.focus()
  fireEvent.click(trigger)
  return trigger
}

afterEach(() => {
  jest.clearAllMocks()
})

it('opens a modal dialog named by its title and described by its message', async () => {
  renderDialog()

  const dialog = await screen.findByRole('dialog', { name: 'Delete thread' })
  expect(screen.queryByRole('button', { name: 'Open' })).not.toBeInTheDocument()
  expect(dialog).toHaveAccessibleDescription(
    'Are you sure you want to delete this thread? You cannot undo this action.',
  )
})

it('draws no backdrop, which could not cover the header outside the editor iframe', async () => {
  renderDialog()

  const dialog = await screen.findByRole('dialog', { name: 'Delete thread' })
  expect(document.querySelector(`[data-backdrop="${dialog.id}"]`)).not.toBeInTheDocument()
})

it('moves focus to Cancel, so Enter cannot delete by accident', async () => {
  renderDialog()

  await waitFor(() => expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus())
})

it('closes on Escape and returns focus to the trigger without deleting', async () => {
  const onDelete = jest.fn(() => Promise.resolve(true))
  const trigger = renderDialog(onDelete)
  await waitFor(() => expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus())

  fireEvent.keyDown(screen.getByRole('button', { name: 'Cancel' }), { key: 'Escape' })

  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  await waitFor(() => expect(trigger).toHaveFocus())
  expect(onDelete).not.toHaveBeenCalled()
})

it('closes on Cancel and returns focus to the trigger without deleting', async () => {
  const onDelete = jest.fn(() => Promise.resolve(true))
  const trigger = renderDialog(onDelete)

  fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }))

  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  await waitFor(() => expect(trigger).toHaveFocus())
  expect(onDelete).not.toHaveBeenCalled()
})

it('stays open and pending until the deletion settles, then closes', async () => {
  let finishDeleting: (deleted: boolean) => void = () => {}
  const onDelete = jest.fn(() => new Promise<boolean>((resolve) => (finishDeleting = resolve)))
  renderDialog(onDelete)

  fireEvent.click(await screen.findByRole('button', { name: 'Delete' }))

  expect(onDelete).toHaveBeenCalledTimes(1)
  const dialog = screen.getByRole('dialog', { name: 'Delete thread' })
  expect(dialog).toHaveAttribute('aria-busy', 'true')
  expect(screen.getByRole('button', { name: 'Delete' })).toHaveAttribute('aria-disabled', 'true')
  expect(screen.getByRole('button', { name: 'Cancel' })).toHaveAttribute('aria-disabled', 'true')

  fireEvent.keyDown(dialog, { key: 'Escape' })
  expect(screen.getByRole('dialog')).toBeInTheDocument()

  finishDeleting(true)

  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  expect(reportError).not.toHaveBeenCalled()
})

it('reports a failed deletion and closes', async () => {
  const error = new Error('delete failed')
  renderDialog(() => Promise.reject(error))

  fireEvent.click(await screen.findByRole('button', { name: 'Delete' }))

  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  expect(reportError).toHaveBeenCalledWith(error)
})
