import { generateNodeUid } from '@proton/drive'
import type { PublicNodeMeta } from '@proton/docs-shared'
import type { DecryptedNode } from '@proton/docs-shared/lib/DecryptedNode'
import { getPublicDrive, getPublicLinkInfo } from './getPublicDrive'
import { toDecryptedNode } from './getDecryptedNode'
import { traceErrorSDK } from './traceErrorSDK'

export async function getPublicDecryptedNode(nodeMeta: PublicNodeMeta): Promise<DecryptedNode> {
  try {
    const publicLinkClient = getPublicDrive()
    const { volumeId } = getPublicLinkInfo()
    // SDK may return a cached node, so a rename by the owner may not show for a public viewer; accepted for now
    const node = await publicLinkClient.getNode(generateNodeUid(volumeId, nodeMeta.linkId))
    // Like legacy, signature addresses are not exposed in a public context
    return { ...toDecryptedNode(node), signatureAddress: undefined, nameSignatureAddress: undefined }
  } catch (error) {
    traceErrorSDK(error, 'DocsDriveCompatSDK')
    throw error
  }
}
