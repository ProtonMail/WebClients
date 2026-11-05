type RecentDocumentsItemLocation = { type: 'root' } | { type: 'path'; path: string[] } | { type: 'shared-with-me' }

export type RecentDocumentsItemValue = {
  type: 'document' | 'spreadsheet'
  name: string
  linkId: string
  parentLinkId: string | undefined
  volumeId: string
  lastViewed: ServerTime
  lastModified: ServerTime
  createdBy: string | undefined
  location: RecentDocumentsItemLocation
  isSharedWithMe: boolean
  shareId: string
  // Available (and used) only when RecentDocumentsItem is used with SDK; in order from root to direct parent
  ancestorsNodeUids?: string[]
  // Available (and used) only when RecentDocumentsItem is used with SDK
  effectiveRole?: 'viewer' | 'editor' | 'admin' | 'inherited'
}

type ServerTime = { serverTimestamp: number; date: Date }
