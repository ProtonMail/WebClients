import { MemberRole, type NodeEntity, type ProtonDriveClient } from '@proton/drive'
import { findUserAddress } from '@proton/shared/lib/helpers/address'
import type { Address } from '@proton/shared/lib/interfaces'

export function getNodeName(node: NodeEntity) {
  if (typeof node.name === 'string') {
    return node.name
  }
  if (node.name.ok) {
    return node.name.value
  }
}

export async function getFullPath(drive: ProtonDriveClient, nodeUid: string) {
  const path: string[] = []

  const ancestry = await getNodeAncestry(drive, nodeUid, false)
  const [_root, ...children] = ancestry
  for (const ancestor of children) {
    if (ancestor.name.ok) {
      path.push(ancestor.name.value)
    }
  }

  return { path, ancestry }
}

export async function getNodeAncestry(drive: ProtonDriveClient, nodeUid: string, includeSelf: boolean = true) {
  const ancestors: NodeEntity[] = []

  const node = await drive.getNode(nodeUid)
  let currentNode = node
  if (includeSelf) {
    ancestors.push(node)
  }
  while (getParentUid(currentNode)) {
    const parent = await getNodeParent(drive, currentNode)
    if (parent !== null) {
      ancestors.unshift(parent)
      currentNode = parent
    } else {
      break
    }
  }

  return ancestors
}

export async function getNodeParent(drive: ProtonDriveClient, node: NodeEntity) {
  const parentUid = getParentUid(node)
  if (!parentUid) {
    return null
  }
  return drive.getNode(parentUid)
}

export function getParentUid(node: NodeEntity) {
  return node.parentUid
}

export function extractNodeUid(node: NodeEntity) {
  return node.uid
}

export function getIsSharedWithMe(node: NodeEntity, addresses: Address[] | undefined) {
  const ownerEmail = node.ownedBy.email
  const ownerIsCurrentUser = !!findUserAddress(ownerEmail, addresses)
  const isSharedDirectly = node.isShared && node.directRole !== MemberRole.Inherited && !ownerIsCurrentUser
  const isSharedIndirectly = !node.isShared && node.directRole === MemberRole.Inherited && !ownerIsCurrentUser
  return isSharedDirectly || isSharedIndirectly
}

export function getAuthorName(node: NodeEntity) {
  if (node.keyAuthor.ok) {
    return node.keyAuthor.value ?? undefined
  }
}
