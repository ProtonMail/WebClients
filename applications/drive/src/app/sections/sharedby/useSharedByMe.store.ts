import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import type { NodeType } from '@proton/drive';

import { getActionEventManager } from '../../utils/ActionEventManager/ActionEventManager';
import { subscribeToSharedByMeEvents } from './subscribeToSharedByMeEvents';

export type SharedByMeItem = {
    nodeUid: string;
    name: string;
    type: NodeType;
    mediaType: string | undefined;
    thumbnailId: string | undefined;
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
    // Help us knowing if the item is loaded from legacy loader
    isFromLegacy?: boolean;
    /** @deprecated belongs to legacy, prefer using nodeUid */
    shareId: string;
    /** @deprecated belongs to legacy, prefer using parentUid */
    rootShareId: string;
    /** @deprecated belongs to legacy, related to link state from store */
    isLocked?: boolean;
};

interface SharedByMeStore {
    sharedByMeItems: Map<string, SharedByMeItem>;
    itemUids: Set<string>;

    isLoadingNodes: boolean;
    isLoadingLegacyNodes: boolean;

    eventSubscription: (() => void) | null;
    activeContexts: Set<string>;

    setLoadingNodes: (loading: boolean) => void;
    setLoadingLegacyNodes: (loading: boolean) => void;

    setSharedByMeItem: (item: SharedByMeItem) => void;
    updateSharedByMeItem: (uid: string, updates: Partial<SharedByMeItem>) => void;
    removeSharedByMeItem: (uid: string) => void;
    clearAll: () => void;
    cleanupStaleItems: (loadedUids: Set<string>, options?: { legacyCleanup?: boolean }) => void;

    isLoading: () => boolean;

    getSharedByMeItem: (uid: string) => SharedByMeItem | undefined;
    getAllSharedByMeItems: () => SharedByMeItem[];
    getItemUids: () => string[];

    subscribeToEvents: (context: string) => Promise<void>;
    unsubscribeToEvents: (context: string) => Promise<void>;
}

export const useSharedByMeStore = create<SharedByMeStore>()(
    devtools(
        (set, get) => ({
            sharedByMeItems: new Map(),
            itemUids: new Set(),

            isLoadingNodes: false,
            isLoadingLegacyNodes: false,

            eventSubscription: null,
            activeContexts: new Set<string>(),

            setSharedByMeItem: (item: SharedByMeItem) => {
                set((state) => {
                    const newItemUids = new Set(state.itemUids);
                    newItemUids.add(item.nodeUid);

                    const newSharedByMeItems = new Map(state.sharedByMeItems);
                    newSharedByMeItems.set(item.nodeUid, item);
                    return {
                        sharedByMeItems: newSharedByMeItems,
                        itemUids: newItemUids,
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
                    const newItemUids = new Set(state.itemUids);
                    newItemUids.delete(uid);
                    return {
                        sharedByMeItems: newSharedByMeItems,
                        itemUids: newItemUids,
                    };
                });
            },

            clearAll: () => {
                set({
                    sharedByMeItems: new Map(),
                    itemUids: new Set(),
                });
            },

            cleanupStaleItems: (loadedUids: Set<string>, options?: { legacyCleanup?: boolean }) => {
                set((state) => {
                    const newSharedByMeItems = new Map(state.sharedByMeItems);
                    const newItemUids = new Set(state.itemUids);

                    // Find items of the specified type that weren't in the loaded set
                    for (const [uid, item] of state.sharedByMeItems) {
                        const shouldCleanup =
                            !loadedUids.has(item.nodeUid) &&
                            (options?.legacyCleanup ? !!item.isFromLegacy : !item.isFromLegacy);

                        if (shouldCleanup) {
                            newSharedByMeItems.delete(uid);
                            newItemUids.delete(uid);
                        }
                    }

                    return {
                        sharedByMeItems: newSharedByMeItems,
                        itemUids: newItemUids,
                    };
                });
            },

            getItemUids: () => Array.from(get().itemUids),

            getSharedByMeItem: (uid: string) => get().sharedByMeItems.get(uid),
            getAllSharedByMeItems: () => Array.from(get().sharedByMeItems.values()),

            setLoadingNodes: (loading: boolean) => set({ isLoadingNodes: loading }),
            setLoadingLegacyNodes: (loading: boolean) => set({ isLoadingLegacyNodes: loading }),

            isLoading: () => {
                const state = get();
                return state.isLoadingNodes || state.isLoadingLegacyNodes;
            },

            subscribeToEvents: async (context: string) => {
                const { activeContexts, eventSubscription } = get();

                const newActiveContexts = new Set(activeContexts);
                newActiveContexts.add(context);
                set({ activeContexts: newActiveContexts });

                if (eventSubscription) {
                    return;
                }

                const eventManager = getActionEventManager();
                await eventManager.subscribeSdkEventsMyUpdates(context);

                const unsubscribeFromEvents = subscribeToSharedByMeEvents();
                set({ eventSubscription: unsubscribeFromEvents });
            },
            unsubscribeToEvents: async (context: string) => {
                const eventManager = getActionEventManager();
                await eventManager.unsubscribeSdkEventsMyUpdates(context);

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
            name: 'shared-by-me-listing-store',
        }
    )
);
