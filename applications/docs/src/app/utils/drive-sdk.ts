import type { MaybeNode, ProtonDriveClient } from '@proton/drive'

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

export async function isSharedWithUser(drive: ProtonDriveClient, user: { Email: string }, nodeUid: string) {
  const sharingInfo = await drive.getSharingInfo(nodeUid)
  const currentUserSharingMembership = sharingInfo?.members.find((member) => {
    return member.inviteeEmail === user.Email
  })
  return !!currentUserSharingMembership
}
