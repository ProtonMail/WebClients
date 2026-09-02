import { generateNodeUid, getDrive, NodeType, splitNodeUid, type Author, type NodeEntity } from '@proton/drive'
import { getNodeName } from './getNodeName'
import { traceErrorSDK } from './traceErrorSDK'
import type { DecryptedNode } from '@proton/docs-shared/lib/DecryptedNode'
import { c } from 'ttag'
import type { NodeMeta } from '@proton/docs-shared'

export async function getDecryptedNode(nodeMeta: NodeMeta): Promise<DecryptedNode> {
  const drive = getDrive()
  try {
    const nodeUid = generateNodeUid(nodeMeta.volumeId, nodeMeta.linkId)
    const node = await drive.getNode(nodeUid)
    return toDecryptedNode(node)
  } catch (error) {
    traceErrorSDK(error, 'DocsDriveCompatSDK')
    throw error
  }
}

function toDecryptedNode(node: NodeEntity): DecryptedNode {
  const { volumeId, nodeId } = splitNodeUid(node.uid)
  const parentNodeId = node.parentUid ? splitNodeUid(node.parentUid).nodeId : undefined

  return {
    volumeId,
    nodeId,
    parentNodeId,
    name: getNodeName(node) ?? c('Label').t`⚠️ Undecryptable name`,
    // Not used so safe to be empty
    hash: '',
    createTime: Math.floor(node.creationTime.getTime() / 1000),
    mimeType: node.type === NodeType.Folder ? 'Folder' : (node.mediaType ?? ''),
    signatureAddress: getAuthorAddress(node.keyAuthor),
    nameSignatureAddress: getAuthorAddress(node.nameAuthor),
    isCorruptedNode: !node.name.ok || (node.errors?.length ?? 0) > 0,
    trashed: node.trashTime ? Math.floor(node.trashTime.getTime() / 1000) : null,
  }
}

function getAuthorAddress(author: Author): string | undefined {
  const value = author.ok ? author.value : author.error.claimedAuthor
  return value ?? undefined
}
