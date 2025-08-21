import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { type NodeType, splitNodeUid } from '@proton/drive';

import { getActionEventManager } from '../../utils/ActionEventManager/ActionEventManager';
import { ActionEventName } from '../../utils/ActionEventManager/ActionEventManagerTypes';
import { legacyTimestampToDate } from '../../utils/sdk/legacyTime';

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
    isLoadingLegacy: boolean;

    setSharedWithMeItem: (item: SharedWithMeListingItemUI) => void;
    removeSharedWithMeItem: (uid: string) => void;
    clearAll: () => void;

    hasSharedWithMeItem: (uid: string) => boolean;
    getSharedWithMeItem: (uid: string) => SharedWithMeListingItemUI | undefined;
    getAllSharedWithMeItems: () => SharedWithMeListingItemUI[];
    getInvitations: () => SharedWithMeListingItemUI[];
    getNonInvitationItems: () => SharedWithMeListingItemUI[];
    getInvitationPositionedItems: () => SharedWithMeListingItemUI[];
    getRegularItems: () => SharedWithMeListingItemUI[];
    getItemUids: () => string[];
    getInvitiationCount: () => number;

    clearItemsWithInvitationPosition: () => void;

    setLoadingNodes: (loading: boolean) => void;
    setLoadingInvitations: (loading: boolean) => void;
    setLoadingBookmarks: (loading: boolean) => void;
    setLoadingLegacy: (loading: boolean) => void;

    isLoading: () => boolean;
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
            isLoadingLegacy: false,

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
            getInvitiationCount: () => {
                const items = Array.from(get().sharedWithMeItems.values());
                return items.filter((item) => item.itemType === ItemType.INVITATION).length;
            },

            setLoadingNodes: (loading: boolean) => set({ isLoadingNodes: loading }),
            setLoadingInvitations: (loading: boolean) => set({ isLoadingInvitations: loading }),
            setLoadingBookmarks: (loading: boolean) => set({ isLoadingBookmarks: loading }),
            setLoadingLegacy: (loading: boolean) => set({ isLoadingLegacy: loading }),

            isLoading: () => {
                const state = get();
                return (
                    state.isLoadingNodes ||
                    state.isLoadingInvitations ||
                    state.isLoadingBookmarks ||
                    state.isLoadingLegacy
                );
            },
        }),
        {
            name: 'shared-with-me-listing-store',
        }
    )
);

getActionEventManager().subscribe(ActionEventName.DELETE_BOOKMARKS, async (event) => {
    const store = useSharedWithMeListingStore.getState();
    event.uids.forEach((uid) => {
        store.removeSharedWithMeItem(uid);
    });
});

getActionEventManager().subscribe(ActionEventName.REJECT_INVITATIONS, async (event) => {
    const store = useSharedWithMeListingStore.getState();
    event.uids.forEach((uid) => {
        store.removeSharedWithMeItem(uid);
    });
});

getActionEventManager().subscribe(ActionEventName.ACCEPT_INVITATIONS, async (event) => {
    const store = useSharedWithMeListingStore.getState();
    event.items.forEach(({ node, sharedInfo }) => {
        const { volumeId, nodeId } = splitNodeUid(node.uid);
        store.setSharedWithMeItem({
            nodeUid: node.uid,
            name: node.name,
            type: node.type,
            mediaType: node.mediaType,
            itemType: ItemType.DIRECT_SHARE,
            thumbnailId: node.activeRevision?.uid || node.uid,
            size: node.totalStorageSize,
            directShare: {
                sharedOn: legacyTimestampToDate(sharedInfo.sharedOn),
                sharedBy: sharedInfo.sharedBy,
            },
            legacy: {
                linkId: nodeId,
                shareId: node.deprecatedShareId || '',
                volumeId: volumeId,
            },
        });
    });
});
