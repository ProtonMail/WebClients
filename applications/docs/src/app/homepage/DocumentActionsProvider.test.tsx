import { deleteDocument, reportTrashError, restoreDocument, trashDocument } from './driveSdk/trash'
import { RecentDocumentsItem } from './recentDocumentsItem'
import { ServerTime } from './utils/serverTime'
import { generateNodeUid, type ProtonDriveClient } from '@protontech/drive-sdk'
import { act, renderHook, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { type ReactNode, useContext } from 'react'
import { DocumentActionsProvider } from './DocumentActionsProvider'
import { DocumentActionsContext } from './documentActionsContext'
import type { ErrorTracking } from './utils/errorTracking'
import { HomepageViewContext, type HomepageViewValue } from './homepageViewContext'
import { TelemetryEvent } from './utils/telemetry'

jest.mock('./driveSdk/trash', () => ({
  trashDocument: jest.fn(),
  restoreDocument: jest.fn(),
  deleteDocument: jest.fn(),
  reportTrashError: jest.fn(),
}))

const openShareModal = jest.fn()
const openMoveItemsModal = jest.fn()

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
const nodeUid = generateNodeUid(recentDocument.volumeId, recentDocument.linkId)
const drive = {} as ProtonDriveClient
const errorTracking = {} as ErrorTracking

function renderDocumentActions() {
  const createNotification = jest.fn()
  const reportTelemetry = jest.fn()
  const updateMovedDocuments = jest.fn()
  const getAppHref = (path: string) => path

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
  const listener = jest.fn()
  unsubscribers.push(subscribeTo(listener))
  return listener
}

afterEach(() => {
  unsubscribers.splice(0).forEach((unsubscribe) => unsubscribe())
  jest.clearAllMocks()
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
    jest.mocked(trashDocument).mockReturnValue(trashing.promise)
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
    jest.mocked(restoreDocument).mockReturnValue(restoring.promise)
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
    jest.mocked(trashDocument).mockResolvedValue(undefined)
    jest.mocked(restoreDocument).mockResolvedValue(undefined)
    const { result } = renderDocumentActions()
    const trashedListener = jest.fn()
    const restoredListener = jest.fn()
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

  test('bulkMove opens the same move modal for the documents', () => {
    const { result } = renderDocumentActions()

    act(() => result.current.bulkMove([recentDocument]))

    expect(openMoveItemsModal).toHaveBeenCalledWith({ nodeUids: [nodeUid], onMoved: expect.any(Function) })
  })

  test('trash failure shows an error toast, sends no telemetry and notifies no listeners', async () => {
    const error = new Error('e1')
    jest.mocked(trashDocument).mockRejectedValue(error)
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
    jest.mocked(restoreDocument).mockRejectedValue(error)
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
    jest.mocked(deleteDocument).mockResolvedValue(undefined)
    const { result, createNotification, reportTelemetry } = renderDocumentActions()

    await act(() => result.current.deletePermanently(recentDocument))

    expect(
      await screen.findByText(/Are you sure you want to permanently delete "Document1" from trash/),
    ).toBeInTheDocument()
    expect(deleteDocument).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole('button', { name: 'Delete permanently', hidden: true }))

    await waitFor(() => expect(reportTelemetry).toHaveBeenCalledWith(TelemetryEvent.document_permanently_deleted))
    expect(deleteDocument).toHaveBeenCalledWith(drive, nodeUid)
    expect(createNotification).toHaveBeenCalledWith({
      type: 'success',
      text: expect.stringContaining('Document deleted permanently'),
    })
  })

  test('deletePermanently failure shows an error toast and sends no telemetry', async () => {
    const error = new Error('e1')
    jest.mocked(deleteDocument).mockRejectedValue(error)
    const { result, createNotification, reportTelemetry } = renderDocumentActions()

    await act(() => result.current.deletePermanently(recentDocument))
    await userEvent.click(await screen.findByRole('button', { name: 'Delete permanently', hidden: true }))

    await waitFor(() =>
      expect(createNotification).toHaveBeenCalledWith({ type: 'error', text: 'Failed to delete document' }),
    )
    expect(reportTrashError).toHaveBeenCalledWith(errorTracking, error)
    expect(reportTelemetry).not.toHaveBeenCalled()
  })
})
