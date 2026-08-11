import type { ReactNode } from 'react'
import { act, cleanup, renderHook } from '@testing-library/react'
import { MemberRole, type NodeEntity, type ProtonDriveClient } from '@proton/drive'
import type { Application } from '@proton/docs-core'
import NotificationsContext from '@proton/components/containers/notifications/notificationsContext'
import type { NotificationsManager } from '@proton/components/containers/notifications/manager'
import { ApplicationProvider } from '~/utils/application-context'
import { useRecents } from './use-recents'
import { useRecentsStore } from './use-recents-store'

jest.mock('@proton/account/addresses/hooks', () => ({
  useAddresses: () => [undefined, false],
}))

describe('useRecents', () => {
  afterEach(() => {
    cleanup()
    useRecentsStore.setState({ recentDocuments: {}, recentDocumentsInitialized: false })
  })

  test('updateRecentDocuments saves all loadable documents even if drive.iterateNodes throws while processing one of them', async () => {
    const documents = [
      { VolumeID: 'volume1', LinkID: 'link1', LastOpenTime: 1000, ContextShareID: 'share1', AncestorIDs: [] },
      { VolumeID: 'volume1', LinkID: 'link2', LastOpenTime: 2000, ContextShareID: 'share2', AncestorIDs: [] },
      { VolumeID: 'volume1', LinkID: 'link3', LastOpenTime: 3000, ContextShareID: 'share3', AncestorIDs: [] },
    ]
    const docsApi = {
      fetchRecentDocuments: jest.fn().mockResolvedValue({ getValue: () => ({ RecentDocuments: documents }) }),
    }

    const uid1 = 'volume1~link1'
    const uid2 = 'volume1~link2'
    const failingUid = 'volume1~link3'

    const drive = {
      iterateNodes: jest.fn(async function* (nodeUids: string[]) {
        for (const nodeUid of nodeUids) {
          if (nodeUid === failingUid) {
            throw new Error('Could not decrypt node')
          }
          yield createMockNode(nodeUid)
        }
      }),
    } as unknown as ProtonDriveClient

    const createNotification = jest.fn()
    const application = {
      docsApi,
      logger: { debug: jest.fn() },
    } as unknown as Application

    const { result } = renderHook(() => useRecents(drive), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <ApplicationProvider application={application}>
          <NotificationsContext.Provider value={{ createNotification } as unknown as NotificationsManager}>
            {children}
          </NotificationsContext.Provider>
        </ApplicationProvider>
      ),
    })

    await act(async () => {
      await result.current.updateRecentDocuments()
    })

    const storedDocuments = useRecentsStore.getState().recentDocuments
    expect(Object.keys(storedDocuments)).toHaveLength(2)
    expect(storedDocuments[uid1]).toBeDefined()
    expect(storedDocuments[uid2]).toBeDefined()
    expect(storedDocuments[failingUid]).toBeUndefined()
    expect(useRecentsStore.getState().recentDocumentsInitialized).toBe(true)
    expect(createNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }))
  })
})

function createMockNode(uid: string): NodeEntity {
  return {
    uid,
    name: { ok: true, value: 'Document' },
    keyAuthor: { ok: true, value: 'author@example.com' },
    directRole: MemberRole.Admin,
    ownedBy: { email: 'author@example.com' },
    mediaType: 'application/vnd.proton.doc',
    isShared: false,
  } as unknown as NodeEntity
}
