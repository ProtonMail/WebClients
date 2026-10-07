import { getAllPublicKeys } from '@proton/shared/lib/api/keys'
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors'
import type { Api, GetAllPublicKeysResponse } from '@proton/shared/lib/interfaces'

const MISSING_ADDRESS_CODES = [
  API_CUSTOM_ERROR_CODES.KEY_GET_ADDRESS_MISSING,
  API_CUSTOM_ERROR_CODES.KEY_GET_DOMAIN_EXTERNAL,
]

// Cached (incl. missing addresses) to avoid "Too many recent API requests", e.g. many messages from the same author
const publicKeysCache = new Map<string, Promise<string[] | undefined>>()

// Armored public keys for an email; undefined for missing address or external domain
// Unlike legacy, in-flight requests are shared instead of debounced, and there is no abort signal
export function getPublicKeysForEmail(api: Api, email: string) {
  const cached = publicKeysCache.get(email)
  if (cached) {
    return cached
  }

  const promise = fetchPublicKeys(api, email)
  publicKeysCache.set(email, promise)
  promise.catch(() => publicKeysCache.delete(email))
  return promise
}

async function fetchPublicKeys(api: Api, email: string) {
  const response = await api<GetAllPublicKeysResponse>({
    ...getAllPublicKeys({ Email: email, InternalOnly: 1 }),
    silence: MISSING_ADDRESS_CODES,
  }).catch((error) => {
    if (MISSING_ADDRESS_CODES.includes(error?.data?.Code)) {
      return undefined
    }
    throw error
  })
  if (!response) {
    return undefined
  }

  const keys =
    response.Address.Keys.length === 0 && response.Unverified ? response.Unverified.Keys : response.Address.Keys
  return keys.map(({ PublicKey }) => PublicKey)
}
