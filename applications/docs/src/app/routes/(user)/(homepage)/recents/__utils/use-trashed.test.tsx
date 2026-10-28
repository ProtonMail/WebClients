import type { NotificationsManager } from '@proton/app-context/notifications/manager'
import { NotificationsContext } from '@proton/app-context/notifications/notificationsContext'
import { type DriveEvent, DriveEventType, type NodeEntity, type ProtonDriveClient, getDrive } from '@proton/drive/sdk'
import { PROTON_DOCS_DOCUMENT_MIMETYPE, PROTON_DOCS_SPREADSHEET_MIMETYPE } from '@proton/shared/lib/helpers/mimetype'
import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { useTrashed } from './use-trashed'

jest.mock('@proton/drive/sdk', () => ({
  ...jest.requireActual('@proton/drive/sdk'),
  getDrive: jest.fn(),
}))

const doc = createNode('volume1~doc', 'Doc', PROTON_DOCS_DOCUMENT_MIMETYPE)
const sheet = createNode('volume1~sheet', 'Sheet', PROTON_DOCS_SPREADSHEET_MIMETYPE)
const image = createNode('volume1~image', 'Image', 'image/png')

describe('useTrashed', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('fetchTrashed', () => {
    test('keeps only document types', async () => {
      const { result, drive } = renderTrashed()
      drive.iterateTrashedNodes.mockImplementation(async function* () {
        yield* [doc, image, sheet]
      })

      await act(() => result.current.fetchTrashed(new AbortController().signal))

      expect(itemNames(result.current)).toEqual(['Doc', 'Sheet'])
      expect(result.current.isTrashLoading).toBe(false)
    })

    test('leaves the list unchanged on AbortError', async () => {
      const { result, drive } = renderTrashed()
      drive.iterateTrashedNodes.mockImplementationOnce(async function* () {
        yield doc
      })
      await act(() => result.current.fetchTrashed(new AbortController().signal))
      drive.iterateTrashedNodes.mockImplementationOnce(async function* () {
        yield sheet
        throw new DOMException('Aborted', 'AbortError')
      })

      await act(() => result.current.fetchTrashed(new AbortController().signal))

      expect(itemNames(result.current)).toEqual(['Doc'])
    })

    test('shows a toast and still sets the nodes loaded so far on any other error', async () => {
      const { result, drive, createNotification } = renderTrashed()
      drive.iterateTrashedNodes.mockImplementation(async function* () {
        yield doc
        throw new Error('Network error')
      })

      await act(() => result.current.fetchTrashed(new AbortController().signal))

      expect(createNotification).toHaveBeenCalledWith({
        type: 'error',
        text: 'Some trashed documents could not be loaded',
      })
      expect(itemNames(result.current)).toEqual(['Doc'])
      expect(result.current.isTrashLoading).toBe(false)
    })
  })

  describe('trashedListener', () => {
    test('node_updated with isTrashed adds the item', async () => {
      const { result, drive } = renderTrashed()
      drive.getNode.mockResolvedValue(doc)

      await act(() => result.current.trashedListener(updated(doc.uid, true)))

      expect(drive.getNode).toHaveBeenCalledWith(doc.uid)
      expect(itemNames(result.current)).toEqual(['Doc'])
    })

    test('node_updated with isTrashed updates an existing item', async () => {
      const { result, drive } = await renderLoadedTrashed([doc, sheet])
      drive.getNode.mockResolvedValue(createNode(doc.uid, 'Renamed', PROTON_DOCS_DOCUMENT_MIMETYPE))

      await act(() => result.current.trashedListener(updated(doc.uid, true)))

      expect(itemNames(result.current)).toEqual(['Renamed', 'Sheet'])
    })

    test('node_updated without isTrashed removes the item', async () => {
      const { result } = await renderLoadedTrashed([doc, sheet])

      await act(() => result.current.trashedListener(updated(doc.uid, false)))

      expect(itemNames(result.current)).toEqual(['Sheet'])
    })

    test('node_deleted removes the item', async () => {
      const { result } = await renderLoadedTrashed([doc, sheet])

      await act(() =>
        result.current.trashedListener({ type: DriveEventType.NodeDeleted, nodeUid: doc.uid } as DriveEvent),
      )

      expect(itemNames(result.current)).toEqual(['Sheet'])
    })

    test('ignores nodes that are not documents', async () => {
      const { result, drive } = renderTrashed()
      drive.getNode.mockResolvedValue(image)

      await act(() => result.current.trashedListener(updated(image.uid, true)))

      expect(result.current.trashedDocumentItems).toEqual([])
    })
  })
})

function renderTrashed() {
  const drive = { iterateTrashedNodes: jest.fn(), getNode: jest.fn() }
  jest.mocked(getDrive).mockReturnValue(drive as unknown as ProtonDriveClient)
  const createNotification = jest.fn()

  const { result } = renderHook(() => useTrashed(drive as unknown as ProtonDriveClient), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <NotificationsContext.Provider value={{ createNotification } as unknown as NotificationsManager}>
        {children}
      </NotificationsContext.Provider>
    ),
  })

  return { result, drive, createNotification }
}

async function renderLoadedTrashed(nodes: NodeEntity[]) {
  const rendered = renderTrashed()
  rendered.drive.iterateTrashedNodes.mockImplementation(async function* () {
    yield* nodes
  })
  await act(() => rendered.result.current.fetchTrashed(new AbortController().signal))
  return rendered
}

function itemNames({ trashedDocumentItems }: ReturnType<typeof useTrashed>) {
  return trashedDocumentItems.map((item) => item.name)
}

function updated(nodeUid: string, isTrashed: boolean) {
  return { type: DriveEventType.NodeUpdated, nodeUid, isTrashed } as DriveEvent
}

function createNode(uid: string, name: string, mediaType: string) {
  return {
    uid,
    name: { ok: true, value: name },
    mediaType,
    keyAuthor: { ok: true, value: 'author@example.com' },
  } as unknown as NodeEntity
}
