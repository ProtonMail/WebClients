import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { BusDriverEventName, getBusDriver } from '@proton/drive/internal/BusDriver';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';

import { type SortConfig, SortField, sortItems } from '../../modules/sorting';
import { handleSdkError } from '../../utils/errorHandling/handleSdkError';
import { getNodeEntity } from '../../utils/sdk/getNodeEntity';
import { getSignatureIssues } from '../../utils/sdk/getSignatureIssues';
import { useInvitationCountStore } from '../../zustand/share/invitationCount.store';
import { getSharedWithMeSortValue } from './sharedWithMe.sorting';
import { type BookmarkItem, type DirectShareItem, type InvitationItem, ItemType, type SharedWithMeItem } from './types';

export { ItemType };
export type { BookmarkItem, DirectShareItem, InvitationItem, SharedWithMeItem };

type SharedWithMeStore = {
    sharedWithMeItems: Map<string, SharedWithMeItem>;
    itemUids: Set<string>;
    itemsWithInvitationPosition: Set<string>;
    hasEverLoaded: boolean;
    sortedItemUids: string[];

    sortField: SortField;
    direction: SORT_DIRECTION;
    sortedRegularItemUids: string[] | null;

    isLoadingNodes: boolean;
    isLoadingInvitations: boolean;
    isLoadingBookmarks: boolean;
    isLoadingLegacyNodes: boolean;
    isLoadingLegacyInvitations: boolean;
    isPopulatingLegacyNodes: boolean;
    isPopulatingLegacyInvitations: boolean;

    eventSubscriptions: (() => void)[] | null;
    activeContexts: Set<string>;
    refreshCallbacks: Map<string, () => Promise<void>>;

    setSharedWithMeItem: (item: SharedWithMeItem) => void;
    setInvitationAccepting: (uid: string, isBeingAccepted: boolean) => void;
    removeSharedWithMeItem: (uid: string) => void;
    clearAll: () => void;
    cleanupStaleItems: (itemType: ItemType, loadedUids: Set<string>, options?: { legacyCleanup?: boolean }) => void;

    hasSharedWithMeItem: (uid: string) => boolean;
    getSharedWithMeItem: (uid: string) => SharedWithMeItem | undefined;
    getInvitations: () => SharedWithMeItem[];
    getNonInvitationItems: () => SharedWithMeItem[];
    getInvitationPositionedItems: () => SharedWithMeItem[];
    getRegularItems: () => SharedWithMeItem[];

    clearItemsWithInvitationPosition: () => void;

    setSorting: (params: { sortField: SortField; direction: SORT_DIRECTION; sortConfig: SortConfig }) => void;

    setLoadingNodes: (loading: boolean) => void;
    setLoadingInvitations: (loading: boolean) => void;
    setLoadingBookmarks: (loading: boolean) => void;
    setLoadingLegacyNodes: (loading: boolean) => void;
    setLoadingLegacyInvitations: (loading: boolean) => void;
    setPopulatingLegacyNodes: (loading: boolean) => void;
    setPopulatingLegacyInvitations: (loading: boolean) => void;

    isLoading: () => boolean;
    setHasEverLoaded: () => void;
    checkAndSetHasEverLoaded: () => void;

    subscribeToEvents: (context: string, options?: { onRefreshSharedWithMe?: () => Promise<void> }) => Promise<void>;
    unsubscribeToEvents: (context: string) => Promise<void>;
};

export const getKeyUid = (item: SharedWithMeItem) =>
    item.itemType === ItemType.BOOKMARK ? item.bookmark.uid : item.nodeUid;

const computeSortedItemUids = (
    state: Pick<SharedWithMeStore, 'sharedWithMeItems' | 'itemsWithInvitationPosition' | 'sortedRegularItemUids'>
): string[] => {
    const items = Array.from(state.sharedWithMeItems.values());

    const invitationPositionedItems = items.filter((item) => {
        const keyUid = getKeyUid(item);
        return item.itemType === ItemType.INVITATION || state.itemsWithInvitationPosition.has(keyUid);
    });
    const invitationUids = invitationPositionedItems.map((item) => getKeyUid(item));

    if (state.sortedRegularItemUids === null) {
        const regularItems = items.filter((item) => {
            const keyUid = getKeyUid(item);
            return item.itemType !== ItemType.INVITATION && !state.itemsWithInvitationPosition.has(keyUid);
        });
        const regularUids = regularItems.map((item) => getKeyUid(item));
        return [...invitationUids, ...regularUids];
    }

    return [...invitationUids, ...state.sortedRegularItemUids];
};

