import type { Mock, Mocked } from 'vitest'
import { Result } from '@proton/docs-shared/Result'
import type { DriveCompat } from '@proton/drive-store/lib/useDriveCompat'
import type { UnleashClient } from '@proton/unleash/UnleashClient'
import { DuplicateDocument } from './DuplicateDocument'
import type { GetDocumentMeta } from './GetDocumentMeta'
import type { SeedInitialCommit } from './SeedInitialCommit'
import { getDrive } from '@proton/drive/sdk'
import { traceErrorSDK } from '../DriveSDK/traceErrorSDK'

vi.mock('@proton/drive/sdk', async () => ({
  ...(await vi.importActual('@proton/drive/sdk')),
  getDrive: vi.fn(),
}))
vi.mock('../DriveSDK/traceErrorSDK')

const rootMeta = { volumeId: 'volume', linkId: 'root' }
const shell = { volumeId: 'volume', linkId: 'new-document', keys: {} }
const state = new Uint8Array()

describe('DuplicateDocument', () => {
  let driveCompat: Mocked<DriveCompat>
  let getDocumentMeta: Mocked<GetDocumentMeta>
  let seedInitialCommit: Mocked<SeedInitialCommit>
  const unleashClient = { isReady: () => true, isEnabled: () => false } as unknown as UnleashClient

  beforeEach(() => {
    driveCompat = {
      getMyFilesNodeMeta: vi.fn().mockResolvedValue(rootMeta),
      findAvailableNodeName: vi.fn().mockResolvedValue('name'),
      createDocumentNode: vi.fn().mockResolvedValue(shell),
    } as unknown as Mocked<DriveCompat>
    getDocumentMeta = { execute: vi.fn().mockResolvedValue(Result.ok({})) } as unknown as Mocked<GetDocumentMeta>
    seedInitialCommit = {
      execute: vi.fn().mockResolvedValue(Result.ok({})),
    } as unknown as Mocked<SeedInitialCommit>
  })

  const executePublic = (createDocumentNode?: Mock) =>
    new DuplicateDocument(
      driveCompat,
      getDocumentMeta,
      seedInitialCommit,
      unleashClient,
      createDocumentNode,
    ).executePublic('name', state, 'sheet')

  it('uses provided createDocumentNode', async () => {
    const createDocumentNode = vi.fn().mockResolvedValue(shell)

    const result = await executePublic(createDocumentNode)

    expect(result.getValue()).toBe(shell)
    expect(createDocumentNode).toHaveBeenCalledWith(rootMeta, 'name', 'sheet')
    expect(driveCompat.createDocumentNode).not.toHaveBeenCalled()
    expect(seedInitialCommit.execute).toHaveBeenCalledWith(
      { volumeId: 'volume', linkId: 'new-document' },
      state,
      shell.keys,
    )
  })

  it('falls back to drive compat createDocumentNode', async () => {
    const result = await executePublic()

    expect(result.getValue()).toBe(shell)
    expect(driveCompat.createDocumentNode).toHaveBeenCalledWith(rootMeta, 'name', 'sheet')
  })

  describe('executePrivate', () => {
    /** `driveNode` is the node Drive's SDK answers, which tells whether the document is shared directly, or its error */
    const executePrivate = (canEdit: boolean, driveNode: { membership?: object } | Error = {}) => {
      driveCompat.getNode = vi
        .fn()
        .mockResolvedValue({ name: 'Plans', volumeId: 'volume', parentNodeId: 'folder', mimeType: 'text/plain' })
      const getNode =
        driveNode instanceof Error ? vi.fn().mockRejectedValue(driveNode) : vi.fn().mockResolvedValue(driveNode)
      vi.mocked(getDrive).mockReturnValue({ getNode } as unknown as ReturnType<typeof getDrive>)
      return new DuplicateDocument(driveCompat, getDocumentMeta, seedInitialCommit, unleashClient).executePrivate(
        { volumeId: 'volume', linkId: 'document' },
        state,
        canEdit,
      )
    }

    it('creates the copy in the original folder for a user who can edit a document not shared with them directly', async () => {
      await executePrivate(true)

      expect(driveCompat.createDocumentNode).toHaveBeenCalledWith(
        { volumeId: 'volume', linkId: 'folder' },
        'name',
        'doc',
      )
    })

    it("creates the copy in My files for a viewer, who can't write to the original folder", async () => {
      await executePrivate(false)

      expect(driveCompat.createDocumentNode).toHaveBeenCalledWith(rootMeta, 'name', 'doc')
    })

    it('creates the copy in My files for an editor of a document shared with them directly', async () => {
      await executePrivate(true, { membership: {} })

      expect(driveCompat.createDocumentNode).toHaveBeenCalledWith(rootMeta, 'name', 'doc')
    })

    it("creates the copy in My files when Drive can't tell whether the document is shared directly", async () => {
      await executePrivate(true, new Error('offline'))

      expect(driveCompat.createDocumentNode).toHaveBeenCalledWith(rootMeta, 'name', 'doc')
      expect(traceErrorSDK).toHaveBeenCalled()
    })
  })
})
