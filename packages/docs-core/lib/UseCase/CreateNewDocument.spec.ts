import type { Mock, Mocked } from 'vitest'
import { Result } from '@proton/docs-shared/Result'
import type { DecryptedNode } from '@proton/docs-shared/DecryptedNode'
import type { DriveCompat } from '@proton/drive-store/lib/useDriveCompat'
import type { UnleashClient } from '@proton/unleash/UnleashClient'
import { getDrive } from '@proton/drive/sdk'
import { CreateNewDocument } from './CreateNewDocument'
import type { GetDocumentMeta } from './GetDocumentMeta'

vi.mock('@proton/drive/sdk', async () => ({
  ...(await vi.importActual('@proton/drive/sdk')),
  getDrive: vi.fn(),
}))
vi.mock('../DriveSDK/traceErrorSDK')

const parentMeta = { volumeId: 'volume', linkId: 'parent' }
const shell = { ...parentMeta, linkId: 'new-document', keys: {} }
const myFilesMeta = { volumeId: 'my-volume', linkId: 'my-files' }

describe('CreateNewDocument', () => {
  let driveCompat: Mocked<DriveCompat>
  let getDocumentMeta: Mocked<GetDocumentMeta>
  const unleashClient = { isReady: () => true, isEnabled: () => false } as unknown as UnleashClient

  beforeEach(() => {
    driveCompat = {
      findAvailableNodeName: vi.fn().mockResolvedValue('name'),
      createDocumentNode: vi.fn().mockResolvedValue(shell),
      getMyFilesNodeMeta: vi.fn().mockResolvedValue(myFilesMeta),
    } as unknown as Mocked<DriveCompat>
    getDocumentMeta = { execute: vi.fn().mockResolvedValue(Result.ok({})) } as unknown as Mocked<GetDocumentMeta>
  })

  /** `driveNode` is the node Drive's SDK answers, which tells whether the sibling is shared directly, or its error */
  const execute = (createDocumentNode?: Mock, canEdit = true, driveNode: { membership?: object } | Error = {}) => {
    const getNode =
      driveNode instanceof Error ? vi.fn().mockRejectedValue(driveNode) : vi.fn().mockResolvedValue(driveNode)
    vi.mocked(getDrive).mockReturnValue({ getNode } as unknown as ReturnType<typeof getDrive>)
    return new CreateNewDocument(driveCompat, getDocumentMeta, unleashClient, createDocumentNode).execute(
      'name',
      parentMeta,
      { parentNodeId: 'parent' } as DecryptedNode,
      'sheet',
      canEdit,
    )
  }

  it('uses provided createDocumentNode', async () => {
    const createDocumentNode = vi.fn().mockResolvedValue(shell)

    const result = await execute(createDocumentNode)

    expect(result.getValue()).toBe(shell)
    expect(createDocumentNode).toHaveBeenCalledWith(parentMeta, 'name', 'sheet')
    expect(driveCompat.createDocumentNode).not.toHaveBeenCalled()
  })

  it('falls back to drive compat createDocumentNode', async () => {
    const result = await execute()

    expect(result.getValue()).toBe(shell)
    expect(driveCompat.createDocumentNode).toHaveBeenCalledWith(parentMeta, 'name', 'sheet')
  })

  it('creates next to the sibling for a user who can edit it, when it is not shared with them directly', async () => {
    await execute()

    expect(driveCompat.findAvailableNodeName).toHaveBeenCalledWith(parentMeta, 'name')
    expect(driveCompat.getMyFilesNodeMeta).not.toHaveBeenCalled()
  })

  it("creates in My files for a viewer, who can't write to the sibling's folder", async () => {
    await execute(undefined, false)

    expect(driveCompat.findAvailableNodeName).toHaveBeenCalledWith(myFilesMeta, 'name')
    expect(driveCompat.createDocumentNode).toHaveBeenCalledWith(myFilesMeta, 'name', 'sheet')
  })

  it('creates in My files for an editor of a sibling shared with them directly', async () => {
    await execute(undefined, true, { membership: {} })

    expect(driveCompat.createDocumentNode).toHaveBeenCalledWith(myFilesMeta, 'name', 'sheet')
  })

  it("creates in My files when Drive can't tell whether the sibling is shared directly", async () => {
    await execute(undefined, true, new Error('offline'))

    expect(driveCompat.createDocumentNode).toHaveBeenCalledWith(myFilesMeta, 'name', 'sheet')
  })
})