export const useSharedWithMeStore = create<SharedWithMeStore>()(
    devtools(
        (set, get) => ({
            sharedWithMeItems: new Map(),
            itemUids: new Set(),
            itemsWithInvitationPosition: new Set(),
            hasEverLoaded: false,
            sortedItemUids: [],

            sortField: SortField.sharedOn,
            direction: SORT_DIRECTION.DESC,
            sortedRegularItemUids: null,

            isLoadingNodes: false,
            isLoadingInvitations: false,
            isLoadingBookmarks: false,
            isLoadingLegacyNodes: false,
            isLoadingLegacyInvitations: false,
            isPopulatingLegacyNodes: false,
            isPopulatingLegacyInvitations: false,

            eventSubscriptions: null,
            activeContexts: new Set<string>(),
            refreshCallbacks: new Map<string, () => Promise<void>>(),

            setSharedWithMeItem: (item: SharedWithMeItem) => {
                set((state) => {
                    const keyUid = getKeyUid(item);
                    const isExistingItem = state.sharedWithMeItems.has(keyUid);
                    const wasInInvitationPosition = state.itemsWithInvitationPosition.has(keyUid);
                    const newItemUids = new Set(state.itemUids);
                    const newItemsWithInvitationPosition = new Set(state.itemsWithInvitationPosition);
                    newItemUids.add(keyUid);

                    if (isExistingItem) {
                        const existingItem = state.sharedWithMeItems.get(keyUid);
                        const wasOriginallyInvitation = existingItem?.itemType === ItemType.INVITATION;

                        // In case we accept the item while loading the section,
                        // we should prevent future updates otherwise the item will disappear and appear again
                        if (existingItem?.itemType === ItemType.DIRECT_SHARE && item.itemType === ItemType.INVITATION) {
                            return state;
                        }

                        const newSharedWithMeItems = new Map(state.sharedWithMeItems);
                        newSharedWithMeItems.set(keyUid, item);

                        if (wasInInvitationPosition || wasOriginallyInvitation) {
                            newItemsWithInvitationPosition.add(keyUid);
                        }

                        const nextState = {
                            sharedWithMeItems: newSharedWithMeItems,
                            itemUids: newItemUids,
                            itemsWithInvitationPosition: newItemsWithInvitationPosition,
                        };
                        return { ...nextState, sortedItemUids: computeSortedItemUids({ ...state, ...nextState }) };
                    }

                    if (item.itemType === ItemType.INVITATION) {
                        const newSharedWithMeItems = new Map();
                        newSharedWithMeItems.set(keyUid, item);
                        for (const [uid, existingItem] of state.sharedWithMeItems) {
                            newSharedWithMeItems.set(uid, existingItem);
                        }
                        newItemsWithInvitationPosition.add(keyUid);

                        const nextState = {
                            sharedWithMeItems: newSharedWithMeItems,
                            itemUids: newItemUids,
                            itemsWithInvitationPosition: newItemsWithInvitationPosition,
                        };
                        return { ...nextState, sortedItemUids: computeSortedItemUids({ ...state, ...nextState }) };
                    }

                    const newSharedWithMeItems = new Map(state.sharedWithMeItems);
                    newSharedWithMeItems.set(keyUid, item);
                    const nextState = {
                        sharedWithMeItems: newSharedWithMeItems,
                        itemUids: newItemUids,
                        itemsWithInvitationPosition: newItemsWithInvitationPosition,
                    };
                    return { ...nextState, sortedItemUids: computeSortedItemUids({ ...state, ...nextState }) };
                });
            },

            setInvitationAccepting: (uid: string, isBeingAccepted: boolean) => {
                set((state) => {
                    const item = state.sharedWithMeItems.get(uid);
                    if (!item || item.itemType !== ItemType.INVITATION) {
                        return state;
                    }
                    const newSharedWithMeItems = new Map(state.sharedWithMeItems);
                    newSharedWithMeItems.set(uid, { ...item, isBeingAccepted });
                    return { sharedWithMeItems: newSharedWithMeItems };
                });
            },

            removeSharedWithMeItem: (uid: string) => {
                set((state) => {
                    const newSharedWithMeItems = new Map(state.sharedWithMeItems);
                    newSharedWithMeItems.delete(uid);
                    const newItemUids = new Set(state.itemUids);
                    newItemUids.delete(uid);
                    const newItemsWithInvitationPosition = new Set(state.itemsWithInvitationPosition);
                    newItemsWithInvitationPosition.delete(uid);
                    const nextState = {
                        sharedWithMeItems: newSharedWithMeItems,
                        itemUids: newItemUids,
                        itemsWithInvitationPosition: newItemsWithInvitationPosition,
                    };

                    const invitationCount = Array.from(newSharedWithMeItems.values()).filter(
                        (item) => item.itemType === ItemType.INVITATION
                    ).length;
                    useInvitationCountStore.getState().setInvitationCount(invitationCount);

                    return { ...nextState, sortedItemUids: computeSortedItemUids({ ...state, ...nextState }) };
                });
            },

            clearAll: () => {
                set((state) => ({
                    sharedWithMeItems: new Map(),
                    itemUids: new Set(),
                    itemsWithInvitationPosition: new Set(),
                    sortedItemUids: computeSortedItemUids({
                        ...state,
                        sharedWithMeItems: new Map(),
                        itemsWithInvitationPosition: new Set(),
                    }),
                }));
            },

            cleanupStaleItems: (itemType: ItemType, loadedUids: Set<string>) => {
                set((state) => {
                    const newSharedWithMeItems = new Map(state.sharedWithMeItems);
                    const newItemUids = new Set(state.itemUids);
                    const newItemsWithInvitationPosition = new Set(state.itemsWithInvitationPosition);

                    for (const [uid, item] of state.sharedWithMeItems) {
                        const shouldCleanup = item.itemType === itemType && !loadedUids.has(getKeyUid(item));
                        if (shouldCleanup) {
                            newSharedWithMeItems.delete(uid);
                            newItemUids.delete(uid);
                            newItemsWithInvitationPosition.delete(uid);
                        }
                    }

                    const nextState = {
                        sharedWithMeItems: newSharedWithMeItems,
                        itemUids: newItemUids,
                        itemsWithInvitationPosition: newItemsWithInvitationPosition,
                    };

                    if (itemType === ItemType.INVITATION) {
                        const invitationCount = Array.from(newSharedWithMeItems.values()).filter(
                            (item) => item.itemType === ItemType.INVITATION
                        ).length;
                        useInvitationCountStore.getState().setInvitationCount(invitationCount);
                    }

                    return { ...nextState, sortedItemUids: computeSortedItemUids({ ...state, ...nextState }) };
                });
            },

            hasSharedWithMeItem: (uid: string) => get().sharedWithMeItems.has(uid),
            getSharedWithMeItem: (uid: string) => get().sharedWithMeItems.get(uid),
            getInvitations: () => {
                const items = Array.from(get().sharedWithMeItems.values());
                return items.filter((item) => item.itemType === ItemType.INVITATION);
            },
            getNonInvitationItems: () => {
                const items = Array.from(get().sharedWithMeItems.values());
                return items.filter((item) => item.itemType !== ItemType.INVITATION);
            },
            getInvitationPositionedItems: () => {
                const state = get();
                const items = Array.from(state.sharedWithMeItems.values());
                return items.filter((item) => {
                    const keyUid = getKeyUid(item);
                    return item.itemType === ItemType.INVITATION || state.itemsWithInvitationPosition.has(keyUid);
                });
            },
            getRegularItems: () => {
                const state = get();
                const items = Array.from(state.sharedWithMeItems.values());
                return items.filter((item) => {
                    const keyUid = getKeyUid(item);
                    return item.itemType !== ItemType.INVITATION && !state.itemsWithInvitationPosition.has(keyUid);
                });
            },
            clearItemsWithInvitationPosition: () => {
                set((state) => {
                    const nextState = { itemsWithInvitationPosition: new Set<string>() };
                    return { ...nextState, sortedItemUids: computeSortedItemUids({ ...state, ...nextState }) };
                });
            },
            setSorting: ({ sortField, direction, sortConfig }) => {
                set((state) => {
                    const newItemsWithInvitationPosition = new Set<string>();
                    const regularItems = Array.from(state.sharedWithMeItems.values()).filter((item) => {
                        const keyUid = getKeyUid(item);
                        return item.itemType !== ItemType.INVITATION && !newItemsWithInvitationPosition.has(keyUid);
                    });

                    const sortedUids = sortItems(
                        regularItems,
                        sortConfig,
                        direction,
                        getSharedWithMeSortValue,
                        getKeyUid
                    );

                    const nextState = {
                        itemsWithInvitationPosition: newItemsWithInvitationPosition,
                        sortField,
                        direction,
                        sortedRegularItemUids: sortedUids,
                    };
                    return {
                        ...nextState,
                        sortedItemUids: computeSortedItemUids({ ...state, ...nextState }),
                    };
                });
            },

            setLoadingNodes: (loading: boolean) => {
                set({ isLoadingNodes: loading });
                get().checkAndSetHasEverLoaded();
            },
            setLoadingInvitations: (loading: boolean) => {
                set({ isLoadingInvitations: loading });
                get().checkAndSetHasEverLoaded();
            },
            setLoadingBookmarks: (loading: boolean) => {
                set({ isLoadingBookmarks: loading });
                get().checkAndSetHasEverLoaded();
            },
            setLoadingLegacyNodes: (loading: boolean) => {
                set({ isLoadingLegacyNodes: loading });
                get().checkAndSetHasEverLoaded();
            },
            setLoadingLegacyInvitations: (loading: boolean) => {
                set({ isLoadingLegacyInvitations: loading });
                get().checkAndSetHasEverLoaded();
            },
            setPopulatingLegacyNodes: (loading: boolean) => {
                set({ isPopulatingLegacyNodes: loading });
                get().checkAndSetHasEverLoaded();
            },
            setPopulatingLegacyInvitations: (loading: boolean) => {
                set({ isPopulatingLegacyInvitations: loading });
                get().checkAndSetHasEverLoaded();
            },

            setHasEverLoaded: () => set({ hasEverLoaded: true }),

            checkAndSetHasEverLoaded: () => {
                const state = get();
                if (!state.isLoading() && !state.hasEverLoaded) {
                    state.setHasEverLoaded();
                }
            },

            isLoading: () => {
                const state = get();
                return (
                    state.isLoadingNodes ||
                    state.isLoadingInvitations ||
                    state.isLoadingBookmarks ||
                    state.isLoadingLegacyNodes ||
                    state.isLoadingLegacyInvitations ||
                    state.isPopulatingLegacyNodes ||
                    state.isPopulatingLegacyInvitations
                );
            },

            subscribeToEvents: async (context: string, options?: { onRefreshSharedWithMe?: () => Promise<void> }) => {
                const { activeContexts, eventSubscriptions, refreshCallbacks } = get();

                const newActiveContexts = new Set(activeContexts);
                newActiveContexts.add(context);

                const newRefreshCallbacks = new Map(refreshCallbacks);
                if (options?.onRefreshSharedWithMe) {
                    newRefreshCallbacks.set(context, options.onRefreshSharedWithMe);
                }

                set({
                    activeContexts: newActiveContexts,
                    refreshCallbacks: newRefreshCallbacks,
                });

                if (eventSubscriptions) {
                    return;
                }

                const eventManager = getBusDriver();
                await eventManager.subscribeSdkDriveEvents(context);

                const deleteBookmarksSubscription = eventManager.subscribe(
                    BusDriverEventName.DELETE_BOOKMARKS,
                    async (event) => {
                        const store = get();
                        for (const uid of event.uids) {
                            store.removeSharedWithMeItem(uid);
                        }
                    }
                );

                const rejectInvitationsSubscription = eventManager.subscribe(
                    BusDriverEventName.REJECT_INVITATIONS,
                    async (event) => {
                        const store = get();
                        for (const uid of event.uids) {
                            store.removeSharedWithMeItem(uid);
                        }
                        const invitationCount = store.getInvitations().length;
                        useInvitationCountStore.getState().setInvitationCount(invitationCount);
                    }
                );

                const removeMeSubscription = eventManager.subscribe(BusDriverEventName.REMOVE_ME, async (event) => {
                    const store = get();
                    for (const uid of event.uids) {
                        store.removeSharedWithMeItem(uid);
                    }
                });

                const acceptInvitationsSubscription = eventManager.subscribe(
                    BusDriverEventName.ACCEPT_INVITATIONS,
                    async (event, drive) => {
                        const store = get();
                        for (const uid of event.uids) {
                            const maybeNode = await drive.getNode(uid);
                            const { node } = getNodeEntity(maybeNode);
                            const signatureResult = getSignatureIssues(maybeNode);
                            if (!node.deprecatedShareId) {
                                handleSdkError(new Error('The shared with me node has missing deprecatedShareId'), {
                                    showNotification: false,
                                    extra: { nodeUid: node.uid },
                                });
                                continue;
                            }
                            if (!node.membership) {
                                handleSdkError(new Error('Shared with me node has missing membership'), {
                                    extra: { nodeUid: node.uid },
                                });
                                continue;
                            }
                            store.setSharedWithMeItem({
                                nodeUid: node.uid,
                                shareId: node.deprecatedShareId,
                                name: node.name,
                                type: node.type,
                                mediaType: node.mediaType,
                                itemType: ItemType.DIRECT_SHARE,
                                activeRevisionUid: node.activeRevision?.uid,
                                size: node.totalStorageSize,
                                directShare: {
                                    sharedOn: node.membership.inviteTime,
                                    sharedBy:
                                        (node.membership.sharedBy.ok
                                            ? node.membership.sharedBy.value
                                            : node.membership.sharedBy.error.claimedAuthor) || '',
                                },
                                role: node.directRole,
                                haveSignatureIssues: !signatureResult.ok,
                            });
                        }
                        const invitationCount = store.getInvitations().length;
                        useInvitationCountStore.getState().setInvitationCount(invitationCount);
                    }
                );

                const refreshSharedWithMeSubscription = eventManager.subscribe(
                    BusDriverEventName.REFRESH_SHARED_WITH_ME,
                    async () => {
                        const { refreshCallbacks } = get();
                        const callbacks = Array.from(refreshCallbacks.values());
                        await Promise.all(callbacks.map((callback) => callback()));
                    }
                );

                const updatedNodesSubscription = eventManager.subscribe(
                    BusDriverEventName.UPDATED_NODES,
                    async (event, drive) => {
                        const store = get();
                        for (const item of event.items) {
                            const storeItem = store.getSharedWithMeItem(item.uid);
                            if (!storeItem || storeItem.itemType !== ItemType.DIRECT_SHARE) {
                                continue;
                            }
                            if (item.isTrashed) {
                                store.removeSharedWithMeItem(item.uid);
                                continue;
                            }
                            const maybeNode = await drive.getNode(item.uid);
                            const { node } = getNodeEntity(maybeNode);
                            const signatureResult = getSignatureIssues(maybeNode);
                            store.setSharedWithMeItem({
                                ...storeItem,
                                name: node.name,
                                type: node.type,
                                mediaType: node.mediaType,
                                activeRevisionUid: node.activeRevision?.uid,
                                size: node.totalStorageSize,
                                role: node.directRole,
                                haveSignatureIssues: !signatureResult.ok,
                            });
                        }
                    }
                );

                set({
                    eventSubscriptions: [
                        deleteBookmarksSubscription,
                        rejectInvitationsSubscription,
                        acceptInvitationsSubscription,
                        refreshSharedWithMeSubscription,
                        removeMeSubscription,
                        updatedNodesSubscription,
                    ],
                });
            },

            unsubscribeToEvents: async (context: string) => {
                const eventManager = getBusDriver();
                await eventManager.unsubscribeSdkDriveEvents(context);

                const { activeContexts, eventSubscriptions, refreshCallbacks } = get();
                const newActiveContexts = new Set(activeContexts);
                newActiveContexts.delete(context);

                const newRefreshCallbacks = new Map(refreshCallbacks);
                newRefreshCallbacks.delete(context);

                set({
                    activeContexts: newActiveContexts,
                    refreshCallbacks: newRefreshCallbacks,
                });

                if (newActiveContexts.size === 0 && eventSubscriptions) {
                    eventSubscriptions.forEach((unsubscribe) => unsubscribe());
                    set({ eventSubscriptions: null });
                }
            },
        }),
        {
            name: 'shared-with-me-store',
        }
    )
);
