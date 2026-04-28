import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

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
    photoItems: Map<string, PhotoItem>;

    isLoading: boolean;
    hasEverLoaded: boolean;

    eventSubscription: (() => void) | null;
    activeContexts: Set<string>;

    setPhotoItem: (photo: PhotoItem) => void;
    setPhotoItems: (photos: PhotoItem[]) => void;
    getPhotoItem: (uid: string) => PhotoItem | undefined;
    upsertPhotoAdditionalInfo: (photo: PhotoItem) => void;
    removePhotoItem: (uid: string) => void;

    setPhotoItemWithoutTimeline: (photo: PhotoItem) => void;
    addRelatedPhotoNodeUid: (mainPhotoNodeUid: string, relatedPhotoNodeUid: string) => void;

    setLoading: (loading: boolean) => void;
    setHasEverLoaded: () => void;
    checkAndSetHasEverLoaded: () => void;

    subscribeToEvents: (context: string) => Promise<void>;
    unsubscribeFromEvents: (context: string) => Promise<void>;
}

export const usePhotosStore = create<PhotosStore>()(
    devtools((set, get) => ({
        photoTimelineUids: new Set(),
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

        upsertPhotoAdditionalInfo: (photo: PhotoItem) => {
            set((state) => {
                const newPhotoItems = new Map(state.photoItems);
                const existing = newPhotoItems.get(photo.nodeUid);
                newPhotoItems.set(
                    photo.nodeUid,
                    existing ? { ...photo, additionalInfo: photo.additionalInfo ?? existing.additionalInfo } : photo
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

                return {
                    ...state,
                    photoItems: newPhotoItems,
                    photoTimelineUids: newPhotoTimelineUids,
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

        addRelatedPhotoNodeUid: (mainPhotoNodeUid: string, relatedPhotoNodeUid: string) => {
            set((state) => {
                const existing = state.photoItems.get(mainPhotoNodeUid);
                if (!existing || existing.relatedPhotoNodeUids.includes(relatedPhotoNodeUid)) {
                    return state;
                }
                const newPhotoItems = new Map(state.photoItems);
                newPhotoItems.set(mainPhotoNodeUid, {
                    ...existing,
                    relatedPhotoNodeUids: [...existing.relatedPhotoNodeUids, relatedPhotoNodeUid],
                });
                return { photoItems: newPhotoItems };
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
