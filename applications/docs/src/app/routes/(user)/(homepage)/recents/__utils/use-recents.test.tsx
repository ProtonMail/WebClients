import type { NotificationsManager } from '@proton/app-context/notifications/manager'
import { NotificationsContext } from '@proton/app-context/notifications/notificationsContext'
import type { Application } from '@proton/docs-core'
import {
  type DriveEvent,
  DriveEventType,
  type NodeEntity,
  type ProtonDriveClient,
  MemberRole,
  NodeType,
  getDrive,
} from '@proton/drive/sdk'
import { act, cleanup, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { ApplicationProvider } from '~/utils/application-context'
import { getEventSubscriber } from '~/drive-sdk/event-subscriber'
import { useRecents } from './use-recents'
import { useRecentsStore } from './use-recents-store'

jest.mock('@proton/account/addresses/hooks', () => ({
  useAddresses: () => [undefined, false],
}))

jest.mock('@proton/drive/sdk', () => ({
  ...jest.requireActual('@proton/drive/sdk'),
  getDrive: jest.fn(),
}))

const DOC_MIMETYPE = 'application/vnd.proton.doc'

describe('useRecents', () => {
  afterEach(() => {
    cleanup()
    jest.restoreAllMocks()
    useRecentsStore.setState({ recentDocuments: {}, recentDocumentsInitialized: false })
  })

  describe('fetchRecentDocuments', () => {
    test('stores documents with path, ancestors and effective role', async () => {
      const nodes = createNodes([
        createNode({ uid: 'volume1~root', type: NodeType.Folder, directRole: MemberRole.Admin }),
        createNode({ uid: 'volume1~folder', parentUid: 'volume1~root', name: 'Folder', type: NodeType.Folder }),
        createNode({ uid: 'volume1~doc', parentUid: 'volume1~folder', name: 'Doc', directRole: MemberRole.Viewer }),
      ])
      const { result, createNotification } = renderRecents({
        documents: [createApiDocument('doc', ['folder', 'root'], 1000)],
        nodes,
      })

      await act(() => result.current.fetchRecentDocuments(new AbortController().signal))

      const document = useRecentsStore.getState().recentDocuments['volume1~doc']
      expect(document).toMatchObject({
        type: 'document',
        name: 'Doc',
        volumeId: 'volume1',
        linkId: 'doc',
        parentLinkId: 'folder',
        createdBy: 'author@example.com',
        location: { type: 'path', path: ['Folder'] },
        ancestorsNodeUids: ['volume1~folder', 'volume1~root'],
        isSharedWithMe: false,
        shareId: 'share-doc',
        effectiveRole: MemberRole.Admin,
      })
      expect(document.lastViewed.serverTimestamp).toBe(1000)
      expect(result.current.recentDocuments).toEqual({ 'volume1~doc': document })
      expect(result.current.recentDocumentsInitialized).toBe(true)
      expect(result.current.isRecentsUpdating).toBe(false)
      expect(createNotification).not.toHaveBeenCalled()
    })

    test('stores document directly in root folder with root location', async () => {
      const { result } = await renderLoadedRecents([
        createNode({ uid: 'volume1~root', type: NodeType.Folder }),
        createNode({ uid: 'volume1~doc', parentUid: 'volume1~root' }),
      ])

      expect(result.current.recentDocuments['volume1~doc'].location).toEqual({ type: 'root' })
    })

    test('subscribes to events of documents shared with me', async () => {
      const subscribeToSharedDocument = jest.spyOn(getEventSubscriber(), 'subscribeToSharedDocument')
      const nodes = createNodes([
        createNode({ uid: 'volume1~doc', membership: {}, treeEventScopeId: 'scope1', directRole: MemberRole.Editor }),
      ])
      const { result } = renderRecents({ documents: [createApiDocument('doc')], nodes })

      await act(() => result.current.fetchRecentDocuments(new AbortController().signal))

      expect(useRecentsStore.getState().recentDocuments['volume1~doc']).toMatchObject({
        isSharedWithMe: true,
        location: { type: 'shared-with-me' },
        effectiveRole: MemberRole.Editor,
      })
      expect(subscribeToSharedDocument).toHaveBeenCalledWith('volume1~doc', 'scope1')
    })

    test('skips documents with missing node or missing ancestor and notifies', async () => {
      const nodes = createNodes([
        createNode({ uid: 'volume1~doc1' }),
        createNode({ uid: 'volume1~doc3', parentUid: 'volume1~missingFolder' }),
      ])
      const { result, createNotification } = renderRecents({
        documents: [createApiDocument('doc1'), createApiDocument('doc2'), createApiDocument('doc3', ['missingFolder'])],
        nodes,
      })

      await act(() => result.current.fetchRecentDocuments(new AbortController().signal))

      expect(Object.keys(useRecentsStore.getState().recentDocuments)).toEqual(['volume1~doc1'])
      expect(useRecentsStore.getState().recentDocumentsInitialized).toBe(true)
      expect(createNotification).toHaveBeenCalledWith({ type: 'error', text: 'Some documents could not be loaded' })
    })

    test('saves all loadable documents even if drive.iterateNodes throws while processing one of them', async () => {
      const nodes = createNodes([createNode({ uid: 'volume1~link1' }), createNode({ uid: 'volume1~link2' })])
      const { result, drive, createNotification } = renderRecents({
        documents: [createApiDocument('link1'), createApiDocument('link2'), createApiDocument('link3')],
        nodes,
      })
      drive.iterateNodes.mockImplementation(async function* (nodeUids: string[]) {
        for (const nodeUid of nodeUids) {
          if (nodeUid === 'volume1~link3') {
            throw new Error('Could not decrypt node')
          }
          yield nodes.get(nodeUid) as NodeEntity
        }
      })

      await act(() => result.current.fetchRecentDocuments(new AbortController().signal))

      expect(Object.keys(useRecentsStore.getState().recentDocuments)).toEqual(['volume1~link1', 'volume1~link2'])
      expect(useRecentsStore.getState().recentDocumentsInitialized).toBe(true)
      expect(createNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }))
    })

    test('notifies and does not initialize when fetching recents fails', async () => {
      const { result, docsApi, createNotification } = renderRecents({ documents: [], nodes: createNodes([]) })
      docsApi.fetchRecentDocuments.mockRejectedValue(new Error('Network error'))

      await act(() => result.current.fetchRecentDocuments(new AbortController().signal))

      expect(useRecentsStore.getState().recentDocumentsInitialized).toBe(false)
      expect(createNotification).toHaveBeenCalledWith({ type: 'error', text: 'Failed to load recent documents' })
    })

    test('ignores abort errors', async () => {
      const { result, drive, createNotification } = renderRecents({
        documents: [createApiDocument('doc')],
        nodes: createNodes([createNode({ uid: 'volume1~doc' })]),
      })
      drive.iterateNodes.mockImplementation(async function* () {
        throw new DOMException('Aborted', 'AbortError')
      })

      await act(() => result.current.fetchRecentDocuments(new AbortController().signal))

      expect(useRecentsStore.getState().recentDocumentsInitialized).toBe(false)
      expect(createNotification).not.toHaveBeenCalled()
    })
  })

  test('updateRenamedDocumentInCache renames cached document', async () => {
    const { result } = await renderLoadedRecents([createNode({ uid: 'volume1~doc', name: 'Old' })])

    await act(() => result.current.updateRenamedDocumentInCache('volume1-doc', 'New'))

    expect(result.current.recentDocuments['volume1~doc'].name).toBe('New')
  })

  describe('recentsListener', () => {
    test('removes deleted document', async () => {
      const { result } = await renderLoadedRecents([createNode({ uid: 'volume1~doc' })])

      await act(() =>
        result.current.recentsListener(createEvent({ type: DriveEventType.NodeDeleted, nodeUid: 'volume1~doc' })),
      )

      expect(result.current.recentDocuments).toEqual({})
    })

    test('removes trashed document', async () => {
      const { result } = await renderLoadedRecents([createNode({ uid: 'volume1~doc' })])

      await act(() =>
        result.current.recentsListener(
          createEvent({ type: DriveEventType.NodeUpdated, nodeUid: 'volume1~doc', isTrashed: true }),
        ),
      )

      expect(result.current.recentDocuments).toEqual({})
    })

    test('removes children of trashed folder', async () => {
      const { result } = await renderLoadedRecents([
        createNode({ uid: 'volume1~root', type: NodeType.Folder }),
        createNode({ uid: 'volume1~folder', parentUid: 'volume1~root', type: NodeType.Folder }),
        createNode({ uid: 'volume1~inside', parentUid: 'volume1~folder' }),
        createNode({ uid: 'volume1~outside', parentUid: 'volume1~root' }),
        createNode({ uid: 'volume1~orphan' }),
      ])

      await act(() =>
        result.current.recentsListener(
          createEvent({ type: DriveEventType.NodeUpdated, nodeUid: 'volume1~folder', isTrashed: true }),
        ),
      )

      expect(Object.keys(result.current.recentDocuments)).toEqual(['volume1~outside', 'volume1~orphan'])
    })

    test('reloads updated document keeping its last viewed time', async () => {
      const { result, nodes } = await renderLoadedRecents([createNode({ uid: 'volume1~doc', name: 'Old' })])
      nodes.set('volume1~doc', createNode({ uid: 'volume1~doc', name: 'New' }))

      await act(() =>
        result.current.recentsListener(
          createEvent({ type: DriveEventType.NodeUpdated, nodeUid: 'volume1~doc', isTrashed: false }),
        ),
      )

      const document = result.current.recentDocuments['volume1~doc']
      expect(document.name).toBe('New')
      expect(document.lastViewed.serverTimestamp).toBe(1000)
      expect(document.shareId).toBe('share-doc')
    })

    test('ignores updated document that is not in recents', async () => {
      const { result, nodes, drive } = await renderLoadedRecents([createNode({ uid: 'volume1~doc' })])
      nodes.set('volume1~other', createNode({ uid: 'volume1~other' }))
      const before = result.current.recentDocuments

      await act(() =>
        result.current.recentsListener(
          createEvent({ type: DriveEventType.NodeUpdated, nodeUid: 'volume1~other', isTrashed: false }),
        ),
      )

      expect(drive.getNodeHierarchy).not.toHaveBeenCalled()
      expect(result.current.recentDocuments).toBe(before)
    })

    test('does not restore document deleted while its update is loading', async () => {
      const { result, drive } = await renderLoadedRecents([createNode({ uid: 'volume1~doc' })])

      await deleteWhileUpdateIsLoading({ result, drive, updatedNodeUid: 'volume1~doc', deletedNodeUid: 'volume1~doc' })

      expect(Object.keys(result.current.recentDocuments)).toEqual([])
    })

    test('does not restore document deleted while its folder update is loading', async () => {
      const { result, drive } = await renderLoadedRecents([
        createNode({ uid: 'volume1~root', type: NodeType.Folder }),
        createNode({ uid: 'volume1~folder', parentUid: 'volume1~root', type: NodeType.Folder }),
        createNode({ uid: 'volume1~doc', parentUid: 'volume1~folder' }),
      ])

      await deleteWhileUpdateIsLoading({
        result,
        drive,
        updatedNodeUid: 'volume1~folder',
        deletedNodeUid: 'volume1~doc',
      })

      expect(Object.keys(result.current.recentDocuments)).toEqual([])
    })

    test('reloads children of updated folder', async () => {
      const { result, nodes } = await renderLoadedRecents([
        createNode({ uid: 'volume1~root', type: NodeType.Folder }),
        createNode({ uid: 'volume1~folder', parentUid: 'volume1~root', name: 'Old', type: NodeType.Folder }),
        createNode({ uid: 'volume1~doc', parentUid: 'volume1~folder' }),
      ])
      nodes.set(
        'volume1~folder',
        createNode({ uid: 'volume1~folder', parentUid: 'volume1~root', name: 'New', type: NodeType.Folder }),
      )

      await act(() =>
        result.current.recentsListener(
          createEvent({ type: DriveEventType.NodeUpdated, nodeUid: 'volume1~folder', isTrashed: false }),
        ),
      )

      expect(result.current.recentDocuments['volume1~doc']).toMatchObject({
        location: { type: 'path', path: ['New'] },
        ancestorsNodeUids: ['volume1~folder', 'volume1~root'],
      })
    })

    test('reloads children of updated folder even if one of them fails to load', async () => {
      const { result, nodes, drive } = await renderLoadedRecents([
        createNode({ uid: 'volume1~root', type: NodeType.Folder }),
        createNode({ uid: 'volume1~folder', parentUid: 'volume1~root', name: 'Old', type: NodeType.Folder }),
        createNode({ uid: 'volume1~failing', parentUid: 'volume1~folder' }),
        createNode({ uid: 'volume1~doc', parentUid: 'volume1~folder' }),
      ])
      nodes.set(
        'volume1~folder',
        createNode({ uid: 'volume1~folder', parentUid: 'volume1~root', name: 'New', type: NodeType.Folder }),
      )
      const getNodeHierarchy = drive.getNodeHierarchy.getMockImplementation()!
      drive.getNodeHierarchy.mockImplementation(async (nodeUid) => {
        if (nodeUid === 'volume1~failing') {
          throw new Error('Could not decrypt node')
        }
        return getNodeHierarchy(nodeUid)
      })

      await act(() =>
        result.current.recentsListener(
          createEvent({ type: DriveEventType.NodeUpdated, nodeUid: 'volume1~folder', isTrashed: false }),
        ),
      )

      expect(result.current.recentDocuments['volume1~doc'].location).toEqual({ type: 'path', path: ['New'] })
      expect(result.current.recentDocuments['volume1~failing'].location).toEqual({ type: 'path', path: ['Old'] })
    })

    test('keeps documents outside of updated folder', async () => {
      const { result } = await renderLoadedRecents([
        createNode({ uid: 'volume1~root', type: NodeType.Folder }),
        createNode({ uid: 'volume1~folder', parentUid: 'volume1~root', type: NodeType.Folder }),
        createNode({ uid: 'volume1~inside', parentUid: 'volume1~folder' }),
        createNode({ uid: 'volume1~outside', parentUid: 'volume1~root' }),
      ])

      await act(() =>
        result.current.recentsListener(
          createEvent({ type: DriveEventType.NodeUpdated, nodeUid: 'volume1~folder', isTrashed: false }),
        ),
      )

      expect(Object.keys(result.current.recentDocuments)).toEqual(['volume1~inside', 'volume1~outside'])
    })
  })
})

