import { MemberRole, type NodeEntity } from '@proton/drive'

const MemberHierarchy = {
  [MemberRole.Inherited]: 0,
  [MemberRole.Viewer]: 1,
  [MemberRole.Editor]: 2,
  [MemberRole.Admin]: 3,
}

// An explicit role, never Inherited
export type EffectiveRole = Exclude<MemberRole, MemberRole.Inherited>

/**
 *
 * @param hierarchy current node first, root last
 */
export function getRoleFromHierarchy(hierarchy: NodeEntity[]) {
  let highestRole

  for (const ancestor of hierarchy) {
    if (!highestRole) {
      highestRole = ancestor.directRole
      continue
    }

    if (highestRole === MemberRole.Admin) {
      return highestRole
    }

    highestRole = getHigherRole(ancestor.directRole, highestRole)
  }

  return highestRole
}

function getHigherRole(role1: MemberRole, role2: MemberRole): MemberRole {
  return MemberHierarchy[role1] > MemberHierarchy[role2] ? role1 : role2
}
