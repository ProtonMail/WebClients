import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { type NodeType, getDrive } from '@proton/drive';
import { BusDriverEventName, getBusDriver } from '@proton/drive/internal/BusDriver';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';

import { type SortConfig, SortField, sortItems } from '../../modules/sorting';
import { getSharedWithMeSortValue } from '../../sections/sharedWith/sharedWithMe.sorting';
import { handleSdkError } from '../../utils/errorHandling/handleSdkError';
import { getNodeEntity } from '../../utils/sdk/getNodeEntity';
import { getSignatureIssues } from '../../utils/sdk/getSignatureIssues';

export enum ItemType {
    BOOKMARK = 'bookmark',
    DIRECT_SHARE = 'directShare',
    INVITATION = 'invitation',
}

type BaseSharedWithMeItem = {
    name: string;
    type: NodeType;
    size: number | undefined;
    mediaType: string | undefined;
    thumbnailId: string | undefined;

    // Help us knowing if the item is loaded from legacy loader
    isFromLegacy?: boolean;
};

export type BookmarkItem = BaseSharedWithMeItem & {
    itemType: ItemType.BOOKMARK;
    bookmark: {
        uid: string;
        url: string;
        creationTime: Date;
    };
};

export type DirectShareItem = BaseSharedWithMeItem & {
    nodeUid: string;
    itemType: ItemType.DIRECT_SHARE;
    haveSignatureIssues: boolean | undefined;
    directShare: {
        sharedOn: Date;
        sharedBy: string;
    };
    /** @deprecated belongs to legacy, prefer using nodeUid */
    shareId: string;
    /** @deprecated belongs to legacy, related to link state from store */
    isLocked?: boolean;
};

export type InvitationItem = BaseSharedWithMeItem & {
    nodeUid: string;
    itemType: ItemType.INVITATION;
    invitation: {
        uid: string;
        sharedBy: string;
    };
    /** @deprecated belongs to legacy, prefer using nodeUid */
    shareId: string;
};

export type SharedWithMeListingItemUI = BookmarkItem | DirectShareItem | InvitationItem;

