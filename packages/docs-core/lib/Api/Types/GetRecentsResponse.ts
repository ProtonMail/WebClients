export type RecentDocumentAPIItem = {
  VolumeID: string
  LinkID: string
  LastOpenTime: number
  ContextShareID: string
  // Most immediate parent first, root last (My files root, or the share root for items shared with me)
  AncestorIDs: string[]
}

export type GetRecentsResponse = {
  RecentDocuments: RecentDocumentAPIItem[]
  Code: '1000'
}
