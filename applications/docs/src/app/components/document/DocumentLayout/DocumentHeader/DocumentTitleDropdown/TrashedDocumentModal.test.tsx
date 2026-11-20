import '@testing-library/jest-dom/vitest'
import type { AuthenticatedDocControllerInterface } from '@proton/docs-core/AuthenticatedDocController/AuthenticatedDocControllerInterface'
import { DocumentState, type DocumentStateValues } from '@proton/docs-core/State/DocumentState'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TrashedDocumentModal } from './TrashedDocumentModal'

function renderModal({
  didTrashDocInCurrentSession,
  canRestore = true,
  onRetryRestoreCheck,
}: {
  didTrashDocInCurrentSession: boolean
  canRestore?: boolean
  onRetryRestoreCheck?: () => void
}) {
  const controller = { didTrashDocInCurrentSession, restoreDocument: vi.fn() }
  const documentState = new DocumentState({
    ...DocumentState.defaults,
    documentTrashState: 'trashed',
  } as DocumentStateValues)

  render(
    <TrashedDocumentModal
      controller={controller as unknown as AuthenticatedDocControllerInterface}
      documentState={documentState}
      documentTitle="Document1"
      onOpenProtonDrive={vi.fn()}
      canRestore={canRestore}
      onRetryRestoreCheck={onRetryRestoreCheck}
    />,
  )

  return { controller }
}

const buttonNames = () => screen.queryAllByRole('button', { hidden: true }).map((button) => button.textContent)

describe('TrashedDocumentModal', () => {
  test('offers Undo when the document was trashed in this session', () => {
    renderModal({ didTrashDocInCurrentSession: true })

    expect(screen.getByText('Document moved to trash')).toBeInTheDocument()
    expect(
      screen.getByText(
        '"Document1" has been moved to the trash. It will stay there until you restore it or delete it permanently.',
      ),
    ).toBeInTheDocument()
    expect(buttonNames()).toEqual(['Undo', 'Go to Drive'])
  })

  test('offers Take out of trash when the document was trashed before this session', () => {
    renderModal({ didTrashDocInCurrentSession: false })

    expect(screen.getByText('Document is in trash')).toBeInTheDocument()
    expect(
      screen.getByText('"Document1" is in trash and will stay there until you delete it permanently.'),
    ).toBeInTheDocument()
    expect(buttonNames()).toEqual(['Go to Drive', 'Take out of trash'])
  })

  test.each([true, false])(
    'offers only Go to Drive to a user who may not restore (didTrashDocInCurrentSession %s)',
    (didTrashDocInCurrentSession) => {
      renderModal({ didTrashDocInCurrentSession, canRestore: false })

      expect(buttonNames()).toEqual(['Go to Drive'])
      expect(screen.queryByText("We couldn't check whether you can take it out of trash.")).not.toBeInTheDocument()
    },
  )

  test.each([true, false])(
    'says when Drive could not tell whether the user may restore, and offers to ask again (didTrashDocInCurrentSession %s)',
    async (didTrashDocInCurrentSession) => {
      const onRetryRestoreCheck = vi.fn()
      renderModal({ didTrashDocInCurrentSession, canRestore: false, onRetryRestoreCheck })

      expect(screen.getByText("We couldn't check whether you can take it out of trash.")).toBeInTheDocument()
      expect(buttonNames()).toEqual(['Go to Drive', 'Try again'])

      await userEvent.click(screen.getByRole('button', { name: 'Try again', hidden: true }))

      expect(onRetryRestoreCheck).toHaveBeenCalledTimes(1)
    },
  )

  test.each([
    { didTrashDocInCurrentSession: true, restoreButton: 'Undo' },
    { didTrashDocInCurrentSession: false, restoreButton: 'Take out of trash' },
  ] as const)('$restoreButton restores the document', async ({ didTrashDocInCurrentSession, restoreButton }) => {
    const { controller } = renderModal({ didTrashDocInCurrentSession })

    await userEvent.click(screen.getByRole('button', { name: restoreButton, hidden: true }))

    expect(controller.restoreDocument).toHaveBeenCalledTimes(1)
  })
})
