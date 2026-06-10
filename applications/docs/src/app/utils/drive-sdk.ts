import { MemberRole, type DegradedNode, type MaybeNode, type NodeEntity, type ProtonDriveClient } from '@proton/drive'
import { findUserAddress } from '@proton/shared/lib/helpers/address'
import type { Address } from '@proton/shared/lib/interfaces'

export async function getFullPath(drive: ProtonDriveClient, nodeUid: string) {
  const path: string[] = []

  const ancestry = await getNodeAncestry(drive, nodeUid, false)
  const [_root, ...children] = ancestry
  for (const ancestor of children) {
    if (ancestor.ok) {
      path.push(ancestor.value.name)
    }
  }

  return { path, ancestry }
}

export async function getNodeAncestry(drive: ProtonDriveClient, nodeUid: string, includeSelf: boolean = true) {
  const ancestors: MaybeNode[] = []

  const maybeNode = await drive.getNode(nodeUid)
  let currentNode = maybeNode
  if (includeSelf) {
    ancestors.push(maybeNode)
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

export async function getNodeParent(drive: ProtonDriveClient, maybeNode: MaybeNode) {
  const parentUid = getParentUid(maybeNode)
  if (!parentUid) {
    return null
  }
  return drive.getNode(parentUid)
}

export function getParentUid(node: MaybeNode) {
  return node.ok ? node.value.parentUid : node.error.parentUid
}

export function extractNodeUid(node: MaybeNode) {
  return node.ok ? node.value.uid : node.error.uid
}

export function getIsSharedWithMe(node: NodeEntity | DegradedNode, addresses: Address[] | undefined) {
  const ownerEmail = node.ownedBy.email
  const ownerIsCurrentUser = !!findUserAddress(ownerEmail, addresses)
  const isSharedDirectly = node.isShared && node.directRole !== MemberRole.Inherited && !ownerIsCurrentUser
  const isSharedIndirectly = !node.isShared && node.directRole === MemberRole.Inherited && !ownerIsCurrentUser
  return isSharedDirectly || isSharedIndirectly
}
