import { useCallback } from 'react'
import type { PublicKeyReference } from '@protontech/crypto'
import { CryptoProxy } from '@protontech/crypto'
import { useGetAddresses } from '@proton/account/addresses/hooks'
import { useGetAddressKeys } from '@proton/account/addressKeys/hooks'
import { useAuthentication } from '@proton/components'
import { ADDRESS_STATUS } from '@proton/shared/lib/constants'
import { canonicalizeInternalEmail } from '@proton/shared/lib/helpers/email'
import type { Address, Api } from '@proton/shared/lib/interfaces'
import type { GetAddressKeys } from '@proton/shared/lib/interfaces/hooks/GetAddressKeys'
import { splitKeys } from '@proton/shared/lib/keys'
import { getPublicKeysForEmail } from './getPublicKeysForEmail'

type VerificationKeysCallback = () => Promise<PublicKeyReference[]>

// Signature verification keys: own enabled address keys, then API public keys, then own other address keys
export function useGetVerificationKey(api: Api) {
  const getAddresses = useGetAddresses()
  const getAddressKeys = useGetAddressKeys()
  const { UID } = useAuthentication()

  const getVerificationKey = useCallback(
    async (email?: string): Promise<PublicKeyReference[]> => {
      // Not logged in - signatures for public session are not supported
      if (!email || !UID) {
        return []
      }

      const addresses = await getAddresses()
      const enabledAddresses = addresses.filter(({ Status }) => Status === ADDRESS_STATUS.STATUS_ENABLED)
      const otherAddresses = addresses.filter(({ Status }) => Status !== ADDRESS_STATUS.STATUS_ENABLED)

      const callbacks: VerificationKeysCallback[] = [
        () => getOwnPublicKeys(email, enabledAddresses, getAddressKeys),
        () => getPublicKeys(api, email),
      ]
      if (otherAddresses.length > 0) {
        callbacks.push(() => getOwnPublicKeys(email, otherAddresses, getAddressKeys))
      }

      for (const callback of callbacks) {
        const publicKeys = await callback()
        if (publicKeys.length) {
          return publicKeys
        }
      }
      return []
    },
    [api, UID, getAddresses, getAddressKeys],
  )

  return getVerificationKey
}

async function getOwnPublicKeys(email: string, addresses: Address[], getAddressKeys: GetAddressKeys) {
  const address = addresses.find(({ Email }) => canonicalizeInternalEmail(Email) === canonicalizeInternalEmail(email))
  if (!address) {
    return []
  }
  return splitKeys(await getAddressKeys(address.ID)).publicKeys
}

async function getPublicKeys(api: Api, email: string) {
  const publicKeys = await getPublicKeysForEmail(api, email)
  if (!publicKeys) {
    return []
  }
  return Promise.all(publicKeys.map((publicKey) => CryptoProxy.importPublicKey({ armoredKey: publicKey })))
}
