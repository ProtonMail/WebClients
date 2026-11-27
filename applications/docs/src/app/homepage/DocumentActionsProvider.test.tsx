import type { MockInstance } from 'vitest'
import { deleteDocument, reportTrashError, restoreDocument, trashDocument } from './driveSdk/trash'
import { createRecentDocument } from './test-helpers'
import { generateNodeUid, type ProtonDriveClient } from '@protontech/drive-sdk'
import { act, renderHook, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { type ReactNode, useContext } from 'react'
import { DocumentActionsProvider } from './DocumentActionsProvider'
import { DocumentActionsContext } from './documentActionsContext'
import type { ErrorTracking } from './utils/errorTracking'
import { HomepageViewContext, type HomepageViewValue } from './homepageViewContext'
import { TelemetryEvent } from './utils/telemetry'

vi.mock('./driveSdk/trash', () => ({
  trashDocument: vi.fn(),
  restoreDocument: vi.fn(),
  deleteDocument: vi.fn(),
  reportTrashError: vi.fn(),
}))

const openShareModal = vi.fn()
const openMoveItemsModal = vi.fn()

const recentDocument = createRecentDocument({ name: 'Document1' })
const nodeUid = generateNodeUid(recentDocument.volumeId, recentDocument.linkId)
const drive = {} as ProtonDriveClient
const errorTracking = {} as ErrorTracking

function renderDocumentActions() {
  const createNotification = vi.fn()
  const reportTelemetry = vi.fn()
  const updateMovedDocuments = vi.fn()
  // As the host's, an app's address on its own subdomain.
  const getAppHref = (path: string, app: string) => `https://${app.replace('proton-', '')}.proton.me${path}`

  const { result } = renderHook(() => useContext(DocumentActionsContext)!, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <HomepageViewContext.Provider
        value={
          {
            updateMovedDocuments,
            reportTelemetry,
            createNotification,
            getAppHref,
            errorTracking,
          } as unknown as HomepageViewValue
        }
      >
        <DocumentActionsProvider drive={drive} openShareModal={openShareModal} openMoveItemsModal={openMoveItemsModal}>
          {children}
        </DocumentActionsProvider>
      </HomepageViewContext.Provider>
    ),
  })

  return { result, createNotification, reportTelemetry, updateMovedDocuments }
}

function deferred() {
  let resolve!: () => void
  const promise = new Promise<void>((r) => (resolve = r))
  return { promise, resolve }
}

const unsubscribers: (() => void)[] = []

function subscribe(subscribeTo: (listener: (id: string) => void) => () => void) {
  const listener = vi.fn()
  unsubscribers.push(subscribeTo(listener))
  return listener
}

afterEach(() => {
  unsubscribers.splice(0).forEach((unsubscribe) => unsubscribe())
  vi.clearAllMocks()
})

