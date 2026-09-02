import type { NodeMeta } from '@proton/docs-shared/lib/BasicTypes'
import { generateNodeUid, getDrive } from '@proton/drive'
import { traceErrorSDK } from './traceErrorSDK'

export async function findAvailableNodeName(parentMeta: NodeMeta, candidateName: string) {
  const drive = getDrive()
  try {
    const parentFolderUid = generateNodeUid(parentMeta.volumeId, parentMeta.linkId)
    const fileName = await drive.getAvailableName(parentFolderUid, candidateName)
    return fileName
  } catch (error) {
    traceErrorSDK(error, 'DocsDriveCompatSDK')
    throw error
  }
}
