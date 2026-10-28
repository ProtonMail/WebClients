import type { NotificationsManager } from '@proton/app-context/notifications/manager'
import { NotificationsContext } from '@proton/app-context/notifications/notificationsContext'
import AuthenticationContext from '@proton/components/containers/authentication/authenticationContext'
import type { Application } from '@proton/docs-core/Application/Application'
import { deleteDocument, reportTrashError, restoreDocument, trashDocument } from '@proton/docs-core/DriveSDK/trash'
import { RecentDocumentsItem } from '@proton/docs-core/Services/recent-documents'
import { ServerTime } from '@proton/docs-shared/ServerTime'
import { generateNodeUid } from '@proton/drive/sdk'
import { TelemetryDocsHomepageEvents } from '@proton/shared/lib/api/telemetry'
import { traceError } from '@proton/shared/lib/helpers/sentry'
import { act, renderHook, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { ApplicationProvider } from '~/utils/application-context'
import { DocumentActionsProvider, useDocumentActions } from './document-actions'

jest.mock('@proton/docs-core/DriveSDK/trash', () => ({
  trashDocument: jest.fn(),
  restoreDocument: jest.fn(),
  deleteDocument: jest.fn(),
  reportTrashError: jest.fn(),
}))

jest.mock('@proton/drive/sdk', () => ({
  ...jest.requireActual('@proton/drive/sdk'),
  getDrive: jest.fn(),
}))

jest.mock('@proton/shared/lib/helpers/sentry', () => ({
  ...jest.requireActual('@proton/shared/lib/helpers/sentry'),
  traceError: jest.fn(),
}))

let mockTrashWithSDK = true
jest.mock('~/utils/flags', () => ({
  ...jest.requireActual('~/utils/flags'),
  useTrashWithSDK: () => mockTrashWithSDK,
  useMoveModalDriveSdkEnabled: () => false,
}))

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

function renderDocumentActions() {
  const createNotification = jest.fn()
  const reportHomepageTelemetry = jest.fn()
  const recentDocumentsService = {
    trashDocument: jest.fn().mockResolvedValue(undefined),
    restoreDocument: jest.fn().mockResolvedValue(undefined),
    deleteDocumentPermanently: jest.fn().mockResolvedValue(undefined),
  }
  const application = {
    compatWrapper: { getUserCompat: () => ({}) },
    metrics: { reportHomepageTelemetry },
    recentDocumentsService,
  } as unknown as Application

  const { result } = renderHook(() => useDocumentActions(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <AuthenticationContext.Provider value={{ getLocalID: () => undefined } as any}>
        <ApplicationProvider application={application}>
          <NotificationsContext.Provider value={{ createNotification } as unknown as NotificationsManager}>
            <DocumentActionsProvider>{children}</DocumentActionsProvider>
          </NotificationsContext.Provider>
        </ApplicationProvider>
      </AuthenticationContext.Provider>
    ),
  })

  return { result, createNotification, reportHomepageTelemetry, recentDocumentsService }
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

describe.each([true, false])('DocumentActionsProvider with useTrashWithSDK %s', (trashWithSDK) => {
  beforeEach(() => {
    mockTrashWithSDK = trashWithSDK
  })

  test('trash sets and clears currentlyTrashingId, notifies listeners and sends telemetry', async () => {
    const { result, reportHomepageTelemetry, recentDocumentsService } = renderDocumentActions()
    const trashing = deferred()
    jest.mocked(trashDocument).mockReturnValue(trashing.promise)
    recentDocumentsService.trashDocument.mockReturnValue(trashing.promise)
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
    expect(reportHomepageTelemetry).toHaveBeenCalledWith(TelemetryDocsHomepageEvents.document_trashed)
    if (trashWithSDK) {
      expect(trashDocument).toHaveBeenCalledWith(nodeUid)
      expect(recentDocumentsService.trashDocument).not.toHaveBeenCalled()
    } else {
      expect(recentDocumentsService.trashDocument).toHaveBeenCalledWith(recentDocument)
      expect(trashDocument).not.toHaveBeenCalled()
    }
  })

  test('restore sets and clears currentlyRestoringId, notifies listeners and sends telemetry', async () => {
    const { result, reportHomepageTelemetry, recentDocumentsService } = renderDocumentActions()
    const restoring = deferred()
    jest.mocked(restoreDocument).mockReturnValue(restoring.promise)
    recentDocumentsService.restoreDocument.mockReturnValue(restoring.promise)
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
    expect(reportHomepageTelemetry).toHaveBeenCalledWith(TelemetryDocsHomepageEvents.document_restored)
    if (trashWithSDK) {
      expect(restoreDocument).toHaveBeenCalledWith(nodeUid)
      expect(recentDocumentsService.restoreDocument).not.toHaveBeenCalled()
    } else {
      expect(recentDocumentsService.restoreDocument).toHaveBeenCalledWith(recentDocument)
      expect(restoreDocument).not.toHaveBeenCalled()
    }
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
})

describe('DocumentActionsProvider with the Drive SDK', () => {
  beforeEach(() => {
    mockTrashWithSDK = true
  })

  test('trash failure shows an error toast, sends no telemetry and notifies no listeners', async () => {
    const error = new Error('e1')
    jest.mocked(trashDocument).mockRejectedValue(error)
    const { result, createNotification, reportHomepageTelemetry } = renderDocumentActions()
    const listener = subscribe(result.current.subscribeToTrashed)

    await act(() => result.current.trash(recentDocument))

    expect(createNotification).toHaveBeenCalledWith({ type: 'error', text: 'Failed to trash document' })
    expect(reportTrashError).toHaveBeenCalledWith(error)
    expect(result.current.currentlyTrashingId).toBeUndefined()
    expect(reportHomepageTelemetry).not.toHaveBeenCalled()
    expect(listener).not.toHaveBeenCalled()
  })

  test('restore failure shows an error toast, sends no telemetry and notifies no listeners', async () => {
    const error = new Error('e1')
    jest.mocked(restoreDocument).mockRejectedValue(error)
    const { result, createNotification, reportHomepageTelemetry } = renderDocumentActions()
    const listener = subscribe(result.current.subscribeToRestored)

    await act(() => result.current.restore(recentDocument))

    expect(createNotification).toHaveBeenCalledWith({ type: 'error', text: 'Failed to restore document' })
    expect(reportTrashError).toHaveBeenCalledWith(error)
    expect(result.current.currentlyRestoringId).toBeUndefined()
    expect(reportHomepageTelemetry).not.toHaveBeenCalled()
    expect(listener).not.toHaveBeenCalled()
  })

  test('deletePermanently deletes once confirmed, shows a success toast and sends telemetry', async () => {
    jest.mocked(deleteDocument).mockResolvedValue(undefined)
    const { result, createNotification, reportHomepageTelemetry, recentDocumentsService } = renderDocumentActions()

    await act(() => result.current.deletePermanently(recentDocument))

    expect(
      await screen.findByText(/Are you sure you want to permanently delete "Document1" from trash/),
    ).toBeInTheDocument()
    expect(deleteDocument).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole('button', { name: 'Delete permanently', hidden: true }))

    await waitFor(() =>
      expect(reportHomepageTelemetry).toHaveBeenCalledWith(TelemetryDocsHomepageEvents.document_permanently_deleted),
    )
    expect(deleteDocument).toHaveBeenCalledWith(nodeUid)
    expect(createNotification).toHaveBeenCalledWith({
      type: 'success',
      text: expect.stringContaining('Document deleted permanently'),
    })
    expect(recentDocumentsService.deleteDocumentPermanently).not.toHaveBeenCalled()
  })

  test('deletePermanently failure shows an error toast and sends no telemetry', async () => {
    const error = new Error('e1')
    jest.mocked(deleteDocument).mockRejectedValue(error)
    const { result, createNotification, reportHomepageTelemetry } = renderDocumentActions()

    await act(() => result.current.deletePermanently(recentDocument))
    await userEvent.click(await screen.findByRole('button', { name: 'Delete permanently', hidden: true }))

    await waitFor(() =>
      expect(createNotification).toHaveBeenCalledWith({ type: 'error', text: 'Failed to delete document' }),
    )
    expect(reportTrashError).toHaveBeenCalledWith(error)
    expect(reportHomepageTelemetry).not.toHaveBeenCalled()
  })
})

describe('DocumentActionsProvider with recentDocumentsService', () => {
  beforeEach(() => {
    mockTrashWithSDK = false
  })

  test('trash failure shows an error toast, sends no telemetry and notifies no listeners', async () => {
    const error = new Error('e1')
    const { result, createNotification, reportHomepageTelemetry, recentDocumentsService } = renderDocumentActions()
    recentDocumentsService.trashDocument.mockRejectedValue(error)
    const listener = subscribe(result.current.subscribeToTrashed)

    await act(() => result.current.trash(recentDocument))

    expect(createNotification).toHaveBeenCalledWith({ type: 'error', text: 'Failed to trash document' })
    expect(traceError).toHaveBeenCalledWith(error)
    expect(result.current.currentlyTrashingId).toBeUndefined()
    expect(reportHomepageTelemetry).not.toHaveBeenCalled()
    expect(listener).not.toHaveBeenCalled()
  })

  test('restore failure shows an error toast, sends no telemetry and notifies no listeners', async () => {
    const error = new Error('e1')
    const { result, createNotification, reportHomepageTelemetry, recentDocumentsService } = renderDocumentActions()
    recentDocumentsService.restoreDocument.mockRejectedValue(error)
    const listener = subscribe(result.current.subscribeToRestored)

    await act(() => result.current.restore(recentDocument))

    expect(createNotification).toHaveBeenCalledWith({ type: 'error', text: 'Failed to restore document' })
    expect(traceError).toHaveBeenCalledWith(error)
    expect(result.current.currentlyRestoringId).toBeUndefined()
    expect(reportHomepageTelemetry).not.toHaveBeenCalled()
    expect(listener).not.toHaveBeenCalled()
  })

  test('deletePermanently calls recentDocumentsService.deleteDocumentPermanently without a confirm modal', async () => {
    const { result, reportHomepageTelemetry, recentDocumentsService } = renderDocumentActions()

    await act(() => result.current.deletePermanently(recentDocument))

    expect(recentDocumentsService.deleteDocumentPermanently).toHaveBeenCalledWith(recentDocument)
    expect(reportHomepageTelemetry).toHaveBeenCalledWith(TelemetryDocsHomepageEvents.document_permanently_deleted)
    expect(screen.queryByRole('button', { name: 'Delete permanently', hidden: true })).not.toBeInTheDocument()
    expect(deleteDocument).not.toHaveBeenCalled()
  })
})