function renderRecents({ documents, nodes }: { documents: ApiDocument[]; nodes: Map<string, NodeEntity> }) {
  const docsApi = {
    fetchRecentDocuments: jest.fn().mockResolvedValue({ getValue: () => ({ RecentDocuments: documents }) }),
  }
  const drive = createFakeDrive(nodes)
  jest.mocked(getDrive).mockReturnValue(drive as unknown as ProtonDriveClient)

  const createNotification = jest.fn()
  const application = { docsApi, logger: { debug: jest.fn() } } as unknown as Application

  const { result } = renderHook(() => useRecents(drive as unknown as ProtonDriveClient), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <ApplicationProvider application={application}>
        <NotificationsContext.Provider value={{ createNotification } as unknown as NotificationsManager}>
          {children}
        </NotificationsContext.Provider>
      </ApplicationProvider>
    ),
  })

  return { result, drive, docsApi, createNotification }
}

/**
 * Renders hook and loads every non-folder node as recent document
 */
async function renderLoadedRecents(nodeList: NodeEntity[]) {
  const nodes = createNodes(nodeList)
  const documents = nodeList
    .filter((node) => node.type !== NodeType.Folder)
    .map((node) => createApiDocument(node.uid.split('~')[1], getAncestorLinkIds(nodes, node)))
  const rendered = renderRecents({ documents, nodes })

  await act(() => rendered.result.current.fetchRecentDocuments(new AbortController().signal))

  return { ...rendered, nodes }
}

