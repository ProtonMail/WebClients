import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import type { Member, MemberRole } from '@proton/drive';

export interface AlbumItem {
    nodeUid: string;
    coverNodeUid: string | undefined;
    photoCount: number | undefined;
    lastActivityTime: Date;
    name: string;
    createTime: Date;
    isShared: boolean;
    directRole: MemberRole;
    isOwner: boolean;
    members?: Member[];
    photoNodeUids?: Set<string>;
    hasSignatureIssues: boolean;
    ownedBy: string | undefined;
    /** @deprecated Only used internally for legacy URL routing. */
    deprecatedShareId: string | undefined;
}

interface AlbumsStore {
    albums: Map<string, AlbumItem>;
    albumsUids: string[];
    isLoadingList: boolean;
    hasEverLoadedList: boolean;

    currentAlbumNodeUid: string | undefined;
    getCurrentAlbum: () => AlbumItem | undefined;
    isLoading: boolean;
    hasEverLoaded: boolean;

    setAlbums: (albums: AlbumItem[]) => void;
    upsertAlbums: (albums: AlbumItem[]) => void;
    upsertAlbum: (album: AlbumItem) => void;
    removeAlbum: (nodeUid: string) => void;
    setLoadingList: (loading: boolean) => void;

    setCurrentAlbum: (album: AlbumItem) => void;
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

const sortAlbumUidsByLastActivity = (uids: string[], albums: Map<string, AlbumItem>): string[] =>
    [...uids].sort((a, b) => {
        const timeA = albums.get(a)?.lastActivityTime.getTime() ?? 0;
        const timeB = albums.get(b)?.lastActivityTime.getTime() ?? 0;
        return timeB - timeA;
    });

export const useAlbumsStore = create<AlbumsStore>()(
    devtools((set, get) => ({
        albums: new Map(),
        albumsUids: [],
        isLoadingList: false,
        hasEverLoadedList: false,

        currentAlbumNodeUid: undefined,
        getCurrentAlbum: () => {
            const state = get();
            return state.currentAlbumNodeUid ? state.albums.get(state.currentAlbumNodeUid) : undefined;
        },
        isLoading: false,
        hasEverLoaded: false,

        setAlbums: (albums) => {
            const map = new Map(albums.map((a) => [a.nodeUid, a]));
            const albumsUids = sortAlbumUidsByLastActivity(
                albums.map((a) => a.nodeUid),
                map
            );
            set({ albums: map, albumsUids, isLoadingList: false, hasEverLoadedList: true });
        },

        upsertAlbums: (albums) => {
            set((state) => {
                const newAlbums = new Map(state.albums);
                const newUids = [...state.albumsUids];
                for (const album of albums) {
                    if (!newAlbums.has(album.nodeUid)) {
                        newUids.push(album.nodeUid);
                    }
                    const existing = newAlbums.get(album.nodeUid);
                    newAlbums.set(album.nodeUid, { photoNodeUids: existing?.photoNodeUids, ...album });
                }
                return { albums: newAlbums, albumsUids: sortAlbumUidsByLastActivity(newUids, newAlbums) };
            });
        },

        upsertAlbum: (album) => {
            get().upsertAlbums([album]);
        },

        removeAlbum: (nodeUid) => {
            set((state) => {
                const albums = new Map(state.albums);
                albums.delete(nodeUid);
                return { albums, albumsUids: state.albumsUids.filter((uid) => uid !== nodeUid) };
            });
        },

        setLoadingList: (loading) => {
            set({ isLoadingList: loading });
        },

        setCurrentAlbum: (album) => {
            set((state) => {
                const existing = state.albums.get(album.nodeUid);
                const newAlbums = new Map(state.albums);
                newAlbums.set(album.nodeUid, {
                    ...album,
                    photoNodeUids:
                        state.currentAlbumNodeUid === album.nodeUid ? existing?.photoNodeUids : new Set<string>(),
                });
                return { albums: newAlbums, currentAlbumNodeUid: album.nodeUid };
            });
        },

        setCoverNodeUid: (coverNodeUid: string) => {
            set((state) => {
                if (!state.currentAlbumNodeUid) {
                    return state;
                }
                const albums = new Map(state.albums);
                const existing = albums.get(state.currentAlbumNodeUid);
                if (existing) {
                    albums.set(state.currentAlbumNodeUid, { ...existing, coverNodeUid });
                }
                return { albums };
            });
        },

        clearCurrentAlbum: () => {
            set({ currentAlbumNodeUid: undefined, isLoading: false, hasEverLoaded: false });
        },

        setPhotoNodeUids: (uids: string[]) => {
            set((state) => {
                if (!state.currentAlbumNodeUid) {
                    return state;
                }
                const albums = new Map(state.albums);
                const existing = albums.get(state.currentAlbumNodeUid);
                if (!existing) {
                    return state;
                }
                albums.set(state.currentAlbumNodeUid, {
                    ...existing,
                    photoNodeUids: new Set(uids),
                    photoCount: uids.length,
                });
                return { albums };
            });
        },

        addPhotoNodeUids: (uids: string[]) => {
            set((state) => {
                if (!state.currentAlbumNodeUid) {
                    return state;
                }
                const albums = new Map(state.albums);
                const existing = albums.get(state.currentAlbumNodeUid);
                if (!existing) {
                    return state;
                }
                const newPhotoNodeUids = new Set(existing.photoNodeUids);
                const newUids = uids.filter((uid) => !newPhotoNodeUids.has(uid));
                for (const uid of newUids) {
                    newPhotoNodeUids.add(uid);
                }
                albums.set(state.currentAlbumNodeUid, {
                    ...existing,
                    photoNodeUids: newPhotoNodeUids,
                    photoCount: (existing.photoCount ?? 0) + newUids.length,
                });
                return { albums };
            });
        },

        addPhotoNodeUid: (uid: string) => {
            set((state) => {
                if (!state.currentAlbumNodeUid) {
                    return state;
                }
                const albums = new Map(state.albums);
                const existing = albums.get(state.currentAlbumNodeUid);
                if (!existing) {
                    return state;
                }
                if (existing.photoNodeUids?.has(uid)) {
                    return state;
                }
                const newPhotoNodeUids = new Set(existing.photoNodeUids);
                newPhotoNodeUids.add(uid);
                albums.set(state.currentAlbumNodeUid, {
                    ...existing,
                    photoNodeUids: newPhotoNodeUids,
                    photoCount: (existing.photoCount ?? 0) + 1,
                });
                return { albums };
            });
        },

        removePhotoNodeUids: (uids: string[]) => {
            set((state) => {
                if (!state.currentAlbumNodeUid) {
                    return state;
                }
                const albums = new Map(state.albums);
                const existing = albums.get(state.currentAlbumNodeUid);
                if (!existing) {
                    return state;
                }
                const newPhotoNodeUids = new Set(existing.photoNodeUids);
                for (const uid of uids) {
                    newPhotoNodeUids.delete(uid);
                }
                albums.set(state.currentAlbumNodeUid, {
                    ...existing,
                    photoNodeUids: newPhotoNodeUids,
                    photoCount: Math.max(0, (existing.photoCount ?? 0) - uids.length),
                });
                return { albums };
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
