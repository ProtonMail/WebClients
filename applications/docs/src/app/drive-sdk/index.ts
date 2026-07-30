import { MemberRole, type NodeEntity } from '@proton/drive'
import { findUserAddress } from '@proton/shared/lib/helpers/address'
import type { Address } from '@proton/shared/lib/interfaces'
import { c } from 'ttag'

export function getNodeName(node: Pick<NodeEntity, 'name'>) {
  if (typeof node.name === 'string') {
    return node.name
  }
  if (node.name.ok) {
    return node.name.value
  }
}

/**
 *
 * @param ancestry root first, most immediate parent last
 */
export function getFullPathFromAncestry(ancestry: NodeEntity[]) {
  const path: string[] = []
  const [_root, ...children] = ancestry
  for (const ancestor of children) {
    if (ancestor.name.ok) {
      path.push(ancestor.name.value)
    }
  }
  return path
}

export function getIsSharedWithMe(node: NodeEntity, addresses: Address[] | undefined) {
  const ownerEmail = node.ownedBy.email
  const ownerIsCurrentUser = !!findUserAddress(ownerEmail, addresses)
  const isSharedDirectly = node.isShared && node.directRole !== MemberRole.Inherited && !ownerIsCurrentUser
  const isSharedIndirectly = !node.isShared && node.directRole === MemberRole.Inherited && !ownerIsCurrentUser
  return isSharedDirectly || isSharedIndirectly
}

export function getAuthorName(author: NodeEntity['keyAuthor']) {
  if (author.ok) {
    if (author.value === null) {
      return c('Label').t`Unknown user`
    }
    return author.value
  }

  if (author.error && author.error.claimedAuthor) {
    return author.error.claimedAuthor
  }

  return c('Label').t`Unknown user`
}
