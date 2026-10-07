import type { NodeMeta, PublicDocumentKeys, PublicNodeMeta } from '@proton/docs-shared'
import { generateNodeUid, getDrive } from '@proton/drive'
import type { SessionKey } from '@protontech/crypto'
import { traceErrorSDK } from './traceErrorSDK'
import { getPublicDrive, getPublicLinkInfo } from './getPublicDrive'
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

/**
 * Address keys are only provided when a logged-in user opens a public link.
 */
export async function getPublicDocumentKeys(
  nodeMeta: PublicNodeMeta,
  primaryAddressKeys?: PrimaryAddressKeys,
): Promise<PublicDocumentKeys> {
  try {
    const publicLinkClient = getPublicDrive()
    const { volumeId } = getPublicLinkInfo()
    const nodeUid = generateNodeUid(volumeId, nodeMeta.linkId)
    const documentContentKey = await publicLinkClient.experimental.getDocsKey(nodeUid)
    return {
      documentContentKey,
      userAddressPrivateKey: primaryAddressKeys?.keys[0].privateKey,
      userOwnAddress: primaryAddressKeys?.address,
    }
  } catch (error) {
    traceErrorSDK(error, 'DocsDriveCompatSDK')
    throw error
  }
}
