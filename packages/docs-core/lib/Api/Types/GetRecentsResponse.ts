export type RecentDocumentAPIItem = {
  VolumeID: string
  LinkID: string
  LastOpenTime: number
  ContextShareID: string
  AncestorIDs: string[]
}

export type GetRecentsResponse = {
  RecentDocuments: RecentDocumentAPIItem[]
  Code: '1000'
}
