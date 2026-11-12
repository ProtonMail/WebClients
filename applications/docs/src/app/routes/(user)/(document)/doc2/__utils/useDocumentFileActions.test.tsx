import { act, render, renderHook, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'

import type { DriveCompat } from '@proton/drive-store/lib/useDriveCompat'
import { type NodeEntity, getDrive } from '@proton/drive/sdk'
import { assignUrl } from '@proton/shared/lib/helpers/location'
import { getNewWindow } from '@proton/shared/lib/helpers/window'
import { DocsApiError, SeedError } from '@proton-docs/realtime-sdk'

import { ApplicationProvider, type ApplicationProviderProps } from '~/utils/application-context'
import type { DocumentRole } from './getDocumentRole'
import { type DocumentFileActions, useDocumentFileActions } from './useDocumentFileActions'

let mockIsSheetsEnabled = true
jest.mock('~/utils/flags', () => ({ useIsSheetsEnabled: () => mockIsSheetsEnabled }))
const mockCreateNotification = jest.fn()
jest.mock('@proton/app-context/useNotifications', () => ({
  useNotifications: () => ({ createNotification: mockCreateNotification }),
}))
jest.mock('@proton/components/hooks/useAuthentication', () => () => ({ getLocalID: () => 3 }))
const mockShowMoveItemsModal = jest.fn()
jest.mock('@proton/drive/public/moveItemsModal', () => ({
  useMoveItemsModal: () => ({ moveItemsModal: <div>Move modal</div>, showMoveItemsModal: mockShowMoveItemsModal }),
}))
jest.mock('@proton/drive/sdk', () => ({ ...jest.requireActual('@proton/drive/sdk'), getDrive: jest.fn() }))
jest.mock('@proton/shared/lib/helpers/location')
jest.mock('@proton/shared/lib/helpers/window', () => ({ getNewWindow: jest.fn() }))
jest.mock('@proton/shared/lib/docs/utils/getPlatformFriendlyDateForFileName', () => ({
  getPlatformFriendlyDateForFileName: () => '2026-11-10 09.00.00',
}))

const NODE = {
  uid: 'VOLUME~LINK',
  parentUid: 'VOLUME~PARENT',
  name: { ok: true, value: 'Plans' },
} as unknown as NodeEntity
const TRASHED_NODE = { ...NODE, trashTime: new Date() } as NodeEntity

const drive = {
  trashNodes: jest.fn(),
  restoreNodes: jest.fn(),
  getNodeHierarchy: jest.fn(),
  getAvailableName: jest.fn(),
}
const driveCompat = { getMyFilesNodeMeta: jest.fn(), createDocumentNode: jest.fn() }
const STATE = new Uint8Array([1, 2, 3])
const client = { seedInitialCommit: jest.fn() }
const exportInvoker = { exportData: jest.fn() }
const newWindow = { handle: { location: { assign: jest.fn() } }, close: jest.fn() }

/** A promise to settle from the test, for an action in flight */
function deferred<T = void>() {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

async function* results(...items: ({ ok: true } | { ok: false; error: Error })[]) {
  for (const item of items) {
    yield { uid: NODE.uid, ...item }
  }
}

async function* waitThen(gate: Promise<void>, ...items: ({ ok: true } | { ok: false; error: Error })[]) {
  await gate
  yield* results(...items)
}

describe('useDocumentFileActions', () => {
  beforeEach(() => {
    mockIsSheetsEnabled = true
    jest.mocked(getDrive).mockReturnValue(drive as unknown as ReturnType<typeof getDrive>)
    jest.mocked(getNewWindow).mockReturnValue(newWindow as unknown as ReturnType<typeof getNewWindow>)
    drive.trashNodes.mockImplementation(() => results({ ok: true }))
    drive.restoreNodes.mockImplementation(() => results({ ok: true }))
    drive.getAvailableName.mockImplementation(async (_parentUid: string, name: string) => name)
    driveCompat.getMyFilesNodeMeta.mockResolvedValue({ volumeId: 'MYVOLUME', linkId: 'MYFILES' })
    driveCompat.createDocumentNode.mockResolvedValue({ volumeId: 'VOLUME', linkId: 'SHEET', keys: {} })
    client.seedInitialCommit.mockResolvedValue({ commitId: 'COMMIT' })
    exportInvoker.exportData.mockResolvedValue(STATE)
  })

  afterEach(() => jest.clearAllMocks())

  describe('New document', () => {
    test('opens a new window on doc2, creating the document in the same folder', () => {
      const { result } = renderActions()

      act(() => result.current.newDocument())

      expect(getNewWindow).toHaveBeenCalledWith(
        'http://docs.localhost/u/3/doc2?mode=create&volumeId=VOLUME&parentLinkId=PARENT',
      )
    })

    test('without a parent folder, opens the bare doc2 URL, which creates the document in My files', () => {
      const { result } = renderActions({ node: { ...NODE, parentUid: undefined } as NodeEntity })

      act(() => result.current.newDocument())

      expect(getNewWindow).toHaveBeenCalledWith('http://docs.localhost/u/3/doc2')
    })

    test('does nothing before the node is there', () => {
      const { result } = renderActions({ node: undefined })

      act(() => result.current.newDocument())

      expect(getNewWindow).not.toHaveBeenCalled()
    })
  })

  describe('New spreadsheet', () => {
    test('opens a window on the click, creates the sheet in the same folder, then opens it on legacy sheets', async () => {
      const { result } = renderActions()

      act(() => result.current.newSpreadsheet())

      expect(getNewWindow).toHaveBeenCalledWith()
      expect(result.current.isCreatingSpreadsheet).toBe(true)
      await waitFor(() => expect(result.current.isCreatingSpreadsheet).toBe(false))
      expect(drive.getAvailableName).toHaveBeenCalledWith(
        'VOLUME~PARENT',
        'Untitled spreadsheet 2026-11-10 09.00.00',
        'file',
      )
      expect(driveCompat.createDocumentNode).toHaveBeenCalledWith(
        { volumeId: 'VOLUME', linkId: 'PARENT' },
        'Untitled spreadsheet 2026-11-10 09.00.00',
        'sheet',
      )
      expect(newWindow.handle.location.assign).toHaveBeenCalledWith(
        'http://docs.localhost/u/3/sheet?mode=open&volumeId=VOLUME&linkId=SHEET',
      )
    })

    test('takes the name Drive offers when the default one is taken', async () => {
      drive.getAvailableName.mockResolvedValue('Untitled spreadsheet 2026-11-10 09.00.00 (1)')
      const { result } = renderActions()

      act(() => result.current.newSpreadsheet())

      await waitFor(() => expect(driveCompat.createDocumentNode).toHaveBeenCalled())
      expect(driveCompat.createDocumentNode.mock.calls[0][1]).toBe('Untitled spreadsheet 2026-11-10 09.00.00 (1)')
    })

    test('without a parent folder, creates the sheet in My files', async () => {
      const { result } = renderActions({ node: { ...NODE, parentUid: undefined } as NodeEntity })

      act(() => result.current.newSpreadsheet())

      await waitFor(() => expect(driveCompat.createDocumentNode).toHaveBeenCalled())
      expect(driveCompat.createDocumentNode.mock.calls[0][0]).toEqual({ volumeId: 'MYVOLUME', linkId: 'MYFILES' })
    })

    test('a failed creation closes the window and says so', async () => {
      driveCompat.createDocumentNode.mockRejectedValue(new Error('Offline'))
      const { result } = renderActions()

      act(() => result.current.newSpreadsheet())

      await waitFor(() => expect(result.current.isCreatingSpreadsheet).toBe(false))
      expect(newWindow.close).toHaveBeenCalled()
      expect(newWindow.handle.location.assign).not.toHaveBeenCalled()
      expect(mockCreateNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }))
    })

    test('a second click while creating creates nothing more', async () => {
      const creation = deferred<{ volumeId: string; linkId: string }>()
      driveCompat.createDocumentNode.mockReturnValue(creation.promise)
      const { result } = renderActions()

      act(() => {
        result.current.newSpreadsheet()
        result.current.newSpreadsheet()
      })
      act(() => result.current.newSpreadsheet())
      await act(async () => creation.resolve({ volumeId: 'VOLUME', linkId: 'SHEET' }))

      expect(getNewWindow).toHaveBeenCalledTimes(1)
      await waitFor(() => expect(newWindow.handle.location.assign).toHaveBeenCalledTimes(1))
    })

    test('does nothing with sheets disabled', () => {
      mockIsSheetsEnabled = false
      const { result } = renderActions()

      act(() => result.current.newSpreadsheet())

      expect(getNewWindow).not.toHaveBeenCalled()
      expect(driveCompat.createDocumentNode).not.toHaveBeenCalled()
    })
  })

  describe('Make a copy', () => {
    beforeEach(() => driveCompat.createDocumentNode.mockResolvedValue({ volumeId: 'VOLUME', linkId: 'COPY', keys: {} }))

    test('opens a window on the click, seeds a copy of what the editor holds next to the document, then opens it in doc2', async () => {
      const { result } = renderActions()

      act(() => result.current.makeACopy())

      expect(getNewWindow).toHaveBeenCalledWith()
      expect(result.current.isMakingACopy).toBe(true)
      await waitFor(() => expect(result.current.isMakingACopy).toBe(false))
      expect(exportInvoker.exportData).toHaveBeenCalledWith('yjs')
      expect(drive.getAvailableName).toHaveBeenCalledWith('VOLUME~PARENT', 'Plans (copy 2026-11-10 09.00.00)', 'file')
      expect(driveCompat.createDocumentNode).toHaveBeenCalledWith(
        { volumeId: 'VOLUME', linkId: 'PARENT' },
        'Plans (copy 2026-11-10 09.00.00)',
        'doc',
      )
      expect(client.seedInitialCommit).toHaveBeenCalledWith({
        nodeMeta: { volumeId: 'VOLUME', linkId: 'COPY' },
        state: STATE,
      })
      expect(newWindow.handle.location.assign).toHaveBeenCalledWith(
        'http://docs.localhost/u/3/doc2?mode=open&volumeId=VOLUME&linkId=COPY',
      )
      expect(newWindow.close).not.toHaveBeenCalled()
    })

    test.each([
      [
        'a state over the size limit',
        new SeedError('stateTooLarge', { attemptedBytes: 26_000_000, limitBytes: 25_000_000 }),
        'Document Size Limit Exceeded',
        'This document is too large to copy. Download it to keep a copy of your work.',
      ],
      [
        'a seed the Docs API refuses',
        new DocsApiError('seedInitialCommit', 422, 250003),
        'Something went wrong',
        'An error occurred while attempting to duplicate the document. Please try again.',
      ],
    ])('%s shows an error modal, and nothing opens', async (_case, error, title, message) => {
      client.seedInitialCommit.mockRejectedValue(error)
      const { result } = renderActions()

      act(() => result.current.makeACopy())

      await waitFor(() => expect(result.current.isMakingACopy).toBe(false))
      expect(newWindow.close).toHaveBeenCalled()
      expect(newWindow.handle.location.assign).not.toHaveBeenCalled()
      renderModals(result.current)
      const modal = screen.getByRole('dialog', { hidden: true })
      expect(modal).toHaveTextContent(title)
      expect(modal).toHaveTextContent(message)
    })

    test('a failed export creates nothing and shows the error modal', async () => {
      exportInvoker.exportData.mockRejectedValue(new Error('Editor timed out'))
      const { result } = renderActions()

      act(() => result.current.makeACopy())

      await waitFor(() => expect(result.current.isMakingACopy).toBe(false))
      expect(driveCompat.createDocumentNode).not.toHaveBeenCalled()
      expect(newWindow.close).toHaveBeenCalled()
      renderModals(result.current)
      expect(screen.getByRole('dialog', { hidden: true })).toHaveTextContent('Something went wrong')
    })

    test('a second click while copying copies nothing more', async () => {
      const seed = deferred<{ commitId: string }>()
      client.seedInitialCommit.mockReturnValue(seed.promise)
      const { result } = renderActions()

      act(() => {
        result.current.makeACopy()
        result.current.makeACopy()
      })
      act(() => result.current.makeACopy())
      await waitFor(() => expect(client.seedInitialCommit).toHaveBeenCalled())
      await act(async () => seed.resolve({ commitId: 'COMMIT' }))

      expect(getNewWindow).toHaveBeenCalledTimes(1)
      expect(driveCompat.createDocumentNode).toHaveBeenCalledTimes(1)
      await waitFor(() => expect(newWindow.handle.location.assign).toHaveBeenCalledTimes(1))
    })

    test('does nothing until the editor shows the document', () => {
      const { result } = renderActions({ exportInvoker: undefined })

      act(() => result.current.makeACopy())

      expect(getNewWindow).not.toHaveBeenCalled()
      expect(exportInvoker.exportData).not.toHaveBeenCalled()
    })
  })

  describe('Move to folder', () => {
    test('opens the Drive move modal on the document', () => {
      const { result } = renderActions()

      act(() => result.current.moveToFolder())

      expect(mockShowMoveItemsModal).toHaveBeenCalledWith({ nodeUids: ['VOLUME~LINK'] })
    })

    test('a Viewer can move it too', () => {
      const { result } = renderActions({ role: 'Viewer' })

      act(() => result.current.moveToFolder())

      expect(mockShowMoveItemsModal).toHaveBeenCalledTimes(1)
    })
  })

  describe('Open in Drive', () => {
    test("opens a window on the click, then the document's folder", async () => {
      drive.getNodeHierarchy.mockResolvedValue([
        { uid: 'VOLUME~ROOT', deprecatedShareId: 'SHARE', directRole: 'admin' },
        { ...NODE, directRole: 'admin' },
      ])
      const { result } = renderActions()

      act(() => result.current.openProtonDrive())

      expect(getNewWindow).toHaveBeenCalledWith()
      await waitFor(() =>
        expect(newWindow.handle.location.assign).toHaveBeenCalledWith('http://drive.localhost/u/3/SHARE/folder/PARENT'),
      )
      expect(drive.getNodeHierarchy).toHaveBeenCalledWith('VOLUME~LINK')
    })

    test('a document shared with the user opens Shared with me', async () => {
      drive.getNodeHierarchy.mockResolvedValue([
        { ...NODE, parentUid: undefined, directRole: 'editor', membership: {} },
      ])
      const { result } = renderActions({ node: { ...NODE, parentUid: undefined } as NodeEntity })

      act(() => result.current.openProtonDrive())

      await waitFor(() =>
        expect(newWindow.handle.location.assign).toHaveBeenCalledWith('http://drive.localhost/u/3/shared-with-me'),
      )
    })

    test('falls back to the Drive root when the folder lookup fails', async () => {
      drive.getNodeHierarchy.mockRejectedValue(new Error('Offline'))
      const { result } = renderActions()

      act(() => result.current.openProtonDrive())

      await waitFor(() => expect(newWindow.handle.location.assign).toHaveBeenCalledWith('http://drive.localhost/u/3'))
    })
  })

  describe('Move to trash', () => {
    test('an Admin trashes the document with the Drive SDK, then sees the trashed modal with Undo', async () => {
      const gate = deferred()
      drive.trashNodes.mockImplementation(() => waitThen(gate.promise, { ok: true }))
      const { result } = renderActions()

      act(() => result.current.moveToTrash())

      expect(result.current.trashState).toBe('trashing')
      expect(drive.trashNodes).toHaveBeenCalledWith(['VOLUME~LINK'])
      await act(async () => gate.resolve())
      expect(result.current.trashState).toBe('trashed')
      renderModals(result.current)
      expect(screen.getByText('Document moved to trash')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Undo', hidden: true })).toBeInTheDocument()
    })

    test.each<DocumentRole>(['Editor', 'Viewer'])('a %s trashes nothing', (role) => {
      const { result } = renderActions({ role })

      act(() => result.current.moveToTrash())

      expect(drive.trashNodes).not.toHaveBeenCalled()
      expect(result.current.trashState).toBe('not_trashed')
    })

    test('a second click while trashing trashes once', async () => {
      const gate = deferred()
      drive.trashNodes.mockImplementation(() => waitThen(gate.promise, { ok: true }))
      const { result } = renderActions()

      act(() => {
        result.current.moveToTrash()
        result.current.moveToTrash()
      })
      act(() => result.current.moveToTrash())
      await act(async () => gate.resolve())

      expect(drive.trashNodes).toHaveBeenCalledTimes(1)
    })

    test.each([
      ['a failed result', () => results({ ok: false, error: new Error('Offline') })],
      [
        'a thrown error',
        () =>
          (async function* () {
            throw new Error('Offline')
          })(),
      ],
    ])('%s rolls back and says so', async (_case, trashNodes) => {
      drive.trashNodes.mockImplementation(trashNodes)
      const { result } = renderActions()

      act(() => result.current.moveToTrash())

      await waitFor(() => expect(result.current.trashState).toBe('not_trashed'))
      expect(mockCreateNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          text: 'An error occurred while attempting to trash the document. Please try again.',
        }),
      )
    })
  })

  describe('the trashed modal', () => {
    test('shows for a document opened trashed, with Take out of trash', () => {
      const { result } = renderActions({ node: TRASHED_NODE })

      expect(result.current.trashState).toBe('trashed')
      renderModals(result.current)
      expect(screen.getByText('Document is in trash')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Take out of trash', hidden: true })).toBeInTheDocument()
    })

    test('shows when the document gets trashed elsewhere, and goes when it gets restored elsewhere', () => {
      const { result, rerender } = renderActions()
      expect(result.current.trashState).toBe('not_trashed')

      rerender({ node: TRASHED_NODE, role: 'Admin' })
      expect(result.current.trashState).toBe('trashed')
      renderModals(result.current)
      expect(screen.getByText('Document is in trash')).toBeInTheDocument()

      rerender({ node: NODE, role: 'Admin' })
      expect(result.current.trashState).toBe('not_trashed')
    })

    test('a trash elsewhere after an Undo whose Drive event never came still shows the modal', async () => {
      const { result, rerender } = renderActions({ node: TRASHED_NODE })
      renderModals(result.current)
      await userEvent.click(screen.getByRole('button', { name: 'Take out of trash', hidden: true }))
      await waitFor(() => expect(result.current.trashState).toBe('not_trashed'))

      // Drive reads the node again, trashed again elsewhere: as trashed as the last read
      rerender({ node: { ...TRASHED_NODE } as NodeEntity, role: 'Admin' })

      expect(result.current.trashState).toBe('trashed')
    })

    test('a read of the node while trashing leaves the trash to decide', async () => {
      const gate = deferred()
      drive.trashNodes.mockImplementation(() => waitThen(gate.promise, { ok: true }))
      const { result, rerender } = renderActions()
      act(() => result.current.moveToTrash())

      rerender({ node: { ...NODE } as NodeEntity, role: 'Admin' })
      expect(result.current.trashState).toBe('trashing')
      await act(async () => gate.resolve())

      expect(result.current.trashState).toBe('trashed')
    })

    describe('a failed trash or restore trusts only a node read while it ran', () => {
      test('a trash failing after a restore whose Drive event never came stays out of the trash', async () => {
        drive.trashNodes.mockImplementation(() => results({ ok: false, error: new Error('Offline') }))
        const { result } = renderActions({ node: TRASHED_NODE })
        await restoreFromModal(result.current)
        await act(async () => {})
        expect(result.current.trashState).toBe('not_trashed')

        await act(async () => result.current.moveToTrash())

        expect(result.current.trashState).toBe('not_trashed')
      })

      test('a trash failing after a read that says trashed elsewhere shows the modal', async () => {
        const gate = deferred()
        drive.trashNodes.mockImplementation(() => waitThen(gate.promise, { ok: false, error: new Error('Gone') }))
        const { result, rerender } = renderActions()
        act(() => result.current.moveToTrash())

        rerender({ node: { ...TRASHED_NODE } as NodeEntity, role: 'Admin' })
        await act(async () => gate.resolve())

        expect(result.current.trashState).toBe('trashed')
      })

      test('a restore failing after a read that says restored elsewhere closes the modal', async () => {
        const gate = deferred()
        drive.restoreNodes.mockImplementation(() => waitThen(gate.promise, { ok: false, error: new Error('Gone') }))
        const { result, rerender } = renderActions({ node: TRASHED_NODE })
        await restoreFromModal(result.current)

        rerender({ node: { ...NODE } as NodeEntity, role: 'Admin' })
        await act(async () => gate.resolve())

        expect(result.current.trashState).toBe('not_trashed')
      })

      test('an Undo failing with no read in between stays trashed here', async () => {
        drive.restoreNodes.mockImplementation(() => results({ ok: false, error: new Error('Offline') }))
        const { result } = renderActions()
        await act(async () => result.current.moveToTrash())

        await restoreFromModal(result.current)
        await act(async () => {})

        expect(result.current.trashState).toBe('trashed')
        renderModals(result.current)
        expect(screen.getByText('Document moved to trash')).toBeInTheDocument()
      })
    })

    test('Undo restores with the Drive SDK, and the modal goes', async () => {
      const { result } = renderActions()
      await act(async () => result.current.moveToTrash())
      expect(result.current.trashState).toBe('trashed')
      const modals = renderModals(result.current)

      await userEvent.click(screen.getByRole('button', { name: 'Undo', hidden: true }))

      expect(drive.restoreNodes).toHaveBeenCalledWith(['VOLUME~LINK'])
      await waitFor(() => expect(result.current.trashState).toBe('not_trashed'))
      modals.rerender(<>{result.current.modals}</>)
      await waitFor(() => expect(screen.queryByText('Document moved to trash')).not.toBeInTheDocument())
    })

    test('restoring keeps the modal open with its button disabled, and a second click restores once', async () => {
      const gate = deferred()
      drive.restoreNodes.mockImplementation(() => waitThen(gate.promise, { ok: true }))
      const { result } = renderActions({ node: TRASHED_NODE })
      const modals = renderModals(result.current)

      await userEvent.click(screen.getByRole('button', { name: 'Take out of trash', hidden: true }))
      expect(result.current.trashState).toBe('restoring')
      modals.rerender(<>{result.current.modals}</>)
      // Its name also holds the loader's
      expect(screen.getByRole('button', { name: /^Take out of trash/, hidden: true })).toBeDisabled()
      await act(async () => gate.resolve())

      expect(drive.restoreNodes).toHaveBeenCalledTimes(1)
      expect(result.current.trashState).toBe('not_trashed')
    })

    test('a document deleted for good stays trashed, and says restoring failed', async () => {
      drive.restoreNodes.mockImplementation(() => results({ ok: false, error: new Error('Node not found') }))
      const { result } = renderActions({ node: TRASHED_NODE })
      renderModals(result.current)

      await userEvent.click(screen.getByRole('button', { name: 'Take out of trash', hidden: true }))

      await waitFor(() => expect(mockCreateNotification).toHaveBeenCalled())
      expect(result.current.trashState).toBe('trashed')
      expect(mockCreateNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          text: 'An error occurred while attempting to restore the document. Please try again.',
        }),
      )
    })

    test('in a shared folder, says only the folder owner can restore it', async () => {
      drive.restoreNodes.mockImplementation(() =>
        results({ ok: false, error: new Error('Insufficient permissions to restore') }),
      )
      const { result } = renderActions({ node: TRASHED_NODE })
      renderModals(result.current)

      await userEvent.click(screen.getByRole('button', { name: 'Take out of trash', hidden: true }))

      await waitFor(() =>
        expect(mockCreateNotification).toHaveBeenCalledWith(
          expect.objectContaining({
            text: 'Because this document was in a shared folder, only the folder owner can restore it',
          }),
        ),
      )
      expect(result.current.trashState).toBe('trashed')
    })

    test.each<DocumentRole>(['Editor', 'Viewer'])(
      'a %s gets Go to Drive alone, and restoring does nothing',
      async (role) => {
        const { result } = renderActions({ node: TRASHED_NODE, role })
        renderModals(result.current)

        expect(screen.queryByRole('button', { name: 'Take out of trash', hidden: true })).not.toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Go to Drive', hidden: true })).toBeInTheDocument()
      },
    )

    test('Go to Drive opens the Drive root in this window', async () => {
      const { result } = renderActions({ node: TRASHED_NODE })
      renderModals(result.current)

      await userEvent.click(screen.getByRole('button', { name: 'Go to Drive', hidden: true }))

      expect(assignUrl).toHaveBeenCalledWith('http://drive.localhost/u/3')
    })

    test('a role dropping from Admin takes the restore button away', () => {
      const { result, rerender } = renderActions({ node: TRASHED_NODE })
      const modals = renderModals(result.current)
      expect(screen.getByRole('button', { name: 'Take out of trash', hidden: true })).toBeInTheDocument()

      rerender({ node: TRASHED_NODE, role: 'Editor' })
      modals.rerender(<>{result.current.modals}</>)

      expect(screen.queryByRole('button', { name: 'Take out of trash', hidden: true })).not.toBeInTheDocument()
    })
  })
})

