import { getDrive, splitNodeUid } from '@proton/drive'
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors'
import { traceErrorSDK } from './traceErrorSDK'

export async function getMyFilesNodeMeta() {
  const drive = getDrive()
  try {
    // No debounce and cache - done by SDK
    let myFiles
    try {
      myFiles = await drive.getMyFilesRootFolder()
    } catch (error) {
      if ((error as { code?: number })?.code === API_CUSTOM_ERROR_CODES.ALREADY_EXISTS) {
        // Another Drive client created the fresh account's main volume first.
        // The SDK cache is updated after the failed creation, so retry the lookup once.
        myFiles = await drive.getMyFilesRootFolder()
      } else {
        throw error
      }
    }
    const { volumeId, nodeId } = splitNodeUid(myFiles.uid)
    return { volumeId, linkId: nodeId }
  } catch (error) {
    traceErrorSDK(error, 'DocsDriveCompatSDK')
    throw error
  }
}
