import type { Mock } from 'vitest'
import { useGetAddresses } from '@proton/account/addresses/hooks'
import { useGetAddressKeys } from '@proton/account/addressKeys/hooks'
import { generateNodeUid, getDrive } from '@proton/drive/sdk'
import { ADDRESS_STATUS } from '@proton/shared/lib/constants'
import type { Api } from '@proton/shared/lib/interfaces/Api'
import { renderHook } from '@testing-library/react'
import { traceErrorSDK } from '../DriveSDK/traceErrorSDK'
import { useGetMemberAddressKeys } from './useGetMemberAddressKeys'

vi.mock('@proton/account/addresses/hooks')
vi.mock('@proton/account/addressKeys/hooks')
vi.mock('@proton/drive/sdk', async () => ({
  ...(await vi.importActual('@proton/drive/sdk')),
  getDrive: vi.fn(),
}))
vi.mock('../DriveSDK/traceErrorSDK')

const nodeMeta = { volumeId: 'volume', linkId: 'document' }
const addressKeys = [{ privateKey: 'member-key' }]

describe('useGetMemberAddressKeys', () => {
  let api: Mock
  let getNodeHierarchy: Mock

  beforeEach(() => {
    vi.clearAllMocks()
    api = vi.fn().mockResolvedValue({ AddressID: 'member-address-id' })
    getNodeHierarchy = vi
      .fn()
      .mockResolvedValue([
        { uid: generateNodeUid('volume', 'shared-folder'), deprecatedShareId: 'share-id' },
        { uid: generateNodeUid('volume', 'document') },
      ])
    vi.mocked(getDrive).mockReturnValue({ getNodeHierarchy } as any)
    vi.mocked(useGetAddresses).mockReturnValue(
      vi.fn().mockResolvedValue([
        { ID: 'primary-address-id', Email: 'primary@pm.me', Status: ADDRESS_STATUS.STATUS_ENABLED },
        { ID: 'member-address-id', Email: 'member@pm.me', Status: ADDRESS_STATUS.STATUS_ENABLED },
      ]),
    )
    vi.mocked(useGetAddressKeys).mockReturnValue(vi.fn().mockResolvedValue(addressKeys))
  })

  const getMemberAddressKeys = () =>
    renderHook(() => useGetMemberAddressKeys(api as unknown as Api)).result.current(nodeMeta)

  it('returns address of the share at the hierarchy root, not the primary one', async () => {
    await expect(getMemberAddressKeys()).resolves.toEqual({ keys: addressKeys, address: 'member@pm.me' })
    expect(getNodeHierarchy).toHaveBeenCalledWith(generateNodeUid('volume', 'document'))
    expect(api).toHaveBeenCalledWith(expect.objectContaining({ url: 'drive/shares/share-id' }))
  })

  it('fails when member address is disabled', async () => {
    vi.mocked(useGetAddresses).mockReturnValue(
      vi
        .fn()
        .mockResolvedValue([
          { ID: 'member-address-id', Email: 'member@pm.me', Status: ADDRESS_STATUS.STATUS_DISABLED },
        ]),
    )

    await expect(getMemberAddressKeys()).rejects.toThrow('Address is not available')
  })

  it('traces errors', async () => {
    api.mockResolvedValue({ AddressID: '' })

    await expect(getMemberAddressKeys()).rejects.toThrow('Loading share without direct access is not supported')
    expect(traceErrorSDK).toHaveBeenCalledWith(expect.any(Error), 'DocsDriveCompatSDK')
  })
})
