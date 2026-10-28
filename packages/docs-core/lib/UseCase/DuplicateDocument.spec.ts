import { Result } from '@proton/docs-shared/Result'
import type { DriveCompat } from '@proton/drive-store/lib/useDriveCompat'
import type { UnleashClient } from '@proton/unleash/UnleashClient'
import { DuplicateDocument } from './DuplicateDocument'
import type { GetDocumentMeta } from './GetDocumentMeta'
import type { SeedInitialCommit } from './SeedInitialCommit'

const rootMeta = { volumeId: 'volume', linkId: 'root' }
const shell = { volumeId: 'volume', linkId: 'new-document', keys: {} }
const state = new Uint8Array()

describe('DuplicateDocument', () => {
  let driveCompat: jest.Mocked<DriveCompat>
  let getDocumentMeta: jest.Mocked<GetDocumentMeta>
  let seedInitialCommit: jest.Mocked<SeedInitialCommit>
  const unleashClient = { isReady: () => true, isEnabled: () => false } as unknown as UnleashClient

  beforeEach(() => {
    driveCompat = {
      getMyFilesNodeMeta: jest.fn().mockResolvedValue(rootMeta),
      findAvailableNodeName: jest.fn().mockResolvedValue('name'),
      createDocumentNode: jest.fn().mockResolvedValue(shell),
    } as unknown as jest.Mocked<DriveCompat>
    getDocumentMeta = { execute: jest.fn().mockResolvedValue(Result.ok({})) } as unknown as jest.Mocked<GetDocumentMeta>
    seedInitialCommit = {
      execute: jest.fn().mockResolvedValue(Result.ok({})),
    } as unknown as jest.Mocked<SeedInitialCommit>
  })

  const executePublic = (createDocumentNode?: jest.Mock) =>
    new DuplicateDocument(
      driveCompat,
      getDocumentMeta,
      seedInitialCommit,
      unleashClient,
      createDocumentNode,
    ).executePublic('name', state, 'sheet')

  it('uses provided createDocumentNode', async () => {
    const createDocumentNode = jest.fn().mockResolvedValue(shell)

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
})
