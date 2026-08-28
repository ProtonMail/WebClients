import { getDrive, splitNodeUid } from '@proton/drive'
import { traceErrorSDK } from './traceErrorSDK'

export async function getMyFilesNodeMeta() {
  const drive = getDrive()
  try {
    // No debounce and cache - done by SDK
    const myFiles = await drive.getMyFilesRootFolder()
    const { volumeId, nodeId } = splitNodeUid(myFiles.uid)
    return { volumeId, linkId: nodeId }
  } catch (error) {
    traceErrorSDK(error, 'DocsDriveCompatSDK')
    throw error
  }
}
