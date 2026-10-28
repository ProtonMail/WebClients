import '@testing-library/jest-dom'
import { RecentDocumentsItem } from '@proton/docs-core/Services/recent-documents'
import { ServerTime } from '@proton/docs-shared/ServerTime'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { DocumentActionsContext, type DocumentActionsContextValue } from '../../../../__utils/document-actions'
import { DeletePermanentlyButton } from './DeletePermanently'
import { MoveToTrashButton } from './MoveToTrashButton'
import { RestoreFromTrashButton } from './RestoreFromTrash'

const recentDocument = RecentDocumentsItem.create({
  type: 'document',
  name: 'Document1',
  linkId: 'link1',
  parentLinkId: undefined,
  volumeId: 'volume1',
  lastViewed: new ServerTime(Date.now()),
  lastModified: new ServerTime(Date.now()),
  createdBy: 'Me',
  location: { type: 'root' },
  isSharedWithMe: false,
  shareId: 'share1',
})

function renderWithActions(node: ReactNode, actions: Partial<DocumentActionsContextValue>) {
  const value = {
    trash: jest.fn(),
    restore: jest.fn(),
    deletePermanently: jest.fn(),
    ...actions,
  } as unknown as DocumentActionsContextValue
  render(<DocumentActionsContext.Provider value={value}>{node}</DocumentActionsContext.Provider>)
}

function deferred() {
  let resolve!: () => void
  const promise = new Promise<void>((r) => (resolve = r))
  return { promise, resolve }
}

describe.each([
  {
    name: 'MoveToTrashButton',
    button: <MoveToTrashButton currentDocument={recentDocument} />,
    action: 'trash',
    label: 'Move to trash',
    loadingLabel: 'Trashing...',
  },
  {
    name: 'RestoreFromTrashButton',
    button: <RestoreFromTrashButton currentDocument={recentDocument} />,
    action: 'restore',
    label: 'Restore from trash',
    loadingLabel: 'Restoring...',
  },
] as const)('$name', ({ button, action, label, loadingLabel }) => {
  test('shows the loading label and disables the button while the action runs', async () => {
    const running = deferred()
    const run = jest.fn().mockReturnValue(running.promise)
    renderWithActions(button, { [action]: run })

    await userEvent.click(screen.getByRole('button', { name: label }))

    expect(run).toHaveBeenCalledWith(recentDocument)
    expect(screen.getByRole('button', { name: loadingLabel })).toBeDisabled()

    running.resolve()

    expect(await screen.findByRole('button', { name: label })).toBeEnabled()
  })
})

describe('DeletePermanentlyButton', () => {
  test('closes the menu before calling deletePermanently', async () => {
    const close = jest.fn()
    const deletePermanently = jest.fn().mockResolvedValue(undefined)
    renderWithActions(<DeletePermanentlyButton currentDocument={recentDocument} close={close} />, {
      deletePermanently,
    })

    await userEvent.click(screen.getByRole('button', { name: 'Delete permanently' }))

    expect(close).toHaveBeenCalledTimes(1)
    expect(deletePermanently).toHaveBeenCalledWith(recentDocument)
    expect(close.mock.invocationCallOrder[0]).toBeLessThan(deletePermanently.mock.invocationCallOrder[0])
  })
})
