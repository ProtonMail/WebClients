import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import type { NodeType } from '@proton/drive';
import { getBusDriver } from '@proton/drive/internal/BusDriver';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';

import type { SortConfig } from '../../modules/sorting';
import { SortField, sortItems } from '../../modules/sorting';
import { getSharedByMeSortValue } from './sharedByMe.sorting';
import { subscribeToSharedByMeEvents } from './subscribeToSharedByMeEvents';

export type SharedByMeItem = {
    nodeUid: string;
    name: string;
    type: NodeType;
    mediaType: string | undefined;
    activeRevisionUid: string | undefined;
    size: number | undefined;
    parentUid: string | undefined;
    location?: string;
    creationTime?: Date;
    haveSignatureIssues: boolean | undefined;
    // publicLink is optional as it will be dynamically loaded
    publicLink?: {
        expirationTime: Date | undefined;
        numberOfInitializedDownloads: number | undefined;
        url: string;
    };
};

interface SharedByMeStore {
    sharedByMeItems: Map<string, SharedByMeItem>;
    sortedItemUids: Set<string>;

    sortField: SortField;
    direction: SORT_DIRECTION;
    sortConfig: SortConfig | undefined;

    isLoading: boolean;
    hasEverLoaded: boolean;

    eventSubscription: (() => void) | null;
    activeContexts: Set<string>;

    setLoading: (loading: boolean) => void;
    setHasEverLoaded: () => void;
    checkAndSetHasEverLoaded: () => void;

    setSharedByMeItem: (item: SharedByMeItem) => void;
    updateSharedByMeItem: (uid: string, updates: Partial<SharedByMeItem>) => void;
    removeSharedByMeItem: (uid: string) => void;
    clearAll: () => void;

    getSharedByMeItem: (uid: string) => SharedByMeItem | undefined;

    setSorting: (params: { sortField: SortField; direction: SORT_DIRECTION; sortConfig: SortConfig }) => void;

    subscribeToEvents: (context: string) => Promise<void>;
    unsubscribeToEvents: (context: string) => Promise<void>;
}

export const useSharedByMeStore = create<SharedByMeStore>()(
    devtools(
        (set, get) => ({
            sharedByMeItems: new Map(),
            sortedItemUids: new Set(),

            sortField: SortField.name,
            direction: SORT_DIRECTION.ASC,
            sortConfig: undefined,

            isLoading: false,
            hasEverLoaded: false,

            eventSubscription: null,
            eventPhotosSubscription: null,
            activeContexts: new Set<string>(),

            setSharedByMeItem: (item: SharedByMeItem) => {
                set((state) => {
                    const newSortedItemUids = new Set(state.sortedItemUids);
                    newSortedItemUids.add(item.nodeUid);

                    const newSharedByMeItems = new Map(state.sharedByMeItems);
                    newSharedByMeItems.set(item.nodeUid, item);
                    return {
                        sharedByMeItems: newSharedByMeItems,
                        sortedItemUids: newSortedItemUids,
                    };
                });
            },

            updateSharedByMeItem: (uid: string, updates: Partial<SharedByMeItem>) => {
                set((state) => {
                    const existingItem = state.sharedByMeItems.get(uid);
                    if (!existingItem) {
                        return state;
                    }

                    const updatedItem = { ...existingItem, ...updates };
                    const newSharedByMeItems = new Map(state.sharedByMeItems);
                    newSharedByMeItems.set(uid, updatedItem);

                    return {
                        ...state,
                        sharedByMeItems: newSharedByMeItems,
                    };
                });
            },

            removeSharedByMeItem: (uid: string) => {
                set((state) => {
                    const newSharedByMeItems = new Map(state.sharedByMeItems);
                    newSharedByMeItems.delete(uid);
                    const newSortedItemUids = new Set<string>();
                    for (const id of state.sortedItemUids) {
                        if (id !== uid) {
                            newSortedItemUids.add(id);
                        }
                    }
                    return {
                        sharedByMeItems: newSharedByMeItems,
                        sortedItemUids: newSortedItemUids,
                    };
                });
            },

            clearAll: () => {
                set({
                    sharedByMeItems: new Map(),
                    sortedItemUids: new Set(),
                    sortConfig: undefined,
                });
            },

            getSharedByMeItem: (uid: string) => get().sharedByMeItems.get(uid),

            setSorting: ({ sortField, direction, sortConfig }) => {
                const allItems = Array.from(get().sharedByMeItems.values());
                const sortedUids = sortItems(
                    allItems,
                    sortConfig,
                    direction,
                    getSharedByMeSortValue,
                    (item) => item.nodeUid
                );
                set({ sortField, direction, sortConfig, sortedItemUids: new Set(sortedUids) });
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
                const { activeContexts } = get();

                const newActiveContexts = new Set(activeContexts);
                newActiveContexts.add(context);
                set({ activeContexts: newActiveContexts });

                const eventManager = getBusDriver();
                await Promise.all([
                    eventManager.subscribeSdkEventsMyUpdates(context),
                    eventManager.subscribePhotosEventsMyUpdates(context),
                ]);

                const unsubscribeFromEvents = subscribeToSharedByMeEvents();
                set({ eventSubscription: unsubscribeFromEvents });
            },
            unsubscribeToEvents: async (context: string) => {
                const eventManager = getBusDriver();
                await Promise.all([
                    eventManager.unsubscribeSdkEventsMyUpdates(context),
                    eventManager.unsubscribePhotosEventsMyUpdates(context),
                ]);

                const { activeContexts, eventSubscription } = get();
                const newActiveContexts = new Set(activeContexts);
                newActiveContexts.delete(context);
                set({ activeContexts: newActiveContexts });

                if (newActiveContexts.size === 0 && eventSubscription) {
                    eventSubscription();
                    set({ eventSubscription: null });
                }
            },
        }),
        {
            name: 'shared-by-me-store',
        }
    )
);
