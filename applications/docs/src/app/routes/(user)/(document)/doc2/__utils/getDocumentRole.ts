import { MemberRole, type NodeEntity } from '@proton/drive/sdk'

export type DocumentRole = 'Admin' | 'Editor' | 'Viewer'

/**
 * The user's role on a document from its node hierarchy, the node first and the root last: the highest role any of
 * them grants, as docs-core `DriveSDK/getRoleFromHierarchy.ts` and `Types/DocumentEntitlements.ts` work it out.
 */
export function getDocumentRole(hierarchy: Pick<NodeEntity, 'directRole'>[]): DocumentRole {
  const roles = hierarchy.map(({ directRole }) => directRole)
  if (roles.includes(MemberRole.Admin)) {
    return 'Admin'
  }
  return roles.includes(MemberRole.Editor) ? 'Editor' : 'Viewer'
}
