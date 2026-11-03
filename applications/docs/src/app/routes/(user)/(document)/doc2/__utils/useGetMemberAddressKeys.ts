import { useCallback } from 'react'

import { useGetAddresses } from '@proton/account/addresses/hooks'
import { useGetAddressKeys } from '@proton/account/addressKeys/hooks'
import { generateNodeUid, getDrive } from '@proton/drive/sdk'
import { queryShareMeta } from '@proton/shared/lib/api/drive/share'
import { getIsAddressEnabled } from '@proton/shared/lib/helpers/address'
import type { Api } from '@proton/shared/lib/interfaces/Api'
import type { ShareMeta } from '@proton/shared/lib/interfaces/drive/share'
import type { DocumentKeys, PrivateNodeMeta } from '@proton-docs/realtime-sdk'

// Ported from docs-core `Crypto/useGetMemberAddressKeys.ts`, which doc2 must not import.
// Like Drive SDK signing keys: the user's member address of the share at the root of the node hierarchy, never the primary address.
export function useGetMemberAddressKeys(api: Api) {
  const getAddresses = useGetAddresses()
  const getAddressKeys = useGetAddressKeys()

  return useCallback(
    async ({
      volumeId,
      linkId,
    }: PrivateNodeMeta): Promise<Pick<DocumentKeys, 'userAddressPrivateKey' | 'userOwnAddress'>> => {
      const hierarchy = await getDrive().getNodeHierarchy(generateNodeUid(volumeId, linkId))
      const shareId = hierarchy[0].deprecatedShareId
      if (!shareId) {
        throw new Error('Root node has no share')
      }
      const { AddressID } = await api<ShareMeta>(queryShareMeta(shareId))
      if (!AddressID) {
        throw new Error('Loading share without direct access is not supported')
      }
      const [addresses, keys] = await Promise.all([getAddresses(), getAddressKeys(AddressID)])
      const address = addresses.find((address) => address.ID === AddressID && getIsAddressEnabled(address))
      if (!address || !keys[0]?.privateKey) {
        throw new Error('Address is not available')
      }
      return { userAddressPrivateKey: keys[0].privateKey, userOwnAddress: address.Email }
    },
    [api, getAddresses, getAddressKeys],
  )
}
