import { useCallback } from 'react'
import { useGetAddresses } from '@proton/account/addresses/hooks'
import { useGetAddressKeys } from '@proton/account/addressKeys/hooks'
import type { NodeMeta } from '@proton/docs-shared/BasicTypes'
import { generateNodeUid, getDrive, type NodeEntity } from '@proton/drive/sdk'
import { queryShareMeta } from '@proton/shared/lib/api/drive/share'
import { getIsAddressEnabled } from '@proton/shared/lib/helpers/address'
import type { Api } from '@proton/shared/lib/interfaces/Api'
import type { ShareMeta } from '@proton/shared/lib/interfaces/drive/share'
import type { PrimaryAddressKeys } from '../DriveSDK/getDocumentKeys'
import { traceErrorSDK } from '../DriveSDK/traceErrorSDK'

// Like SDK signing keys, the user's member address of the share at the root of the node hierarchy
export function useGetMemberAddressKeys(api: Api) {
  const getAddresses = useGetAddresses()
  const getAddressKeys = useGetAddressKeys()

  return useCallback(
    async ({ volumeId, linkId }: NodeMeta): Promise<PrimaryAddressKeys> => {
      try {
        const hierarchy = await getDrive().getNodeHierarchy(generateNodeUid(volumeId, linkId))
        const { AddressID } = await getRootShare(api, hierarchy)
        return await getOwnAddressKeys(getAddresses, getAddressKeys, AddressID)
      } catch (error) {
        traceErrorSDK(error, 'DocsDriveCompatSDK')
        throw error
      }
    },
    [api, getAddresses, getAddressKeys],
  )
}

export async function getRootShare(api: Api, hierarchy: NodeEntity[]) {
  const shareId = hierarchy[0].deprecatedShareId
  if (!shareId) {
    throw new Error('Root node has no share')
  }
  const share = await api<ShareMeta>(queryShareMeta(shareId))
  if (!share.AddressID) {
    throw new Error('Loading share without direct access is not supported')
  }
  return share
}

export async function getOwnAddressKeys(
  getAddresses: ReturnType<typeof useGetAddresses>,
  getAddressKeys: ReturnType<typeof useGetAddressKeys>,
  addressId: string,
): Promise<PrimaryAddressKeys> {
  const [addresses, keys] = await Promise.all([getAddresses(), getAddressKeys(addressId)])
  const address = addresses.find((address) => address.ID === addressId && getIsAddressEnabled(address))
  if (!address || !keys[0]?.privateKey) {
    throw new Error('Address is not available')
  }
  return { keys, address: address.Email }
}
