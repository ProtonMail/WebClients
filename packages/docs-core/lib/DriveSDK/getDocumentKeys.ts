import { useCallback } from 'react'
import type { NodeMeta } from '@proton/docs-shared'
import { generateNodeUid, getDrive } from '@proton/drive'
import type { SessionKey } from '@protontech/crypto'
import { traceErrorSDK } from './traceErrorSDK'
import { useGetAddressKeys } from '@proton/account/addressKeys/hooks'
import { useGetAddresses } from '@proton/account/addresses/hooks'
import type { DecryptedAddressKey } from '@proton/shared/lib/interfaces'
import { getPrimaryAddress } from '@proton/shared/lib/helpers/address'

export type PrimaryAddressKeys = { keys: DecryptedAddressKey[]; address: string }

/*
Loading document keys:
  DocumentViewer.tsx useEffect
    DocLoader.initialize()
      LoadDocument.executePrivate()
        GetDocumentKeys.execute()
*/

export async function getDocumentKeys(nodeMeta: NodeMeta): Promise<SessionKey> {
  const drive = getDrive()

  const nodeUid = generateNodeUid(nodeMeta.volumeId, nodeMeta.linkId)
  try {
    const documentContentKey = await drive.experimental.getDocsKey(nodeUid)
    return documentContentKey
  } catch (error) {
    traceErrorSDK(error, 'DocsDriveCompatSDK')
    throw error
  }
}

/*
DocumentViewer.tsx useEffect
  application.getDocLoader().initialize()
    DocLoader.initialize()
      LoadDocument.executePrivate()
        GetDocumentKeys.execute() or GetDocumentKeys.loadFromCache()
*/

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
