import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { type NodeType, getDrive, splitNodeUid } from '@proton/drive';

import { getActionEventManager } from '../../utils/ActionEventManager/ActionEventManager';
import { ActionEventName } from '../../utils/ActionEventManager/ActionEventManagerTypes';
import { EnrichedError } from '../../utils/errorHandling/EnrichedError';
import { handleSdkError } from '../../utils/errorHandling/useSdkErrorHandler';
import { getIsAnonymousUser } from '../../utils/sdk/getIsAnonymousUser';
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
    legacy: {
        isFromLegacy?: boolean;
        linkId: string;
        shareId: string;
        volumeId: string;
        isLocked?: boolean;
    };
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
};

export type InvitationItem = BaseSharedWithMeItem & {
    nodeUid: string;
    itemType: ItemType.INVITATION;
    invitation: {
        uid: string;
        sharedBy: string;
    };
};

export type SharedWithMeListingItemUI = BookmarkItem | DirectShareItem | InvitationItem;

type SharedWithMeListingStore = {
    sharedWithMeItems: Map<string, SharedWithMeListingItemUI>;
    itemUids: Set<string>;
    itemsWithInvitationPosition: Set<string>;

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

    setLoadingNodes: (loading: boolean) => void;
    setLoadingInvitations: (loading: boolean) => void;
    setLoadingBookmarks: (loading: boolean) => void;
    setLoadingLegacyNodes: (loading: boolean) => void;
    setLoadingLegacyInvitations: (loading: boolean) => void;
    setPopulatingLegacyNodes: (loading: boolean) => void;
    setPopulatingLegacyInvitations: (loading: boolean) => void;

    isLoading: () => boolean;

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
                            (options?.legacyCleanup ? !!item.legacy.isFromLegacy : !item.legacy.isFromLegacy);

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
            getItemUids: () => Array.from(get().itemUids),
            getInvitationCount: () => {
                const items = Array.from(get().sharedWithMeItems.values());
                return items.filter((item) => item.itemType === ItemType.INVITATION).length;
            },

            setLoadingNodes: (loading: boolean) => set({ isLoadingNodes: loading }),
            setLoadingInvitations: (loading: boolean) => set({ isLoadingInvitations: loading }),
            setLoadingBookmarks: (loading: boolean) => set({ isLoadingBookmarks: loading }),
            setLoadingLegacyNodes: (loading: boolean) => set({ isLoadingLegacyNodes: loading }),
            setLoadingLegacyInvitations: (loading: boolean) => set({ isLoadingLegacyInvitations: loading }),
            setPopulatingLegacyNodes: (loading: boolean) => set({ isPopulatingLegacyNodes: loading }),
            setPopulatingLegacyInvitations: (loading: boolean) => set({ isPopulatingLegacyInvitations: loading }),

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
                const eventManager = getActionEventManager();
                await eventManager.subscribeSdkDriveEvents(context);

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

                const deleteBookmarksSubscription = eventManager.subscribe(
                    ActionEventName.DELETE_BOOKMARKS,
                    async (event) => {
                        const store = get();
                        event.uids.forEach((uid) => {
                            store.removeSharedWithMeItem(uid);
                        });
                    }
                );

                const rejectInvitationsSubscription = eventManager.subscribe(
                    ActionEventName.REJECT_INVITATIONS,
                    async (event) => {
                        const store = get();
                        event.uids.forEach((uid) => {
                            store.removeSharedWithMeItem(uid);
                        });
                    }
                );

                const acceptInvitationsSubscription = eventManager.subscribe(
                    ActionEventName.ACCEPT_INVITATIONS,
                    async (event) => {
                        const store = get();
                        for (const uid of event.uids) {
                            const drive = getDrive();
                            const maybeNode = await drive.getNode(uid);
                            const { node } = getNodeEntity(maybeNode);
                            const signatureResult = getSignatureIssues(maybeNode);
                            const isAnonymousUser = getIsAnonymousUser(maybeNode);
                            const { volumeId, nodeId } = splitNodeUid(node.uid);
                            if (!node.deprecatedShareId) {
                                handleSdkError(
                                    new EnrichedError('The shared with me node entity is missing deprecatedShareId', {
                                        tags: { component: 'drive-sdk' },
                                        extra: { uid: node.uid },
                                    }),
                                    { showNotification: false }
                                );
                                continue;
                            }
                            if (!node.membership) {
                                handleSdkError(
                                    new EnrichedError('Shared with me node have missing membership', {
                                        tags: { component: 'drive-sdk' },
                                        extra: {
                                            uid: node.uid,
                                            message:
                                                'The shared with me node entity is missing membershif info. It could be race condition and means it is probably not shared anymore.',
                                        },
                                    }),
                                    { showNotification: false }
                                );

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
                                haveSignatureIssues: !isAnonymousUser && !signatureResult.ok,
                                legacy: {
                                    linkId: nodeId,
                                    shareId: node.deprecatedShareId,
                                    volumeId: volumeId,
                                },
                            });
                        }
                    }
                );

                const refreshSharedWithMeSubscription = eventManager.subscribe(
                    ActionEventName.REFRESH_SHARED_WITH_ME,
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
                    ],
                });
            },

            unsubscribeToEvents: async (context: string) => {
                const eventManager = getActionEventManager();
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
