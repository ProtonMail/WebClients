import { useGetAddresses } from '@proton/account/addresses/hooks'
import { useGetAddressKeys } from '@proton/account/addressKeys/hooks'
import type { Author } from '@proton/drive'
import { canonicalizeInternalEmail } from '@proton/shared/lib/helpers/email'
import { useCallback } from 'react'
import { getMyFilesRootFolder } from '../DriveSDK/getMyFilesNodeMeta'
import type { PrimaryAddressKeys } from '../DriveSDK/getDocumentKeys'
import { traceErrorSDK } from '../DriveSDK/traceErrorSDK'

export function useGetDefaultShareAddressKeys() {
  const getAddresses = useGetAddresses()
  const getAddressKeys = useGetAddressKeys()

  const getDefaultShareAddressKeys = useCallback(async (): Promise<PrimaryAddressKeys> => {
    try {
      // Like legacy, the main volume is created when missing
      const myFiles = await getMyFilesRootFolder()
      // Legacy finds the address by the default share address ID, SDK exposes only the email of the root key author
      const email = getAuthorEmail(myFiles.keyAuthor)
      const address = email
        ? (await getAddresses()).find(
            ({ Email }) => canonicalizeInternalEmail(Email) === canonicalizeInternalEmail(email),
          )
        : undefined
      if (!address) {
        throw new Error('Address is not available')
      }

      const keys = await getAddressKeys(address.ID)
      if (!keys[0]?.privateKey) {
        throw new Error('Primary private key is not available')
      }
      return { keys, address: address.Email }
    } catch (error) {
      traceErrorSDK(error, 'DocsDriveCompatSDK')
      throw error
    }
  }, [getAddressKeys, getAddresses])

  return getDefaultShareAddressKeys
}

function getAuthorEmail(author: Author) {
  return author.ok ? author.value : author.error.claimedAuthor
}
