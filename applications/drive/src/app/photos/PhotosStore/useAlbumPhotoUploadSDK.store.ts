import { create } from 'zustand';

// TODO: Remove this store once uploadManager.uploadPhotos accepts an albumNodeUid and emits
// CREATED_NODES with the album's treeEventScopeId so subscribeToPhotosEvents handles it natively.
interface AlbumPhotoUploadStore {
    pendingUploads: Map<string, string>;
    setContext: (uploadId: string, albumNodeUid: string) => void;
    getContext: (uploadId: string) => string | undefined;
    deleteContext: (uploadId: string) => void;
    hasPendingUploads: () => boolean;
}

export const useAlbumPhotoUploadSDKStore = create<AlbumPhotoUploadStore>((set, get) => ({
    pendingUploads: new Map(),

    setContext: (uploadId, albumNodeUid) =>
        set((state) => {
            const next = new Map(state.pendingUploads);
            next.set(uploadId, albumNodeUid);
            return { pendingUploads: next };
        }),

    getContext: (uploadId) => get().pendingUploads.get(uploadId),

    deleteContext: (uploadId) =>
        set((state) => {
            const next = new Map(state.pendingUploads);
            next.delete(uploadId);
            return { pendingUploads: next };
        }),

    hasPendingUploads: () => get().pendingUploads.size > 0,
}));
