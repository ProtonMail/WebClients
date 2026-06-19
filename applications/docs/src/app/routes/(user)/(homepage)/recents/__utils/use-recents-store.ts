import type { RecentDocumentsItemValue } from '@proton/docs-core/lib/Services/recent-documents'
import type { Address } from '@proton/shared/lib/interfaces/Address'
import { generateNodeUid } from '@proton/drive'
import { create } from 'zustand'

interface RecentsStore {
  recentDocuments: { [nodeUid: string]: RecentDocumentsItemValue }
  setRecentDocuments: (documents: RecentDocumentsItemValue[]) => void
  setDocument: (updatedDocument: RecentDocumentsItemValue) => void
  removeDocument: (nodeUid: string) => void
  removeChildrenOf: (parentFolderUid: string) => void

  recentDocumentsInitialized: boolean
  setInitialized: () => void

  addresses: Address[]
  setAddresses: (addresses: Address[]) => void
}

export const useRecentsStore = create(
  (set): RecentsStore => ({
    recentDocuments: {},

    setRecentDocuments: (documents) =>
      set(() => {
        const recentDocuments: { [nodeUid: string]: RecentDocumentsItemValue } = {}
        for (const document of documents) {
          recentDocuments[generateNodeUid(document.volumeId, document.linkId)] = document
        }
        return { recentDocuments }
      }),

    setDocument: (updatedDocument) =>
      set((state) => ({
        recentDocuments: {
          ...state.recentDocuments,
          [generateNodeUid(updatedDocument.volumeId, updatedDocument.linkId)]: updatedDocument,
        },
      })),

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

    addresses: [],

    setAddresses: (addresses) => set(() => ({ addresses })),
  }),
)
