import '@testing-library/jest-dom'
import type { AuthenticatedDocControllerInterface } from '@proton/docs-core/AuthenticatedDocController/AuthenticatedDocControllerInterface'
import { DocumentState, type DocumentStateValues } from '@proton/docs-core/State/DocumentState'
import { DocumentRole, type DocumentRoleType } from '@proton/docs-shared/Doc/DocumentRole'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TrashedDocumentModal } from './TrashedDocumentModal'

let mockTrashWithSDK = true
jest.mock('~/utils/flags', () => ({
  ...jest.requireActual('~/utils/flags'),
  useTrashWithSDK: () => mockTrashWithSDK,
}))

function renderModal({
  didTrashDocInCurrentSession,
  role = 'Admin',
}: {
  didTrashDocInCurrentSession: boolean
  role?: DocumentRoleType
}) {
  const controller = { didTrashDocInCurrentSession, restoreDocument: jest.fn() }
  const documentState = new DocumentState({
    ...DocumentState.defaults,
    documentTrashState: 'trashed',
    userRole: new DocumentRole(role),
  } as DocumentStateValues)

  render(
    <TrashedDocumentModal
      controller={controller as unknown as AuthenticatedDocControllerInterface}
      documentState={documentState}
      documentTitle="Document1"
      onOpenProtonDrive={jest.fn()}
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
    'hides the actions when the user cannot trash (didTrashDocInCurrentSession %s)',
    (didTrashDocInCurrentSession) => {
      renderModal({ didTrashDocInCurrentSession, role: 'Editor' })

      expect(buttonNames()).toEqual([])
    },
  )

  test.each([
    { didTrashDocInCurrentSession: true, restoreButton: 'Undo', trashWithSDK: true },
    { didTrashDocInCurrentSession: true, restoreButton: 'Undo', trashWithSDK: false },
    { didTrashDocInCurrentSession: false, restoreButton: 'Take out of trash', trashWithSDK: true },
    { didTrashDocInCurrentSession: false, restoreButton: 'Take out of trash', trashWithSDK: false },
  ])(
    '$restoreButton passes useTrashWithSDK $trashWithSDK to restoreDocument',
    async ({ didTrashDocInCurrentSession, restoreButton, trashWithSDK }) => {
      mockTrashWithSDK = trashWithSDK
      const { controller } = renderModal({ didTrashDocInCurrentSession })

      await userEvent.click(screen.getByRole('button', { name: restoreButton, hidden: true }))

      expect(controller.restoreDocument).toHaveBeenCalledWith(trashWithSDK)
    },
  )
})
