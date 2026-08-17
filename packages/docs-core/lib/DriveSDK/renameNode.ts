import { generateNodeUid, getDrive } from '@proton/drive'
import type { NodeMeta } from '@proton/drive-store/lib/NodeMeta'
import { SentryRealtimeInitiatives, traceError } from '@proton/shared/lib/helpers/sentry'

export async function renameNode(nodeMeta: NodeMeta, newName: string) {
  const drive = getDrive()
  const { volumeId, linkId } = nodeMeta
  const nodeUid = generateNodeUid(volumeId, linkId)

  try {
    await drive.renameNode(nodeUid, newName)
  } catch (error) {
    traceError(error, {
      tags: {
        initiative: SentryRealtimeInitiatives.SDK_SWITCH,
        feature: 'DocsRenameWithDriveSDK',
      },
    })
    throw error
  }
}
