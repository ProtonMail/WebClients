import { renameNode } from './renameNode'
import { traceErrorSDK } from './traceErrorSDK'

const mockRenameNode = jest.fn()

jest.mock('@proton/drive/sdk', () => ({
  ...jest.requireActual('@proton/drive/sdk'),
  getDrive: () => ({ renameNode: mockRenameNode }),
}))

jest.mock('./traceErrorSDK', () => ({
  traceErrorSDK: jest.fn(),
}))

describe('renameNode', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renames the node identified by volume and link ids', async () => {
    mockRenameNode.mockResolvedValue(undefined)

    await renameNode({ volumeId: 'volume-id', linkId: 'link-id' }, 'New name')

    expect(mockRenameNode).toHaveBeenCalledWith('volume-id~link-id', 'New name')
    expect(traceErrorSDK).not.toHaveBeenCalled()
  })

  it('reports and rethrows errors', async () => {
    const error = new Error('Rename failed')
    mockRenameNode.mockRejectedValue(error)

    await expect(renameNode({ volumeId: 'volume-id', linkId: 'link-id' }, 'New name')).rejects.toBe(error)
    expect(traceErrorSDK).toHaveBeenCalledWith(error, 'DocsRenameWithDriveSDK')
  })
})
