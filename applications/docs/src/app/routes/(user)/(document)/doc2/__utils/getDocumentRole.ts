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

/**
 * Whether the user may move, rename and trash the document, and make a copy or a new document next to it: editors
 * and admins, of a document not shared with them directly. The homepage's `DocContextMenu.tsx` `canOrganize` is the same
 * rule.
 */
export function canOrganizeDocument(role: DocumentRole, node: Pick<NodeEntity, 'membership'>) {
  return (role === 'Editor' || role === 'Admin') && !node.membership
}
