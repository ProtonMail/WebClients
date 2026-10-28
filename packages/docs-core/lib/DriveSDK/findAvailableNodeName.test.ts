import { NodeType } from '@proton/drive/sdk'
import { findAvailableNodeName } from './findAvailableNodeName'
import { traceErrorSDK } from './traceErrorSDK'

const mockGetAvailableName = jest.fn()

jest.mock('@proton/drive/sdk', () => ({
  ...jest.requireActual('@proton/drive/sdk'),
  getDrive: () => ({ getAvailableName: mockGetAvailableName }),
}))

jest.mock('./traceErrorSDK', () => ({
  traceErrorSDK: jest.fn(),
}))

describe('findAvailableNodeName', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns the available file name in the parent folder', async () => {
    mockGetAvailableName.mockResolvedValue('Name (1)')

    await expect(findAvailableNodeName({ volumeId: 'volume-id', linkId: 'parent-id' }, 'Name')).resolves.toBe(
      'Name (1)',
    )
    expect(mockGetAvailableName).toHaveBeenCalledWith('volume-id~parent-id', 'Name', NodeType.File)
    expect(traceErrorSDK).not.toHaveBeenCalled()
  })

  it('reports and rethrows errors', async () => {
    const error = new Error('Parent not found')
    mockGetAvailableName.mockRejectedValue(error)

    await expect(findAvailableNodeName({ volumeId: 'volume-id', linkId: 'parent-id' }, 'Name')).rejects.toBe(error)
    expect(traceErrorSDK).toHaveBeenCalledWith(error, 'DocsDriveCompatSDK')
  })
})