type SharedWithMeListingStore = {
    sharedWithMeItems: Map<string, SharedWithMeListingItemUI>;
    itemUids: Set<string>;
    itemsWithInvitationPosition: Set<string>;
    hasEverLoaded: boolean;

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

    setSharedWithMeItem: (item: SharedWithMeListingItemUI) => void;
    removeSharedWithMeItem: (uid: string) => void;
    clearAll: () => void;
    cleanupStaleItems: (itemType: ItemType, loadedUids: Set<string>, options?: { legacyCleanup?: boolean }) => void;

    hasSharedWithMeItem: (uid: string) => boolean;
    getSharedWithMeItem: (uid: string) => SharedWithMeListingItemUI | undefined;
    getAllSharedWithMeItems: () => SharedWithMeListingItemUI[];
    getInvitations: () => SharedWithMeListingItemUI[];
    getNonInvitationItems: () => SharedWithMeListingItemUI[];
    getInvitationPositionedItems: () => SharedWithMeListingItemUI[];
    getRegularItems: () => SharedWithMeListingItemUI[];
    getItemUids: () => string[];
    getInvitationCount: () => number;

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

export const getKeyUid = (item: SharedWithMeListingItemUI) =>
    item.itemType === ItemType.BOOKMARK ? item.bookmark.uid : item.nodeUid;

export const useSharedWithMeListingStore = create<SharedWithMeListingStore>()(
    devtools(
        (set, get) => ({
            sharedWithMeItems: new Map(),
            itemUids: new Set(),
            itemsWithInvitationPosition: new Set(),
            hasEverLoaded: false,

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

            setSharedWithMeItem: (item: SharedWithMeListingItemUI) => {
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

                        const newSharedWithMeItems = new Map(state.sharedWithMeItems);
                        newSharedWithMeItems.set(keyUid, item);

                        if (wasInInvitationPosition || wasOriginallyInvitation) {
                            newItemsWithInvitationPosition.add(keyUid);
                        }

                        return {
                            sharedWithMeItems: newSharedWithMeItems,
                            itemUids: newItemUids,
                            itemsWithInvitationPosition: newItemsWithInvitationPosition,
                        };
                    }

                    if (item.itemType === ItemType.INVITATION) {
                        const newSharedWithMeItems = new Map();
                        newSharedWithMeItems.set(keyUid, item);
                        for (const [uid, existingItem] of state.sharedWithMeItems) {
                            newSharedWithMeItems.set(uid, existingItem);
                        }
                        newItemsWithInvitationPosition.add(keyUid);

                        return {
                            sharedWithMeItems: newSharedWithMeItems,
                            itemUids: newItemUids,
                            itemsWithInvitationPosition: newItemsWithInvitationPosition,
                        };
                    }

                    const newSharedWithMeItems = new Map(state.sharedWithMeItems);
                    newSharedWithMeItems.set(keyUid, item);
                    return {
                        sharedWithMeItems: newSharedWithMeItems,
                        itemUids: newItemUids,
                        itemsWithInvitationPosition: newItemsWithInvitationPosition,
                    };
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
                    return {
                        sharedWithMeItems: newSharedWithMeItems,
                        itemUids: newItemUids,
                        itemsWithInvitationPosition: newItemsWithInvitationPosition,
                    };
                });
            },

            clearAll: () => {
                set({
                    sharedWithMeItems: new Map(),
                    itemUids: new Set(),
                    itemsWithInvitationPosition: new Set(),
                });
            },

            cleanupStaleItems: (itemType: ItemType, loadedUids: Set<string>, options?: { legacyCleanup?: boolean }) => {
                set((state) => {
                    const newSharedWithMeItems = new Map(state.sharedWithMeItems);
                    const newItemUids = new Set(state.itemUids);
                    const newItemsWithInvitationPosition = new Set(state.itemsWithInvitationPosition);

                    // Find items of the specified type that weren't in the loaded set
                    for (const [uid, item] of state.sharedWithMeItems) {
                        const shouldCleanup =
                            item.itemType === itemType &&
                            !loadedUids.has(getKeyUid(item)) &&
                            (options?.legacyCleanup ? !!item.isFromLegacy : !item.isFromLegacy);

                        if (shouldCleanup) {
                            newSharedWithMeItems.delete(uid);
                            newItemUids.delete(uid);
                            newItemsWithInvitationPosition.delete(uid);
                        }
                    }

                    return {
                        sharedWithMeItems: newSharedWithMeItems,
                        itemUids: newItemUids,
                        itemsWithInvitationPosition: newItemsWithInvitationPosition,
                    };
                });
            },

            hasSharedWithMeItem: (uid: string) => get().sharedWithMeItems.has(uid),
            getSharedWithMeItem: (uid: string) => get().sharedWithMeItems.get(uid),
            getAllSharedWithMeItems: () => Array.from(get().sharedWithMeItems.values()),
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
                set({ itemsWithInvitationPosition: new Set() });
            },
            setSorting: ({ sortField, direction, sortConfig }) => {
                // Clear invitation positions first so accepted items are included in sorting
                set({ itemsWithInvitationPosition: new Set() });

                const state = get();
                const regularItems = state.getRegularItems();

                const sortedUids = sortItems(regularItems, sortConfig, direction, getSharedWithMeSortValue, getKeyUid);

                set({ sortField, direction, sortedRegularItemUids: sortedUids });
            },
            getItemUids: () => {
                const state = get();
                const invitationPositionedItems = state.getInvitationPositionedItems();
                const invitationUids = invitationPositionedItems.map((item) => getKeyUid(item));

                // If no manual sorting has been applied, return items in natural order
                if (state.sortedRegularItemUids === null) {
                    const regularItems = state.getRegularItems();
                    const regularUids = regularItems.map((item) => getKeyUid(item));
                    return [...invitationUids, ...regularUids];
                }

                // Return manually sorted items
                return [...invitationUids, ...state.sortedRegularItemUids];
            },
            getInvitationCount: () => {
                const items = Array.from(get().sharedWithMeItems.values());
                return items.filter((item) => item.itemType === ItemType.INVITATION).length;
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
                    async (event) => {
                        const store = get();
                        for (const uid of event.uids) {
                            const drive = getDrive();
                            const maybeNode = await drive.getNode(uid);
                            const { node } = getNodeEntity(maybeNode);
                            const signatureResult = getSignatureIssues(maybeNode);
                            if (!node.deprecatedShareId) {
                                handleSdkError(new Error('The shared with me node has missing deprecatedShareId'), {
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
                                name: node.name,
                                type: node.type,
                                mediaType: node.mediaType,
                                itemType: ItemType.DIRECT_SHARE,
                                thumbnailId: node.activeRevision?.uid || node.uid,
                                size: node.totalStorageSize,
                                directShare: {
                                    sharedOn: node.membership.inviteTime,
                                    // TODO: Add indication that we weren't able to load the sharedBy, this way we will be able to show some info in the UI
                                    sharedBy:
                                        (node.membership.sharedBy.ok
                                            ? node.membership.sharedBy.value
                                            : node.membership.sharedBy.error.claimedAuthor) || '',
                                },
                                haveSignatureIssues: !signatureResult.ok,
                                shareId: node.deprecatedShareId,
                            });
                        }
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

                set({
                    eventSubscriptions: [
                        deleteBookmarksSubscription,
                        rejectInvitationsSubscription,
                        acceptInvitationsSubscription,
                        refreshSharedWithMeSubscription,
                        removeMeSubscription,
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
            name: 'shared-with-me-listing-store',
        }
    )
);
