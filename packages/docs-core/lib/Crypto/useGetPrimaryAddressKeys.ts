import { useGetAddresses } from '@proton/account/addresses/hooks'
import { useGetAddressKeys } from '@proton/account/addressKeys/hooks'
import { getPrimaryAddress } from '@proton/shared/lib/helpers/address'
import { useCallback } from 'react'

export function useGetPrimaryAddressKeys() {
  const getAddresses = useGetAddresses()
  const getAddressKeys = useGetAddressKeys()

  const getPrimaryAddressKeys = useCallback(async () => {
    const addresses = await getAddresses()
    const address = getPrimaryAddress(addresses)

    if (!address) {
      throw new Error('No active address found')
    }

    const keys = await getAddressKeys(address.ID)
    return { keys, address: address.Email }
  }, [getAddressKeys, getAddresses])

  return getPrimaryAddressKeys
}