describe('DocumentActionsProvider', () => {
  test('share opens the share modal for the document and sends telemetry', () => {
    const { result, reportTelemetry } = renderDocumentActions()

    act(() => result.current.share(recentDocument))

    expect(openShareModal).toHaveBeenCalledWith({ drive, nodeUid })
    expect(reportTelemetry).toHaveBeenCalledWith(TelemetryEvent.document_shared)
  })

  test('move opens the move modal for the document and sends telemetry', () => {
    const { result, reportTelemetry } = renderDocumentActions()

    act(() => result.current.move(recentDocument))

    expect(openMoveItemsModal).toHaveBeenCalledWith({ nodeUids: [nodeUid], onMoved: expect.any(Function) })
    expect(reportTelemetry).toHaveBeenCalledWith(TelemetryEvent.document_moved)
  })

  test('trash sets and clears currentlyTrashingId, notifies listeners and sends telemetry', async () => {
    const { result, reportTelemetry } = renderDocumentActions()
    const trashing = deferred()
    vi.mocked(trashDocument).mockReturnValue(trashing.promise)
    const listener = subscribe(result.current.subscribeToTrashed)

    let promise!: Promise<void>
    act(() => {
      promise = result.current.trash(recentDocument)
    })
    expect(result.current.currentlyTrashingId).toBe(recentDocument.uniqueId())

    trashing.resolve()
    await act(() => promise)

    expect(result.current.currentlyTrashingId).toBeUndefined()
    expect(listener).toHaveBeenCalledWith(recentDocument.uniqueId())
    expect(reportTelemetry).toHaveBeenCalledWith(TelemetryEvent.document_trashed)
    expect(trashDocument).toHaveBeenCalledWith(drive, nodeUid)
  })

  test('restore sets and clears currentlyRestoringId, notifies listeners and sends telemetry', async () => {
    const { result, reportTelemetry } = renderDocumentActions()
    const restoring = deferred()
    vi.mocked(restoreDocument).mockReturnValue(restoring.promise)
    const listener = subscribe(result.current.subscribeToRestored)

    let promise!: Promise<void>
    act(() => {
      promise = result.current.restore(recentDocument)
    })
    expect(result.current.currentlyRestoringId).toBe(recentDocument.uniqueId())

    restoring.resolve()
    await act(() => promise)

    expect(result.current.currentlyRestoringId).toBeUndefined()
    expect(listener).toHaveBeenCalledWith(recentDocument.uniqueId())
    expect(reportTelemetry).toHaveBeenCalledWith(TelemetryEvent.document_restored)
    expect(restoreDocument).toHaveBeenCalledWith(drive, nodeUid)
  })

  test('the unsubscribe function returned by subscribeTo* removes the listener', async () => {
    vi.mocked(trashDocument).mockResolvedValue(undefined)
    vi.mocked(restoreDocument).mockResolvedValue(undefined)
    const { result } = renderDocumentActions()
    const trashedListener = vi.fn()
    const restoredListener = vi.fn()
    result.current.subscribeToTrashed(trashedListener)()
    result.current.subscribeToRestored(restoredListener)()

    await act(() => result.current.trash(recentDocument))
    await act(() => result.current.restore(recentDocument))

    expect(trashedListener).not.toHaveBeenCalled()
    expect(restoredListener).not.toHaveBeenCalled()
  })

  test('move updates the moved document once the move modal reports it moved', () => {
    const { result, updateMovedDocuments } = renderDocumentActions()

    act(() => result.current.move(recentDocument))
    const [{ nodeUids, onMoved }] = openMoveItemsModal.mock.calls[0]
    onMoved({ movedUids: [nodeUid], failedItems: [], targetFolderUid: generateNodeUid('volume1', 'folder') })

    expect(nodeUids).toEqual([nodeUid])
    expect(updateMovedDocuments).toHaveBeenCalledWith([nodeUid])
  })

  test('move hands onMoved the document only once the move modal reports it moved', () => {
    const { result } = renderDocumentActions()
    const handleMoved = vi.fn()
    const targetFolderUid = generateNodeUid('volume1', 'folder')

    act(() => result.current.move(recentDocument, handleMoved))
    const [{ onMoved }] = openMoveItemsModal.mock.calls[0]
    onMoved({ movedUids: [], failedItems: [{ uid: nodeUid, error: new Error('Name conflict') }], targetFolderUid })
    expect(handleMoved).toHaveBeenLastCalledWith([])

    onMoved({ movedUids: [nodeUid], failedItems: [], targetFolderUid })
    expect(handleMoved).toHaveBeenLastCalledWith([recentDocument])
  })

  test('bulkMove opens the same move modal for the documents', () => {
    const { result } = renderDocumentActions()

    act(() => result.current.bulkMove([recentDocument]))

    expect(openMoveItemsModal).toHaveBeenCalledWith({ nodeUids: [nodeUid], onMoved: expect.any(Function) })
  })

  test('trash failure shows an error toast, sends no telemetry and notifies no listeners', async () => {
    const error = new Error('e1')
    vi.mocked(trashDocument).mockRejectedValue(error)
    const { result, createNotification, reportTelemetry } = renderDocumentActions()
    const listener = subscribe(result.current.subscribeToTrashed)

    await act(() => result.current.trash(recentDocument))

    expect(createNotification).toHaveBeenCalledWith({ type: 'error', text: 'Failed to trash document' })
    expect(reportTrashError).toHaveBeenCalledWith(errorTracking, error)
    expect(result.current.currentlyTrashingId).toBeUndefined()
    expect(reportTelemetry).not.toHaveBeenCalled()
    expect(listener).not.toHaveBeenCalled()
  })

  test('restore failure shows an error toast, sends no telemetry and notifies no listeners', async () => {
    const error = new Error('e1')
    vi.mocked(restoreDocument).mockRejectedValue(error)
    const { result, createNotification, reportTelemetry } = renderDocumentActions()
    const listener = subscribe(result.current.subscribeToRestored)

    await act(() => result.current.restore(recentDocument))

    expect(createNotification).toHaveBeenCalledWith({ type: 'error', text: 'Failed to restore document' })
    expect(reportTrashError).toHaveBeenCalledWith(errorTracking, error)
    expect(result.current.currentlyRestoringId).toBeUndefined()
    expect(reportTelemetry).not.toHaveBeenCalled()
    expect(listener).not.toHaveBeenCalled()
  })

  test('deletePermanently deletes once confirmed, shows a success toast and sends telemetry', async () => {
    vi.mocked(deleteDocument).mockResolvedValue(undefined)
    const { result, createNotification, reportTelemetry } = renderDocumentActions()

    await act(() => result.current.deletePermanently(recentDocument))

    expect(
      await screen.findByText(/Are you sure you want to permanently delete "Document1" from trash/),
    ).toBeInTheDocument()
    expect(deleteDocument).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole('button', { name: 'Delete permanently' }))

    await waitFor(() => expect(reportTelemetry).toHaveBeenCalledWith(TelemetryEvent.document_permanently_deleted))
    expect(deleteDocument).toHaveBeenCalledWith(drive, nodeUid)
    expect(createNotification).toHaveBeenCalledWith({
      type: 'success',
      text: expect.stringContaining('Document deleted permanently'),
    })
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  test('deletePermanently asks in a dialog that says it cannot be undone, with focus on its close button', async () => {
    const { result } = renderDocumentActions()

    await act(() => result.current.deletePermanently(recentDocument))

    const dialog = await screen.findByRole('dialog', { name: 'Delete permanently' })
    expect(dialog).toHaveTextContent(
      /Are you sure you want to permanently delete "Document1" from trash\?\s*You cannot undo this action\./,
    )
    await waitFor(() => expect(within(dialog).getByRole('button', { name: 'Close' })).toHaveFocus())
  })

  test.each(['Cancel', 'Close'])(
    'deletePermanently deletes nothing when the dialog is dismissed with %s',
    async (name) => {
      const { result, createNotification } = renderDocumentActions()

      await act(() => result.current.deletePermanently(recentDocument))
      await userEvent.click(await screen.findByRole('button', { name }))

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
      expect(deleteDocument).not.toHaveBeenCalled()
      expect(createNotification).not.toHaveBeenCalled()
    },
  )

  test('deletePermanently keeps the dialog open and busy until the deletion finishes', async () => {
    const deletion = deferred()
    vi.mocked(deleteDocument).mockReturnValue(deletion.promise)
    const { result } = renderDocumentActions()

    await act(() => result.current.deletePermanently(recentDocument))
    await userEvent.click(await screen.findByRole('button', { name: 'Delete permanently' }))

    // Its spinner adds "Loading" to the name, as Proton's does. A browser puts a space before it,
    // since `sr-only` positions it absolutely, but tests load no CSS.
    expect(screen.getByRole('button', { name: /^Delete permanently\s?Loading$/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
    await userEvent.keyboard('{Escape}')
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await act(async () => deletion.resolve())
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  test('deletePermanently failure shows an error toast and sends no telemetry', async () => {
    const error = new Error('e1')
    vi.mocked(deleteDocument).mockRejectedValue(error)
    const { result, createNotification, reportTelemetry } = renderDocumentActions()

    await act(() => result.current.deletePermanently(recentDocument))
    await userEvent.click(await screen.findByRole('button', { name: 'Delete permanently' }))

    await waitFor(() =>
      expect(createNotification).toHaveBeenCalledWith({ type: 'error', text: 'Failed to delete document' }),
    )
    expect(reportTrashError).toHaveBeenCalledWith(errorTracking, error)
    expect(reportTelemetry).not.toHaveBeenCalled()
  })

  describe('open', () => {
    let open: MockInstance
    beforeEach(() => (open = vi.spyOn(window, 'open').mockReturnValue(null)))
    afterEach(() => open.mockRestore())

    test('opens a spreadsheet in the spreadsheet editor, in a new tab', () => {
      const { result, reportTelemetry } = renderDocumentActions()
      const spreadsheet = createRecentDocument({ ...recentDocument.value, type: 'spreadsheet' })

      act(() => result.current.open(spreadsheet))

      expect(open).toHaveBeenCalledWith('https://docs.proton.me/sheet?mode=open&volumeId=volume1&linkId=link1')
      expect(reportTelemetry).toHaveBeenCalledWith(TelemetryEvent.document_opened)
    })

    test('reports a document opened from the trash apart from the others', () => {
      const { result, reportTelemetry } = renderDocumentActions()

      act(() => result.current.open(recentDocument, 'trash'))

      expect(open).toHaveBeenCalledWith('https://docs.proton.me/doc?mode=open&volumeId=volume1&linkId=link1')
      expect(reportTelemetry).toHaveBeenCalledWith(TelemetryEvent.document_opened_in_trash)
      expect(reportTelemetry).not.toHaveBeenCalledWith(TelemetryEvent.document_opened)
    })

    test('openParent opens the folder in Drive, not in Docs', () => {
      const { result, reportTelemetry } = renderDocumentActions()
      const inFolder = createRecentDocument({ ...recentDocument.value, parentLinkId: 'folder1' })

      act(() => result.current.openParent(inFolder))

      expect(open).toHaveBeenCalledWith('https://drive.proton.me/share1/folder/folder1')
      expect(reportTelemetry).toHaveBeenCalledWith(TelemetryEvent.document_source_opened)
    })
  })
})
