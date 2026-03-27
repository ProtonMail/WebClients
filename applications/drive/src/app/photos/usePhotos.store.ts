import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { splitNodeUid } from '@proton/drive';
import { getBusDriver } from '@proton/drive/internal/BusDriver';
import type { PhotoTag } from '@proton/shared/lib/interfaces/drive/file';

import { subscribeToPhotosEvents } from './subscribeToPhotosEvents';

export type PhotoGroup = string;
export type PhotoGridItem = PhotoItem | PhotoGroup;

export interface PhotoAdditionalInfo {
    name: string;
    mediaType: string | undefined;
    duration: number | undefined;
    haveSignatureIssues: boolean | undefined;
    isShared: boolean;
    parentNodeUid: string | undefined;
    activeRevisionUid: string | undefined;
    /** @deprecated */
    deprecatedShareId: string | undefined;
}

export interface PhotoItem {
    nodeUid: string;
    captureTime: Date;
    tags: PhotoTag[];
    relatedPhotoNodeUids: string[];
    additionalInfo?: PhotoAdditionalInfo;
}

interface PhotosStore {
    photoTimelineUids: Set<string>;
    albumPhotoUids: Set<string>;
    photoItems: Map<string, PhotoItem>;

    isLoading: boolean;
    hasEverLoaded: boolean;

    eventSubscription: (() => void) | null;
    activeContexts: Set<string>;

    setPhotoItem: (photo: PhotoItem) => void;
    setPhotoItems: (photos: PhotoItem[]) => void;
    getPhotoItem: (uid: string) => PhotoItem | undefined;
    upsertPhotoAdditionalInfo: (uid: string, additionalInfo: PhotoAdditionalInfo) => void;
    removePhotoItem: (uid: string) => void;

    setPhotoItemWithoutTimeline: (photo: PhotoItem) => void;
    setAlbumPhotoItems: (photos: PhotoItem[]) => void;
    addAlbumPhotoItem: (photo: PhotoItem) => void;
    removeAlbumPhotoItemsByLinkIds: (linkIds: string[]) => void;
    clearAlbumPhotoUids: () => void;

    setLoading: (loading: boolean) => void;
    setHasEverLoaded: () => void;
    checkAndSetHasEverLoaded: () => void;

    subscribeToEvents: (context: string) => Promise<void>;
    unsubscribeFromEvents: (context: string) => Promise<void>;
}

