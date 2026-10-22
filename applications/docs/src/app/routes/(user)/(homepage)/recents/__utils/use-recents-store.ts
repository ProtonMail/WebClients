import type { RecentDocumentsItemValue } from '@proton/docs-core/Services/recent-documents'
import { generateNodeUid } from '@proton/drive/sdk'
import { create } from 'zustand'

interface RecentsStore {
  recentDocuments: { [nodeUid: string]: RecentDocumentsItemValue }
  setRecentDocuments: (documents: RecentDocumentsItemValue[]) => void
  updateDocument: (updatedDocument: RecentDocumentsItemValue) => void
  removeDocument: (nodeUid: string) => void
  removeChildrenOf: (parentFolderUid: string) => void

  recentDocumentsInitialized: boolean
  setInitialized: () => void
}

export const useRecentsStore = create((set): RecentsStore => ({
  recentDocuments: {},

  setRecentDocuments: (documents) =>
    set(() => {
      const recentDocuments: { [nodeUid: string]: RecentDocumentsItemValue } = {}
      for (const document of documents) {
        recentDocuments[generateNodeUid(document.volumeId, document.linkId)] = document
      }
      return { recentDocuments }
    }),

  updateDocument: (updatedDocument) =>
    set((state) => {
      const nodeUid = generateNodeUid(updatedDocument.volumeId, updatedDocument.linkId)
      // Document could be removed while its update was loading - do not restore it
      if (!state.recentDocuments[nodeUid]) {
        return state
      }
      return { recentDocuments: { ...state.recentDocuments, [nodeUid]: updatedDocument } }
    }),

  removeDocument: (nodeUid) =>
    set((state) => {
      const { [nodeUid]: _, ...rest } = state.recentDocuments
      return { recentDocuments: rest }
    }),

  removeChildrenOf: (parentFolderUid) =>
    set((state) => {
      const filteredDocuments: { [nodeUid: string]: RecentDocumentsItemValue } = {}

      for (const documentNodeUid in state.recentDocuments) {
        const document = state.recentDocuments[documentNodeUid]
        if (document.ancestorsNodeUids?.includes(parentFolderUid)) {
          continue
        }
        filteredDocuments[documentNodeUid] = document
      }

      return { recentDocuments: filteredDocuments }
    }),

  recentDocumentsInitialized: false,

  setInitialized: () => set(() => ({ recentDocumentsInitialized: true })),
}))
