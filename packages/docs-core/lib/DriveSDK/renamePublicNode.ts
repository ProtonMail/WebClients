import { generateNodeUid } from '@proton/drive'
import type { PublicNodeMeta } from '@proton/docs-shared'
import { getPublicDrive, getPublicLinkInfo } from './getPublicDrive'
import { traceErrorSDK } from './traceErrorSDK'

export async function renamePublicNode(nodeMeta: PublicNodeMeta, newName: string) {
  try {
    const publicLinkClient = getPublicDrive()
    const { volumeId } = getPublicLinkInfo()
    const nodeUid = generateNodeUid(volumeId, nodeMeta.linkId)

    // Unlike legacy, name validation and signing keys are decided by the SDK
    await publicLinkClient.renameNode(nodeUid, newName)
  } catch (error) {
    traceErrorSDK(error, 'DocsDriveCompatSDK')
    throw error
  }
}
