import type { NodeMeta } from '@proton/docs-shared'
import { generateNodeUid, getDrive } from '@proton/drive'
import { getDecryptedNode } from './getDecryptedNode'
import mergeUint8Arrays from '@proton/utils/mergeUint8Arrays'
import { traceErrorSDK } from './traceErrorSDK'

export async function getNodeContents(nodeMeta: NodeMeta, abortSignal?: AbortSignal) {
  const nodeUid = generateNodeUid(nodeMeta.volumeId, nodeMeta.linkId)

  const [decryptedNode, contents] = await Promise.all([getDecryptedNode(nodeMeta), downloadNode(nodeUid, abortSignal)])

  return { contents, node: decryptedNode }
}

async function downloadNode(nodeUid: string, abortSignal?: AbortSignal) {
  const drive = getDrive()

  try {
    const downloader = await drive.getFileDownloader(nodeUid, abortSignal)
    const chunks: Uint8Array<ArrayBuffer>[] = []

    // eslint-disable-next-line compat/compat
    const fileStream = new WritableStream({
      write(chunk: Uint8Array<ArrayBuffer>) {
        chunks.push(chunk)
      },
    })

    const downloadController = downloader.downloadToStream(fileStream, () => {
      // No need to track progress
    })

    await downloadController.completion()

    return mergeUint8Arrays(chunks)
  } catch (error: any) {
    if (error?.name !== 'AbortError') {
      traceErrorSDK(error, 'DocsDriveCompatSDK')
    }
    throw error
  }
}
