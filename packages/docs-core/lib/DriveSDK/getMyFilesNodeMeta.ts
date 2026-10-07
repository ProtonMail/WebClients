import { getDrive, splitNodeUid } from '@proton/drive'
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors'
import { traceErrorSDK } from './traceErrorSDK'

export async function getMyFilesNodeMeta() {
  try {
    const myFiles = await getMyFilesRootFolder()
    const { volumeId, nodeId } = splitNodeUid(myFiles.uid)
    return { volumeId, linkId: nodeId }
  } catch (error) {
    traceErrorSDK(error, 'DocsDriveCompatSDK')
    throw error
  }
}

export async function getMyFilesRootFolder() {
  const drive = getDrive()
  // No debounce and cache - done by SDK
  try {
    return await drive.getMyFilesRootFolder()
  } catch (error) {
    if ((error as { code?: number })?.code === API_CUSTOM_ERROR_CODES.ALREADY_EXISTS) {
      // Another Drive client created the fresh account's main volume first.
      // The SDK cache is updated after the failed creation, so retry the lookup once.
      return drive.getMyFilesRootFolder()
    }
    throw error
  }
}
