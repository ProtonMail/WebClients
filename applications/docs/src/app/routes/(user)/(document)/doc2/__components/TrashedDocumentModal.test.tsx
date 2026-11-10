import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import type { TrashState } from '../__utils/useDocumentFileActions'
import { TrashedDocumentModal, type TrashedDocumentModalProps } from './TrashedDocumentModal'

describe('TrashedDocumentModal', () => {
  test('trashed here: says so, and offers Undo, then Go to Drive', async () => {
    const { onRestore, onGoToDrive } = renderModal({ trashedInSession: true })

    expect(screen.getByText('Document moved to trash')).toBeInTheDocument()
    expect(
      screen.getByText(
        '"Plans" has been moved to the trash. It will stay there until you restore it or delete it permanently.',
      ),
    ).toBeInTheDocument()
    expect(buttonNames()).toEqual(['Undo', 'Go to Drive'])

    await userEvent.click(screen.getByRole('button', { name: 'Undo', hidden: true }))
    expect(onRestore).toHaveBeenCalledTimes(1)
    await userEvent.click(screen.getByRole('button', { name: 'Go to Drive', hidden: true }))
    expect(onGoToDrive).toHaveBeenCalledTimes(1)
  })

  test('trashed elsewhere or before opening: offers Go to Drive, then Take out of trash', async () => {
    const { onRestore } = renderModal({ trashedInSession: false })

    expect(screen.getByText('Document is in trash')).toBeInTheDocument()
    expect(buttonNames()).toEqual(['Go to Drive', 'Take out of trash'])

    await userEvent.click(screen.getByRole('button', { name: 'Take out of trash', hidden: true }))
    expect(onRestore).toHaveBeenCalledTimes(1)
  })

  test('without the right to restore, offers Go to Drive alone', () => {
    renderModal({ canRestore: false })

    expect(buttonNames()).toEqual(['Go to Drive'])
  })

  test('stays open while restoring, with the restore button disabled', () => {
    renderModal({ trashState: 'restoring' })

    expect(screen.getByText('Document is in trash')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Take out of trash/, hidden: true })).toBeDisabled()
  })

  test.each<TrashState>(['not_trashed', 'trashing'])('is closed while %s', (trashState) => {
    renderModal({ trashState })

    expect(screen.queryByText('Document is in trash')).not.toBeInTheDocument()
  })
})

function renderModal(overrides: Partial<TrashedDocumentModalProps> = {}) {
  const props = {
    documentTitle: 'Plans',
    trashState: 'trashed',
    trashedInSession: false,
    canRestore: true,
    onRestore: jest.fn(),
    onGoToDrive: jest.fn(),
    ...overrides,
  } satisfies TrashedDocumentModalProps
  render(<TrashedDocumentModal {...props} />)
  return props
}

const buttonNames = () => screen.queryAllByRole('button', { hidden: true }).map((button) => button.textContent)
