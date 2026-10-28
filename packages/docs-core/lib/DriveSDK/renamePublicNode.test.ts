import { renamePublicNode } from './renamePublicNode'
import { traceErrorSDK } from './traceErrorSDK'

const mockRenameNode = jest.fn()
const mockGetPublicDrive = jest.fn()
const mockGetPublicLinkInfo = jest.fn()

jest.mock('./getPublicDrive', () => ({
  getPublicDrive: () => mockGetPublicDrive(),
  getPublicLinkInfo: () => mockGetPublicLinkInfo(),
}))

jest.mock('./traceErrorSDK', () => ({
  traceErrorSDK: jest.fn(),
}))

describe('renamePublicNode', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetPublicDrive.mockReturnValue({ renameNode: mockRenameNode })
    mockGetPublicLinkInfo.mockReturnValue({ volumeId: 'volume-id' })
  })

  it('renames the node in the volume of the public link root node', async () => {
    mockRenameNode.mockResolvedValue(undefined)

    await renamePublicNode({ token: 'token', linkId: 'link-id' }, 'New name')

    expect(mockRenameNode).toHaveBeenCalledWith('volume-id~link-id', 'New name')
    expect(traceErrorSDK).not.toHaveBeenCalled()
  })

  it('reports and rethrows errors', async () => {
    const error = new Error('Rename failed')
    mockRenameNode.mockRejectedValue(error)

    await expect(renamePublicNode({ token: 'token', linkId: 'link-id' }, 'New name')).rejects.toBe(error)
    expect(traceErrorSDK).toHaveBeenCalledWith(error, 'DocsDriveCompatSDK')
  })

  it('reports and rethrows when the public link client is not initialized', async () => {
    const error = new Error('Public drive not initialized')
    mockGetPublicDrive.mockImplementation(() => {
      throw error
    })

    await expect(renamePublicNode({ token: 'token', linkId: 'link-id' }, 'New name')).rejects.toBe(error)
    expect(traceErrorSDK).toHaveBeenCalledWith(error, 'DocsDriveCompatSDK')
  })
})
