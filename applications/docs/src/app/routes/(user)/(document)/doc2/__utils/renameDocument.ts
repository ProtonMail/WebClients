import { NodeType, type NodeEntity, getDrive } from '@proton/drive/sdk'

/**
 * Renames the document, to the name Drive offers when its folder has `name` taken already, as docs-core
 * `RenameController/RenameController.ts` does. Returns the name it got.
 */
export async function renameDocument(node: Pick<NodeEntity, 'uid' | 'parentUid'>, name: string): Promise<string> {
  if (!node.parentUid) {
    throw new Error('Cannot rename a document with no parent folder')
  }
  const availableName = await getDrive().getAvailableName(node.parentUid, name, NodeType.File)
  await getDrive().renameNode(node.uid, availableName)
  return availableName
}
