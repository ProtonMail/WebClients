import { useCallback } from 'react'
import type { PublicKeyReference } from '@protontech/crypto'
import { CryptoProxy } from '@protontech/crypto'
import { useGetAddresses } from '@proton/account/addresses/hooks'
import { useGetAddressKeys } from '@proton/account/addressKeys/hooks'
import { useAuthentication } from '@proton/components'
import { getAllPublicKeys } from '@proton/shared/lib/api/keys'
import { ADDRESS_STATUS } from '@proton/shared/lib/constants'
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors'
import { canonicalizeInternalEmail } from '@proton/shared/lib/helpers/email'
import type { Address, Api } from '@proton/shared/lib/interfaces'
import type { GetAddressKeys } from '@proton/shared/lib/interfaces/hooks/GetAddressKeys'
import { splitKeys } from '@proton/shared/lib/keys'

type VerificationKeysCallback = () => Promise<PublicKeyReference[]>

type PublicKeysResponse = {
  Address: { Keys: { PublicKey: string }[] }
  Unverified?: { Keys: { PublicKey: string }[] }
}

// Public keys for emails that were successfully retrieved
const cacheFoundAddresses = new Map<string, string[]>()

// Emails without associated addresses or from external domains,
// prevents "Too many recent API requests" errors for deactivated addresses
const cacheMissingAddresses = new Set<string>()

// Requests still in flight, so identical parallel requests share one API call
const pendingRequests = new Map<string, Promise<unknown>>()

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

async function getPublicKeysForEmail(api: Api, email: string) {
  const cachedFoundAddress = cacheFoundAddresses.get(email)
  if (cachedFoundAddress) {
    return cachedFoundAddress
  }
  if (cacheMissingAddresses.has(email)) {
    return undefined
  }

  return debouncedRequest<PublicKeysResponse>(api, {
    ...getAllPublicKeys({ Email: email, InternalOnly: 1 }),
    silence: [API_CUSTOM_ERROR_CODES.KEY_GET_ADDRESS_MISSING, API_CUSTOM_ERROR_CODES.KEY_GET_DOMAIN_EXTERNAL],
  })
    .then(({ Address, Unverified }) => {
      const publicKeys = (Address.Keys.length === 0 && Unverified ? Unverified.Keys : Address.Keys).map(
        (key) => key.PublicKey,
      )
      cacheFoundAddresses.set(email, publicKeys)
      return publicKeys
    })
    .catch((error) => {
      if (
        error?.data?.Code === API_CUSTOM_ERROR_CODES.KEY_GET_ADDRESS_MISSING ||
        error?.data?.Code === API_CUSTOM_ERROR_CODES.KEY_GET_DOMAIN_EXTERNAL
      ) {
        cacheMissingAddresses.add(email)
        return undefined
      }
      throw error
    })
}

// Returns the already pending promise for the same request, removed from the map once settled
function debouncedRequest<T>(api: Api, args: object): Promise<T> {
  const key = JSON.stringify(args)
  const pendingRequest = pendingRequests.get(key)
  if (pendingRequest) {
    return pendingRequest as Promise<T>
  }

  const request = api<T>(args).finally(() => pendingRequests.delete(key))
  pendingRequests.set(key, request)
  return request
}
