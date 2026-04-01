import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import type { Member } from '@proton/drive';

export interface AlbumItem {
    nodeUid: string;
    name: string;
    coverNodeUid: string | undefined;
    photoCount: number | undefined;
    photoNodeUids: Set<string>;
    lastActivityTime: Date;
    members?: Member[];
}

interface AlbumsStore {
    currentAlbum: AlbumItem | undefined;

    isLoading: boolean;
    hasEverLoaded: boolean;

    setCurrentAlbum: (album: Omit<AlbumItem, 'photoNodeUids'>) => void;
    setCoverNodeUid: (coverNodeUid: string) => void;
    clearCurrentAlbum: () => void;

    setPhotoNodeUids: (uids: string[]) => void;
    addPhotoNodeUids: (uids: string[]) => void;
    addPhotoNodeUid: (uid: string) => void;
    removePhotoNodeUids: (uids: string[]) => void;

    setLoading: (loading: boolean) => void;
    setHasEverLoaded: () => void;
    checkAndSetHasEverLoaded: () => void;
}

export const useAlbumsStore = create<AlbumsStore>()(
    devtools((set, get) => ({
        currentAlbum: undefined,

        isLoading: false,
        hasEverLoaded: false,

        setCurrentAlbum: (album) => {
            set((state) => {
                const existingUids =
                    state.currentAlbum?.nodeUid === album.nodeUid
                        ? state.currentAlbum.photoNodeUids
                        : new Set<string>();
                return { currentAlbum: { ...album, photoNodeUids: existingUids } };
            });
        },

        setCoverNodeUid: (coverNodeUid: string) => {
            set((state) => {
                if (!state.currentAlbum) {
                    return state;
                }
                return { currentAlbum: { ...state.currentAlbum, coverNodeUid } };
            });
        },

        clearCurrentAlbum: () => {
            set({ currentAlbum: undefined, isLoading: false, hasEverLoaded: false });
        },

        setPhotoNodeUids: (uids: string[]) => {
            set((state) => {
                if (!state.currentAlbum) {
                    return state;
                }
                return {
                    currentAlbum: {
                        ...state.currentAlbum,
                        photoNodeUids: new Set(uids),
                        photoCount: uids.length,
                    },
                };
            });
        },

        addPhotoNodeUids: (uids: string[]) => {
            set((state) => {
                if (!state.currentAlbum) {
                    return state;
                }
                const newPhotoNodeUids = new Set(state.currentAlbum.photoNodeUids);
                const newUids = uids.filter((uid) => !newPhotoNodeUids.has(uid));
                for (const uid of newUids) {
                    newPhotoNodeUids.add(uid);
                }
                return {
                    currentAlbum: {
                        ...state.currentAlbum,
                        photoNodeUids: newPhotoNodeUids,
                        photoCount: (state.currentAlbum.photoCount ?? 0) + newUids.length,
                    },
                };
            });
        },

        addPhotoNodeUid: (uid: string) => {
            set((state) => {
                if (!state.currentAlbum) {
                    return state;
                }
                if (state.currentAlbum.photoNodeUids.has(uid)) {
                    return state;
                }
                const newPhotoNodeUids = new Set(state.currentAlbum.photoNodeUids);
                newPhotoNodeUids.add(uid);
                return {
                    currentAlbum: {
                        ...state.currentAlbum,
                        photoNodeUids: newPhotoNodeUids,
                        photoCount: (state.currentAlbum.photoCount ?? 0) + 1,
                    },
                };
            });
        },

        removePhotoNodeUids: (uids: string[]) => {
            set((state) => {
                if (!state.currentAlbum) {
                    return state;
                }
                const newPhotoNodeUids = new Set(state.currentAlbum.photoNodeUids);
                for (const uid of uids) {
                    newPhotoNodeUids.delete(uid);
                }
                return {
                    currentAlbum: {
                        ...state.currentAlbum,
                        photoNodeUids: newPhotoNodeUids,
                        photoCount: Math.max(0, (state.currentAlbum.photoCount ?? 0) - uids.length),
                    },
                };
            });
        },

        setLoading: (loading: boolean) => {
            set({ isLoading: loading });
            get().checkAndSetHasEverLoaded();
        },

        setHasEverLoaded: () => set({ hasEverLoaded: true }),

        checkAndSetHasEverLoaded: () => {
            const state = get();
            if (!state.isLoading && !state.hasEverLoaded) {
                state.setHasEverLoaded();
            }
        },
    }))
);
