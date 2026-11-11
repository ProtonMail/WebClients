import type { DriveCompat } from '@proton/drive-store/lib/useDriveCompat'
import { getDrive } from '@proton/drive/sdk'
import { DocsApiError } from '@proton-docs/realtime-sdk'

import {
  duplicateWithState,
  getDocumentHref,
  getDriveFolderPath,
  getNewDocumentHref,
  getSpreadsheetHref,
  restoreNode,
  trashNode,
} from './documentFileActions'

jest.mock('@proton/drive/sdk', () => ({ ...jest.requireActual('@proton/drive/sdk'), getDrive: jest.fn() }))

const drive = {
  trashNodes: jest.fn(),
  restoreNodes: jest.fn(),
  getNodeHierarchy: jest.fn(),
  getAvailableName: jest.fn(),
}
const driveCompat = { getMyFilesNodeMeta: jest.fn(), createDocumentNode: jest.fn() }
const client = { seedInitialCommit: jest.fn() }
const STATE = new Uint8Array([1, 2, 3])

function duplicate(node: { uid: string; parentUid?: string }) {
  return duplicateWithState(STATE, 'Plans (copy)', {
    node,
    driveCompat: driveCompat as unknown as DriveCompat,
    client,
  })
}

async function* results(...items: ({ ok: true } | { ok: false; error: Error })[]) {
  for (const item of items) {
    yield { uid: 'VOLUME~LINK', ...item }
  }
}

describe('documentFileActions', () => {
  beforeEach(() => {
    jest.mocked(getDrive).mockReturnValue(drive as unknown as ReturnType<typeof getDrive>)
    drive.getAvailableName.mockImplementation(async (_parentUid: string, name: string) => `${name} (1)`)
    driveCompat.getMyFilesNodeMeta.mockResolvedValue({ volumeId: 'MYVOLUME', linkId: 'MYFILES' })
    driveCompat.createDocumentNode.mockResolvedValue({ volumeId: 'VOLUME', linkId: 'COPY', keys: {} })
    client.seedInitialCommit.mockResolvedValue({ commitId: 'COMMIT' })
  })
  afterEach(() => jest.clearAllMocks())

  test('getNewDocumentHref creates in the sibling folder, without a local ID too', () => {
    expect(getNewDocumentHref({ uid: 'VOLUME~LINK', parentUid: 'VOLUME~PARENT' }, undefined)).toBe(
      'http://docs.localhost/doc2?mode=create&volumeId=VOLUME&parentLinkId=PARENT',
    )
  })

  test('duplicateWithState creates a text document next to the node, under the name Drive offers, and seeds it', async () => {
    await expect(duplicate({ uid: 'VOLUME~LINK', parentUid: 'VOLUME~PARENT' })).resolves.toEqual({
      volumeId: 'VOLUME',
      linkId: 'COPY',
    })

    expect(drive.getAvailableName).toHaveBeenCalledWith('VOLUME~PARENT', 'Plans (copy)', 'file')
    expect(driveCompat.createDocumentNode).toHaveBeenCalledWith(
      { volumeId: 'VOLUME', linkId: 'PARENT' },
      'Plans (copy) (1)',
      'doc',
    )
    expect(client.seedInitialCommit).toHaveBeenCalledWith({
      nodeMeta: { volumeId: 'VOLUME', linkId: 'COPY' },
      state: STATE,
    })
  })

  test('duplicateWithState without a parent folder creates the copy in My files', async () => {
    await duplicate({ uid: 'VOLUME~LINK' })

    expect(driveCompat.createDocumentNode.mock.calls[0][0]).toEqual({ volumeId: 'MYVOLUME', linkId: 'MYFILES' })
  })

  test("duplicateWithState rejects with the SDK's seed error", async () => {
    const error = new DocsApiError('seedInitialCommit', 422, 250003)
    client.seedInitialCommit.mockRejectedValue(error)

    await expect(duplicate({ uid: 'VOLUME~LINK', parentUid: 'VOLUME~PARENT' })).rejects.toBe(error)
  })

  test('getDocumentHref opens the document in doc2', () => {
    expect(getDocumentHref({ volumeId: 'VOLUME', linkId: 'COPY' }, 3)).toBe(
      'http://docs.localhost/u/3/doc2?mode=open&volumeId=VOLUME&linkId=COPY',
    )
  })

  test('getSpreadsheetHref opens legacy sheets', () => {
    expect(getSpreadsheetHref({ volumeId: 'VOLUME', linkId: 'SHEET' }, 0)).toBe(
      'http://docs.localhost/u/0/sheet?mode=open&volumeId=VOLUME&linkId=SHEET',
    )
  })

  test("getDriveFolderPath without the root's share ID opens the Drive root", async () => {
    drive.getNodeHierarchy.mockResolvedValue([{ uid: 'VOLUME~ROOT', directRole: 'admin' }])

    await expect(getDriveFolderPath({ uid: 'VOLUME~LINK', parentUid: 'VOLUME~PARENT' })).resolves.toBe('/')
  })

  test.each([
    ['trashNode', trashNode, drive.trashNodes],
    ['restoreNode', restoreNode, drive.restoreNodes],
  ] as const)('%s resolves on success and throws a failed result', async (_name, run, sdkCall) => {
    sdkCall.mockImplementationOnce(() => results({ ok: true }))
    await expect(run('VOLUME~LINK')).resolves.toBeUndefined()
    expect(sdkCall).toHaveBeenCalledWith(['VOLUME~LINK'])

    sdkCall.mockImplementationOnce(() => results({ ok: false, error: new Error('Insufficient permissions') }))
    await expect(run('VOLUME~LINK')).rejects.toThrow('Error: Insufficient permissions; UID=VOLUME~LINK')
  })
})
