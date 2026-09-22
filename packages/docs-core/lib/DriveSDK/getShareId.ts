import type { NodeMeta } from '@proton/docs-shared'
import { generateNodeUid, getDrive } from '@proton/drive'
import { SentryRealtimeInitiatives, traceError } from '@proton/shared/lib/helpers/sentry'

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
    traceError(error, {
      tags: {
        initiative: SentryRealtimeInitiatives.SDK_SWITCH,
        feature: 'DocsDriveCompatSDK',
      },
    })
    throw error
  }
}
