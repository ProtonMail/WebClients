import { generateNodeUid, getDrive } from '@proton/drive'
import type { NodeMeta } from '@proton/docs-shared'
import { traceErrorSDK } from './traceErrorSDK'

export async function renameNode(nodeMeta: NodeMeta, newName: string) {
  const drive = getDrive()
  const { volumeId, linkId } = nodeMeta
  const nodeUid = generateNodeUid(volumeId, linkId)

  try {
    await drive.renameNode(nodeUid, newName)
  } catch (error) {
    traceErrorSDK(error, 'DocsRenameWithDriveSDK')
    throw error
  }
}
