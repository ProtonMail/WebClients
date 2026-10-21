import { useGetAddresses } from '@proton/account/addresses/hooks'
import { useGetAddressKeys } from '@proton/account/addressKeys/hooks'
import { generateNodeUid, getDrive } from '@proton/drive/sdk'
import type { Api } from '@proton/shared/lib/interfaces/Api'
import { renderHook } from '@testing-library/react'
import { traceErrorSDK } from '../DriveSDK/traceErrorSDK'
import { useGetMemberAddressKeys } from './useGetMemberAddressKeys'

jest.mock('@proton/account/addresses/hooks')
jest.mock('@proton/account/addressKeys/hooks')
jest.mock('@proton/drive/sdk', () => ({
  ...jest.requireActual('@proton/drive/sdk'),
  getDrive: jest.fn(),
}))
jest.mock('../DriveSDK/traceErrorSDK')

const nodeMeta = { volumeId: 'volume', linkId: 'document' }
const addressKeys = [{ privateKey: 'member-key' }]

describe('useGetMemberAddressKeys', () => {
  let api: jest.Mock
  let getNodeHierarchy: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    api = jest.fn().mockResolvedValue({ AddressID: 'member-address-id' })
    getNodeHierarchy = jest
      .fn()
      .mockResolvedValue([
        { uid: generateNodeUid('volume', 'shared-folder'), deprecatedShareId: 'share-id' },
        { uid: generateNodeUid('volume', 'document') },
      ])
    jest.mocked(getDrive).mockReturnValue({ getNodeHierarchy } as any)
    jest.mocked(useGetAddresses).mockReturnValue(
      jest.fn().mockResolvedValue([
        { ID: 'primary-address-id', Email: 'primary@pm.me' },
        { ID: 'member-address-id', Email: 'member@pm.me' },
      ]),
    )
    jest.mocked(useGetAddressKeys).mockReturnValue(jest.fn().mockResolvedValue(addressKeys))
  })

  const getMemberAddressKeys = () =>
    renderHook(() => useGetMemberAddressKeys(api as unknown as Api)).result.current(nodeMeta)

  it('returns address of the share at the hierarchy root, not the primary one', async () => {
    await expect(getMemberAddressKeys()).resolves.toEqual({ keys: addressKeys, address: 'member@pm.me' })
    expect(getNodeHierarchy).toHaveBeenCalledWith(generateNodeUid('volume', 'document'))
    expect(api).toHaveBeenCalledWith(expect.objectContaining({ url: 'drive/shares/share-id' }))
  })

  it('traces errors', async () => {
    api.mockResolvedValue({ AddressID: '' })

    await expect(getMemberAddressKeys()).rejects.toThrow('Loading share without direct access is not supported')
    expect(traceErrorSDK).toHaveBeenCalledWith(expect.any(Error), 'DocsDriveCompatSDK')
  })
})