async function deleteWhileUpdateIsLoading({
  result,
  drive,
  updatedNodeUid,
  deletedNodeUid,
}: Pick<ReturnType<typeof renderRecents>, 'result' | 'drive'> & { updatedNodeUid: string; deletedNodeUid: string }) {
  const getNodeHierarchy = drive.getNodeHierarchy.getMockImplementation()!
  let release = () => {}
  const released = new Promise<void>((resolve) => (release = resolve))
  const requested = new Promise<void>((resolve) =>
    drive.getNodeHierarchy.mockImplementationOnce(async (nodeUid) => {
      resolve()
      await released
      return getNodeHierarchy(nodeUid)
    }),
  )

  await act(async () => {
    const update = result.current.recentsListener(
      createEvent({ type: DriveEventType.NodeUpdated, nodeUid: updatedNodeUid, isTrashed: false }),
    )
    await requested
    await result.current.recentsListener(createEvent({ type: DriveEventType.NodeDeleted, nodeUid: deletedNodeUid }))
    release()
    await update
  })
}

function createFakeDrive(nodes: Map<string, NodeEntity>) {
  return {
    iterateNodes: jest.fn(async function* (nodeUids: string[]) {
      for (const nodeUid of nodeUids) {
        yield nodes.get(nodeUid) ?? { missingUid: nodeUid }
      }
    }),
    getNode: jest.fn(async (nodeUid: string) => nodes.get(nodeUid)),
    getNodeHierarchy: jest.fn(async (nodeUid: string) => {
      const node = nodes.get(nodeUid) as NodeEntity
      return [...getAncestors(nodes, node).toReversed(), node]
    }),
  }
}

