// Copied from Drive application
import { type DegradedNode, MemberRole, type NodeEntity, type ProtonDriveClient } from '@proton/drive'

const MemberHierarchy = {
  [MemberRole.Inherited]: 0,
  [MemberRole.Viewer]: 1,
  [MemberRole.Editor]: 2,
  [MemberRole.Admin]: 3,
}

type Drive = Pick<ProtonDriveClient, 'getNode'>

// An explicit role, never Inherited
export type EffectiveRole = Exclude<MemberRole, MemberRole.Inherited>

export async function getNodeEffectiveRole(
  drive: Drive,
  node: NodeEntity | DegradedNode,
  role: MemberRole = MemberRole.Inherited,
): Promise<EffectiveRole> {
  role = getHigherRole(node.directRole, role)

  if (role === MemberRole.Admin) {
    return MemberRole.Admin
  }

  if (node.parentUid) {
    const parent = await drive.getNode(node.parentUid)
    const parentNode = parent.ok ? parent.value : parent.error
    role = await getNodeEffectiveRole(drive, parentNode, role)
  }

  if (role === MemberRole.Inherited) {
    console.error('Node has Inherited role and no parent')
    return MemberRole.Viewer
  }

  return role
}

export function getHigherRole(role1: MemberRole, role2: MemberRole): MemberRole {
  return MemberHierarchy[role1] > MemberHierarchy[role2] ? role1 : role2
}
