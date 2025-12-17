import { create } from 'zustand';

interface AlbumUploadContext {
    albumShareId: string;
    albumLinkId: string;
    isOwner: boolean;
}

interface AlbumPhotoUploadSDKStore {
    contexts: Record<string, AlbumUploadContext>;
    setContext: (uploadId: string, context: AlbumUploadContext) => void;
    getContext: (uploadId: string) => AlbumUploadContext | undefined;
    deleteContext: (uploadId: string) => void;
    hasPendingUploads: () => boolean;
    clear: () => void;
}

/**
 * TEMPORARY SOLUTION: Store for managing album photo SDK upload contexts across component lifecycle.
 *
 * When a user uploads photos to an album using the SDK upload flow, we need to automatically add
 * those photos to the album. This store persists the album context (shareId, linkId) for each upload
 * so they can be added to the correct album even if the user navigates away during upload.
 *
 * The PhotosLayout component subscribes to SDK upload events and uses this store to match completed
 * uploads with their target albums.
 */
export const useAlbumPhotoUploadSDKStore = create<AlbumPhotoUploadSDKStore>((set, get) => {
    return {
        contexts: {},

        setContext: (uploadId: string, context: AlbumUploadContext) => {
            set((state) => {
                return {
                    contexts: {
                        ...state.contexts,
                        [uploadId]: context,
                    },
                };
            });
        },

        getContext: (uploadId: string) => {
            return get().contexts[uploadId];
        },

        deleteContext: (uploadId: string) => {
            set((state) => {
                delete state.contexts[uploadId];
                return { contexts: state.contexts };
            });
        },

        hasPendingUploads: () => {
            return Object.keys(get().contexts).length > 0;
        },

        clear: () => {
            set({ contexts: {} });
        },
    };
});
