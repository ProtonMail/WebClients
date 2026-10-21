import type { NodeEntity } from '@proton/drive/sdk'

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
