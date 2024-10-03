import type { RecentDocument } from './types'

const StubRecentDocumentLocalStorageKey = 'recentDocuments'

export const RecentDocumentsLocalStorage = {
  load(): RecentDocument[] {
    const serializedRecentDocuments = localStorage.getItem(StubRecentDocumentLocalStorageKey)
    if (typeof serializedRecentDocuments !== 'string') {
      return []
    }

    const parsed = JSON.parse(serializedRecentDocuments)

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed as RecentDocument[]
  },

  add(documentToAdd: RecentDocument) {
    const newRecents = RecentDocumentsLocalStorage.load()
    const foundIndex = newRecents.findIndex((documentToCompare) => documentToCompare.linkId === documentToAdd.linkId)
    if (foundIndex !== -1) {
      newRecents.splice(foundIndex, 1)
    }

    newRecents.unshift(documentToAdd)
    RecentDocumentsLocalStorage.persist(newRecents)
  },

  persist(recentDocuments: RecentDocument[]) {
    localStorage.setItem(StubRecentDocumentLocalStorageKey, JSON.stringify(recentDocuments))
  },

  clear() {
    localStorage.removeItem(StubRecentDocumentLocalStorageKey)
  },
}