const application = {
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
} as unknown as ApplicationProviderProps['application']

function renderActions(
  options: { node?: NodeEntity; role?: DocumentRole; exportInvoker?: typeof exportInvoker | undefined } = {},
) {
  const initialProps = { node: 'node' in options ? options.node : NODE, role: options.role ?? 'Admin' }
  const editor = 'exportInvoker' in options ? options.exportInvoker : exportInvoker
  return renderHook(
    ({ node, role }: { node: NodeEntity | undefined; role: DocumentRole }) =>
      useDocumentFileActions({
        node,
        role,
        driveCompat: driveCompat as unknown as DriveCompat,
        client,
        exportInvoker: editor,
      }),
    {
      initialProps,
      wrapper: ({ children }: { children: ReactNode }) => (
        <ApplicationProvider application={application}>{children}</ApplicationProvider>
      ),
    },
  )
}

/** Clicks the trashed modal's restore button, Undo or Take out of trash */
async function restoreFromModal(actions: DocumentFileActions) {
  const { unmount } = renderModals(actions)
  await userEvent.click(screen.getByRole('button', { name: /^(Undo|Take out of trash)$/, hidden: true }))
  unmount()
}

function renderModals(actions: DocumentFileActions) {
  return render(<>{actions.modals}</>)
}
