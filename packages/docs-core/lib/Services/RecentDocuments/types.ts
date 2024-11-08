export type RecentDocumentServiceState = 'not_fetched' | 'fetching' | 'resolving' | 'done'
export type RecentDocument = {
  linkId: string
  shareId: string
  lastViewed: number
}

export const RecentDocumentStateUpdatedEvent = 'RecentDocumentStateUpdated'

export type EventRecentDocumentStateUpdated = {
  type: typeof RecentDocumentStateUpdatedEvent
  payload: undefined
}

export type RecentDocumentsSnapshotData = {
  name: string
  linkId: string
  parentLinkId?: string
  volumeId: string
  lastViewed: number
  createdBy?: string
  location?: string[]
  isSharedWithMe?: boolean
}

export type RecentDocumentsSnapshot = {
  data: RecentDocumentsSnapshotData[]
  state: RecentDocumentServiceState
}

export interface RecentDocumentsInterface {
  state: RecentDocumentServiceState
  recentDocuments: RecentDocument[]
  getSnapshot(): RecentDocumentsSnapshot
  fetch(): Promise<void>
  trashDocument(recentDocument: RecentDocumentsSnapshotData): Promise<void>
}
