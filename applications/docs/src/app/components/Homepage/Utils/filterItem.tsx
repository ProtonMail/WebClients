import type { RecentDocumentItem } from '@proton/docs-core'

export const filterItem = (item: RecentDocumentItem, filter?: string) => {
  if (filter === 'owned-by-me') {
    return !item.isSharedWithMe
  }

  if (filter === 'owned-by-others') {
    return item.isSharedWithMe
  }

  return true
}
