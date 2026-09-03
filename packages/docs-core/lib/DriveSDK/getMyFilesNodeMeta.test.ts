import { ValidationError } from '@proton/drive'
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors'
import { getMyFilesNodeMeta } from './getMyFilesNodeMeta'
import { traceErrorSDK } from './traceErrorSDK'

const mockGetMyFilesRootFolder = jest.fn()

jest.mock('@proton/drive', () => ({
  ...jest.requireActual('@proton/drive'),
  getDrive: () => ({ getMyFilesRootFolder: mockGetMyFilesRootFolder }),
}))

jest.mock('./traceErrorSDK', () => ({
  traceErrorSDK: jest.fn(),
}))

describe('getMyFilesNodeMeta', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns the main volume and root node identifiers', async () => {
    mockGetMyFilesRootFolder.mockResolvedValue({ uid: 'volume-id~node-id' })

    await expect(getMyFilesNodeMeta()).resolves.toEqual({ volumeId: 'volume-id', linkId: 'node-id' })
    expect(mockGetMyFilesRootFolder).toHaveBeenCalledTimes(1)
  })

  it('retries when another client creates the main volume first', async () => {
    const volumeAlreadyActive = Object.assign(new Error('A volume is already active'), {
      code: API_CUSTOM_ERROR_CODES.ALREADY_EXISTS,
    })
    mockGetMyFilesRootFolder
      .mockRejectedValueOnce(volumeAlreadyActive)
      .mockResolvedValueOnce({ uid: 'volume-id~node-id' })

    await expect(getMyFilesNodeMeta()).resolves.toEqual({ volumeId: 'volume-id', linkId: 'node-id' })
    expect(mockGetMyFilesRootFolder).toHaveBeenCalledTimes(2)
    expect(traceErrorSDK).not.toHaveBeenCalled()
  })

  it('reports and rethrows unrelated errors without retrying', async () => {
    const error = new ValidationError('Volume not found', API_CUSTOM_ERROR_CODES.NOT_FOUND)
    mockGetMyFilesRootFolder.mockRejectedValue(error)

    await expect(getMyFilesNodeMeta()).rejects.toBe(error)
    expect(mockGetMyFilesRootFolder).toHaveBeenCalledTimes(1)
    expect(traceErrorSDK).toHaveBeenCalledWith(error, 'DocsDriveCompatSDK')
  })
})
