import { renameNode } from './renameNode'
import { traceErrorSDK } from './traceErrorSDK'

const mockRenameNode = vi.fn()

vi.mock('@proton/drive/sdk', async () => ({
  ...(await vi.importActual('@proton/drive/sdk')),
  getDrive: () => ({ renameNode: mockRenameNode }),
}))

vi.mock('./traceErrorSDK', () => ({
  traceErrorSDK: vi.fn(),
}))

describe('renameNode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
