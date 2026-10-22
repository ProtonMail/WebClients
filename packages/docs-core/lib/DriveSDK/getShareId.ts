import type { NodeMeta } from '@proton/docs-shared/BasicTypes'
import { generateNodeUid, getDrive } from '@proton/drive/sdk'
import { traceErrorSDK } from './traceErrorSDK'

export async function getShareId(nodeMeta: NodeMeta): Promise<string> {
  const drive = getDrive()

  try {
    const nodeUid = generateNodeUid(nodeMeta.volumeId, nodeMeta.linkId)
    const hierarchy = await drive.getNodeHierarchy(nodeUid)
    const [root] = hierarchy

    if (!root.deprecatedShareId) {
      throw new Error('SDK did not return share ID')
    }

    return root.deprecatedShareId
  } catch (error) {
    traceErrorSDK(error, 'DocsDriveCompatSDK')
    throw error
  }
}
