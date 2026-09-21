import type { NodeMeta } from '@proton/docs-shared'
import { generateNodeUid, getDrive } from '@proton/drive'
import { SentryRealtimeInitiatives, traceError } from '@proton/shared/lib/helpers/sentry'

export async function getShareId(nodeMeta: NodeMeta): Promise<string> {
  const drive = getDrive()

  try {
    const nodeUid = generateNodeUid(nodeMeta.volumeId, nodeMeta.linkId)
    const node = await drive.getNode(nodeUid)
    if (!node.deprecatedShareId) {
      throw new Error('SDK did not return share ID')
    }
    return node.deprecatedShareId
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
