import { useCallback } from 'react'
import { useAuthentication } from '@proton/components'
import { traceErrorSDK } from '../DriveSDK/traceErrorSDK'

// Encryption keys for cache (local storage)
export function useGetCacheConfig() {
  const authentication = useAuthentication()

  const getCacheConfig = useCallback(() => {
    const key = authentication.getClientKey()
    const localId = authentication.getLocalID()
    if (!key) {
      traceErrorSDK(new Error('Invalid client key'), 'DocsDriveCompatSDK')
      return undefined
    }
    return { encryptionKey: key, namespace: localId }
  }, [authentication])

  return getCacheConfig
}