/**
 * Most immediate parent first, root last
 */
function getAncestors(nodes: Map<string, NodeEntity>, node: NodeEntity): NodeEntity[] {
  const parent = node.parentUid ? nodes.get(node.parentUid) : undefined
  return parent ? [parent, ...getAncestors(nodes, parent)] : []
}

function getAncestorLinkIds(nodes: Map<string, NodeEntity>, node: NodeEntity) {
  return getAncestors(nodes, node).map(({ uid }) => uid.split('~')[1])
}

function createNodes(nodeList: NodeEntity[]) {
  return new Map(nodeList.map((node) => [node.uid, node]))
}

type ApiDocument = ReturnType<typeof createApiDocument>

function createApiDocument(linkId: string, ancestorIds: string[] = [], lastOpenTime = 1000) {
  return {
    VolumeID: 'volume1',
    LinkID: linkId,
    LastOpenTime: lastOpenTime,
    ContextShareID: `share-${linkId}`,
    AncestorIDs: ancestorIds,
  }
}

function createNode({
  uid,
  parentUid,
  name = 'Document',
  type = NodeType.File,
  directRole = MemberRole.Admin,
  membership,
  treeEventScopeId = 'scope',
}: {
  uid: string
  parentUid?: string
  name?: string
  type?: NodeType
  directRole?: MemberRole
  membership?: object
  treeEventScopeId?: string
}): NodeEntity {
  return {
    uid,
    parentUid,
    type,
    name: { ok: true, value: name },
    keyAuthor: { ok: true, value: 'author@example.com' },
    directRole,
    membership,
    treeEventScopeId,
    mediaType: type === NodeType.Folder ? undefined : DOC_MIMETYPE,
  } as unknown as NodeEntity
}

function createEvent(event: Partial<DriveEvent>) {
  return event as DriveEvent
}