export const usePhotosStore = create<PhotosStore>()(
    devtools((set, get) => ({
        photoTimelineUids: new Set(),
        albumPhotoUids: new Set(),
        photoItems: new Map(),

        isLoading: false,
        hasEverLoaded: false,

        eventSubscription: null,
        activeContexts: new Set<string>(),

        setPhotoItem: (photo: PhotoItem) => {
            set((state) => {
                const newPhotoTimelineUids = new Set(state.photoTimelineUids);
                newPhotoTimelineUids.add(photo.nodeUid);

                const newPhotoItems = new Map(state.photoItems);
                newPhotoItems.set(photo.nodeUid, photo);
                return {
                    photoItems: newPhotoItems,
                    photoTimelineUids: newPhotoTimelineUids,
                };
            });
        },

        setPhotoItems: (photos: PhotoItem[]) => {
            set((state) => {
                const newPhotoTimelineUids = new Set(state.photoTimelineUids);
                const newPhotoItems = new Map(state.photoItems);
                for (const photo of photos) {
                    newPhotoTimelineUids.add(photo.nodeUid);
                    const existing = newPhotoItems.get(photo.nodeUid);
                    newPhotoItems.set(photo.nodeUid, {
                        ...photo,
                        additionalInfo: photo.additionalInfo ?? existing?.additionalInfo,
                    });
                }
                return {
                    photoItems: newPhotoItems,
                    photoTimelineUids: newPhotoTimelineUids,
                };
            });
        },

        getPhotoItem: (uid: string) => get().photoItems.get(uid),

        upsertPhotoAdditionalInfo: (uid: string, additionalInfo: PhotoAdditionalInfo) => {
            set((state) => {
                const newPhotoItems = new Map(state.photoItems);
                const existing = newPhotoItems.get(uid);
                newPhotoItems.set(
                    uid,
                    existing
                        ? { ...existing, additionalInfo }
                        : { nodeUid: uid, captureTime: new Date(0), tags: [], relatedPhotoNodeUids: [], additionalInfo }
                );
                return { photoItems: newPhotoItems };
            });
        },

        removePhotoItem: (uid: string) => {
            set((state) => {
                const newPhotoItems = new Map(state.photoItems);
                newPhotoItems.delete(uid);

                const newPhotoTimelineUids = new Set(state.photoTimelineUids);
                newPhotoTimelineUids.delete(uid);

                const newAlbumPhotoUids = new Set(state.albumPhotoUids);
                newAlbumPhotoUids.delete(uid);

                return {
                    ...state,
                    photoItems: newPhotoItems,
                    photoTimelineUids: newPhotoTimelineUids,
                    albumPhotoUids: newAlbumPhotoUids,
                };
            });
        },

        setPhotoItemWithoutTimeline: (photo: PhotoItem) => {
            set((state) => {
                const newPhotoItems = new Map(state.photoItems);
                const existing = newPhotoItems.get(photo.nodeUid);
                newPhotoItems.set(photo.nodeUid, {
                    ...photo,
                    additionalInfo: photo.additionalInfo ?? existing?.additionalInfo,
                });
                return { photoItems: newPhotoItems };
            });
        },

        setAlbumPhotoItems: (photos: PhotoItem[]) => {
            set((state) => {
                const newAlbumPhotoUids = new Set(state.albumPhotoUids);
                const newPhotoItems = new Map(state.photoItems);
                for (const photo of photos) {
                    newAlbumPhotoUids.add(photo.nodeUid);
                    const existing = newPhotoItems.get(photo.nodeUid);
                    newPhotoItems.set(photo.nodeUid, {
                        ...photo,
                        additionalInfo: photo.additionalInfo ?? existing?.additionalInfo,
                    });
                }
                return {
                    photoItems: newPhotoItems,
                    albumPhotoUids: newAlbumPhotoUids,
                };
            });
        },

        addAlbumPhotoItem: (photo: PhotoItem) => {
            set((state) => {
                const newAlbumPhotoUids = new Set(state.albumPhotoUids);
                newAlbumPhotoUids.add(photo.nodeUid);

                const newPhotoItems = new Map(state.photoItems);
                const existing = newPhotoItems.get(photo.nodeUid);
                newPhotoItems.set(photo.nodeUid, {
                    ...photo,
                    additionalInfo: photo.additionalInfo ?? existing?.additionalInfo,
                });

                return {
                    photoItems: newPhotoItems,
                    albumPhotoUids: newAlbumPhotoUids,
                };
            });
        },

        removeAlbumPhotoItemsByLinkIds: (linkIds: string[]) => {
            set((state) => {
                const newAlbumPhotoUids = new Set(state.albumPhotoUids);
                const newPhotoItems = new Map(state.photoItems);
                const linkIdSet = new Set(linkIds);
                for (const nodeUid of state.albumPhotoUids) {
                    const { nodeId: linkId } = splitNodeUid(nodeUid);
                    if (linkIdSet.has(linkId)) {
                        newAlbumPhotoUids.delete(nodeUid);
                        if (!state.photoTimelineUids.has(nodeUid)) {
                            newPhotoItems.delete(nodeUid);
                        }
                    }
                }
                return { albumPhotoUids: newAlbumPhotoUids, photoItems: newPhotoItems };
            });
        },

        clearAlbumPhotoUids: () => {
            set((state) => {
                const newPhotoItems = new Map(state.photoItems);
                for (const nodeUid of state.albumPhotoUids) {
                    if (!state.photoTimelineUids.has(nodeUid)) {
                        newPhotoItems.delete(nodeUid);
                    }
                }
                return { albumPhotoUids: new Set(), photoItems: newPhotoItems };
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

        subscribeToEvents: async (context: string) => {
            const { activeContexts, eventSubscription } = get();

            const newActiveContexts = new Set(activeContexts);
            newActiveContexts.add(context);
            set({ activeContexts: newActiveContexts });

            await getBusDriver().subscribePhotosEventsMyUpdates(context);

            if (eventSubscription) {
                eventSubscription();
            }
            const unsubscribeFromEvents = subscribeToPhotosEvents();
            set({ eventSubscription: unsubscribeFromEvents });
        },

        unsubscribeFromEvents: async (context: string) => {
            await getBusDriver().unsubscribePhotosEventsMyUpdates(context);

            const { activeContexts, eventSubscription } = get();
            const newActiveContexts = new Set(activeContexts);
            newActiveContexts.delete(context);
            set({ activeContexts: newActiveContexts });

            if (newActiveContexts.size === 0 && eventSubscription) {
                eventSubscription();
                set({ eventSubscription: null });
            }
        },
    }))
);
