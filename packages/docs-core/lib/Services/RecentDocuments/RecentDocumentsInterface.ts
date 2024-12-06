import type { RecentDocumentItem } from './RecentDocumentItem'
import type { RecentDocumentState } from './RecentDocumentState'

export interface RecentDocumentsInterface {
  state: RecentDocumentState
  fetch(): Promise<void>
  trashDocument(recentDocument: RecentDocumentItem): Promise<void>
  getSortedRecents(): RecentDocumentItem[]
}
