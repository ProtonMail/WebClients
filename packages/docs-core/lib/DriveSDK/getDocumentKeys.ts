import type { NodeMeta } from '@proton/docs-shared'
import { generateNodeUid, getDrive } from '@proton/drive'
import type { SessionKey } from '@protontech/crypto'
import { traceErrorSDK } from './traceErrorSDK'
import type { DecryptedAddressKey } from '@proton/shared/lib/interfaces'

export type PrimaryAddressKeys = { keys: DecryptedAddressKey[]; address: string }

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
