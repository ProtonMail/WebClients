import { Result } from '@proton/docs-shared/Result'
import type { DecryptedNode } from '@proton/docs-shared/DecryptedNode'
import type { DriveCompat } from '@proton/drive-store/lib/useDriveCompat'
import type { UnleashClient } from '@proton/unleash/UnleashClient'
import { CreateEmptyDocumentForConversion } from './CreateEmptyDocumentForConversion'
import type { GetDocumentMeta } from './GetDocumentMeta'

const parentMeta = { volumeId: 'volume', linkId: 'parent' }
const shell = { ...parentMeta, linkId: 'new-document', keys: {} }
const node = { volumeId: 'volume', parentNodeId: 'parent', name: 'file.docx', mimeType: 'text/plain' } as DecryptedNode

describe('CreateEmptyDocumentForConversion', () => {
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
    new CreateEmptyDocumentForConversion(driveCompat, getDocumentMeta, unleashClient, createDocumentNode).execute({
      node,
      contents: new Uint8Array(),
    })

  it('uses provided createDocumentNode', async () => {
    const createDocumentNode = jest.fn().mockResolvedValue(shell)

    const result = await execute(createDocumentNode)

    expect(result.getValue().newShell).toBe(shell)
    expect(createDocumentNode).toHaveBeenCalledWith(parentMeta, 'name', 'doc')
    expect(driveCompat.createDocumentNode).not.toHaveBeenCalled()
  })

  it('falls back to drive compat createDocumentNode', async () => {
    const result = await execute()

    expect(result.getValue().newShell).toBe(shell)
    expect(driveCompat.createDocumentNode).toHaveBeenCalledWith(parentMeta, 'name', 'doc')
  })
})
