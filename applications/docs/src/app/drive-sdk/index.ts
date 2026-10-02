import type { NodeEntity } from '@proton/drive'
import { c } from 'ttag'

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

export function getIsSharedWithMe(node: NodeEntity) {
  if (!node.membership) {
    // Not shared directly
    if (node.directRole === 'inherited') {
      // but sits in a shared folder
      return true
    }
  } else {
    // Shared directly
    return true
  }
  return false
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
