import { getPublicDecryptedNode } from './getPublicDecryptedNode'
import { traceErrorSDK } from './traceErrorSDK'

const mockGetNode = jest.fn()
const mockGetPublicDrive = jest.fn()
const mockGetPublicLinkInfo = jest.fn()

jest.mock('./getPublicDrive', () => ({
  getPublicDrive: () => mockGetPublicDrive(),
  getPublicLinkInfo: () => mockGetPublicLinkInfo(),
}))

jest.mock('./getDecryptedNode', () => ({
  toDecryptedNode: (node: { uid: string }) => ({ uid: node.uid }),
}))

jest.mock('./traceErrorSDK', () => ({
  traceErrorSDK: jest.fn(),
}))

describe('getPublicDecryptedNode', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetPublicDrive.mockReturnValue({ getNode: mockGetNode })
    mockGetPublicLinkInfo.mockReturnValue({ volumeId: 'volume-id' })
  })

  it('gets the node from the volume of the public link root node', async () => {
    mockGetNode.mockResolvedValue({ uid: 'volume-id~link-id' })

    await expect(getPublicDecryptedNode({ token: 'token', linkId: 'link-id' })).resolves.toEqual({
      uid: 'volume-id~link-id',
    })
    expect(mockGetNode).toHaveBeenCalledWith('volume-id~link-id')
  })

  it('reports and rethrows errors', async () => {
    const error = new Error('Node not found')
    mockGetNode.mockRejectedValue(error)

    await expect(getPublicDecryptedNode({ token: 'token', linkId: 'link-id' })).rejects.toBe(error)
    expect(traceErrorSDK).toHaveBeenCalledWith(error, 'DocsDriveCompatSDK')
  })

  it('reports and rethrows when the public link client is not initialized', async () => {
    const error = new Error('Public drive not initialized')
    mockGetPublicDrive.mockImplementation(() => {
      throw error
    })

    await expect(getPublicDecryptedNode({ token: 'token', linkId: 'link-id' })).rejects.toBe(error)
    expect(traceErrorSDK).toHaveBeenCalledWith(error, 'DocsDriveCompatSDK')
  })
})
