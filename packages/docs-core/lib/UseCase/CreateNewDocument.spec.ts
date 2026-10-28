import { Result } from '@proton/docs-shared/Result'
import type { DecryptedNode } from '@proton/docs-shared/DecryptedNode'
import type { DriveCompat } from '@proton/drive-store/lib/useDriveCompat'
import type { UnleashClient } from '@proton/unleash/UnleashClient'
import { CreateNewDocument } from './CreateNewDocument'
import type { GetDocumentMeta } from './GetDocumentMeta'

const parentMeta = { volumeId: 'volume', linkId: 'parent' }
const shell = { ...parentMeta, linkId: 'new-document', keys: {} }

describe('CreateNewDocument', () => {
  let driveCompat: jest.Mocked<DriveCompat>
  let getDocumentMeta: jest.Mocked<GetDocumentMeta>
  const unleashClient = { isReady: () => true, isEnabled: () => false } as unknown as UnleashClient

  beforeEach(() => {
    driveCompat = {
      findAvailableNodeName: jest.fn().mockResolvedValue('name'),
      createDocumentNode: jest.fn().mockResolvedValue(shell),
    } as unknown as jest.Mocked<DriveCompat>
    getDocumentMeta = { execute: jest.fn().mockResolvedValue(Result.ok({})) } as unknown as jest.Mocked<GetDocumentMeta>
  })

  const execute = (createDocumentNode?: jest.Mock) =>
    new CreateNewDocument(driveCompat, getDocumentMeta, unleashClient, createDocumentNode).execute(
      'name',
      parentMeta,
      { parentNodeId: 'parent' } as DecryptedNode,
      'sheet',
    )

  it('uses provided createDocumentNode', async () => {
    const createDocumentNode = jest.fn().mockResolvedValue(shell)

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
})
