import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import type { NodeType } from '@proton/drive';
import { getDrive } from '@proton/drive';

import { getActionEventManager } from '../../utils/ActionEventManager/ActionEventManager';
import { ActionEventName } from '../../utils/ActionEventManager/ActionEventManagerTypes';
import { EnrichedError } from '../../utils/errorHandling/EnrichedError';
import { handleSdkError } from '../../utils/errorHandling/useSdkErrorHandler';
import { getNodeEntity } from '../../utils/sdk/getNodeEntity';
import { getNodeLocation } from '../../utils/sdk/getNodeLocation';
import { getSignatureIssues } from '../../utils/sdk/getSignatureIssues';
import { getRootNode } from '../../utils/sdk/mapNodeToLegacyItem';
import { getOldestShareCreationTime } from './utils/getOldestShareCreationTime';

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

    eventSubscriptions: (() => void)[] | null;
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

            eventSubscriptions: null,
            activeContexts: new Set<string>(),
            refreshCallbacks: new Map<string, () => Promise<void>>(),

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
                const { activeContexts, eventSubscriptions } = get();

                const newActiveContexts = new Set(activeContexts);
                newActiveContexts.add(context);
                set({ activeContexts: newActiveContexts });

                if (eventSubscriptions) {
                    return;
                }

                const eventManager = getActionEventManager();
                await eventManager.subscribeSdkEventsMyUpdates(context);

                const drive = getDrive();
                // Legacy code, needs to be removed once we don't depend on deprecatedShareId
                const deprecatedRootShareId = await drive.getMyFilesRootFolder().then((maybeNode) => {
                    if (maybeNode.ok) {
                        return maybeNode.value.deprecatedShareId;
                    }
                    return maybeNode.error.deprecatedShareId;
                });
                if (!deprecatedRootShareId) {
                    throw new EnrichedError('MyFiles root folder is missing deprecatedRootShareId', {
                        tags: { component: 'drive-sdk' },
                    });
                }

                const createSubscription = eventManager.subscribe(ActionEventName.CREATED_NODES, async (event) => {
                    const { getSharedByMeItem, setSharedByMeItem } = get();
                    for (const item of event.items) {
                        try {
                            if (item.isShared && !getSharedByMeItem(item.uid)) {
                                const sharedByMeMaybeNode = await drive.getNode(item.uid);
                                const signatureResult = getSignatureIssues(sharedByMeMaybeNode);
                                const { node } = getNodeEntity(sharedByMeMaybeNode);
                                if (!node.deprecatedShareId) {
                                    handleSdkError(
                                        new EnrichedError(
                                            'The shared with me node entity is missing deprecatedShareId',
                                            {
                                                tags: { component: 'drive-sdk' },
                                                extra: { uid: node.uid },
                                            }
                                        )
                                    );
                                    continue;
                                }

                                const location = await getNodeLocation(drive, sharedByMeMaybeNode);

                                const shareResult = await drive.getSharingInfo(node.uid);
                                // TODO: Update or remove that once we figure out what product want in "Created" column
                                const oldestCreationTime = shareResult
                                    ? getOldestShareCreationTime(shareResult)
                                    : undefined;

                                const rootNode = await getRootNode(node, drive);

                                setSharedByMeItem({
                                    nodeUid: node.uid,
                                    name: node.name,
                                    type: node.type,
                                    mediaType: node.mediaType,
                                    size: node.activeRevision?.storageSize || node.totalStorageSize,
                                    parentUid: node.parentUid,
                                    thumbnailId: node.activeRevision?.uid || node.uid,
                                    location,
                                    creationTime: oldestCreationTime,
                                    publicLink: shareResult?.publicLink
                                        ? {
                                              numberOfInitializedDownloads:
                                                  shareResult.publicLink.numberOfInitializedDownloads,
                                              url: shareResult.publicLink.url,
                                              expirationTime: shareResult.publicLink.expirationTime,
                                          }
                                        : undefined,
                                    shareId: node.deprecatedShareId,
                                    rootShareId: rootNode.deprecatedShareId || node.deprecatedShareId,
                                    haveSignatureIssues: !signatureResult.ok,
                                });
                            }
                        } catch (error) {
                            handleSdkError(error);
                        }
                    }
                });

                const updateSubscription = eventManager.subscribe(ActionEventName.UPDATED_NODES, async (event) => {
                    const { getSharedByMeItem, setSharedByMeItem, removeSharedByMeItem } = get();
                    for (const item of event.items) {
                        try {
                            if (!item.isShared && getSharedByMeItem(item.uid)) {
                                removeSharedByMeItem(item.uid);
                            } else if (item.isShared) {
                                const sharedByMeMaybeNode = await drive.getNode(item.uid);
                                const signatureResult = getSignatureIssues(sharedByMeMaybeNode);
                                const { node } = getNodeEntity(sharedByMeMaybeNode);

                                if (!node.deprecatedShareId) {
                                    handleSdkError(
                                        new EnrichedError(
                                            'The shared with me node entity is missing deprecatedShareId',
                                            {
                                                tags: { component: 'drive-sdk' },
                                                extra: { uid: node.uid },
                                            }
                                        )
                                    );
                                    continue;
                                }

                                const location = await getNodeLocation(drive, sharedByMeMaybeNode);

                                const shareResult = await drive.getSharingInfo(node.uid);

                                // TODO: Update or remove that once we figure out what product want in "Created" column
                                const oldestCreationTime = shareResult
                                    ? getOldestShareCreationTime(shareResult)
                                    : undefined;

                                const rootNode = await getRootNode(node, drive);

                                setSharedByMeItem({
                                    nodeUid: node.uid,
                                    name: node.name,
                                    type: node.type,
                                    mediaType: node.mediaType,
                                    size: node.activeRevision?.storageSize || node.totalStorageSize,
                                    parentUid: node.parentUid,
                                    thumbnailId: node.activeRevision?.uid || node.uid,
                                    location,
                                    creationTime: oldestCreationTime,
                                    publicLink: shareResult?.publicLink
                                        ? {
                                              numberOfInitializedDownloads:
                                                  shareResult.publicLink.numberOfInitializedDownloads,
                                              url: shareResult.publicLink.url,
                                              expirationTime: shareResult.publicLink.expirationTime,
                                          }
                                        : undefined,
                                    shareId: node.deprecatedShareId,
                                    rootShareId: rootNode.deprecatedShareId || node.deprecatedShareId,
                                    haveSignatureIssues: !signatureResult.ok,
                                });
                            }
                        } catch (error) {
                            handleSdkError(error);
                        }
                    }
                });

                const deleteSubscription = eventManager.subscribe(ActionEventName.DELETED_NODES, async (event) => {
                    const { getSharedByMeItem, removeSharedByMeItem } = get();
                    for (const uid of event.uids) {
                        if (getSharedByMeItem(uid)) {
                            removeSharedByMeItem(uid);
                        }
                    }
                });

                set({ eventSubscriptions: [createSubscription, updateSubscription, deleteSubscription] });
            },
            unsubscribeToEvents: async (context: string) => {
                const eventManager = getActionEventManager();
                await eventManager.unsubscribeSdkEventsMyUpdates(context);

                const { activeContexts, eventSubscriptions } = get();
                const newActiveContexts = new Set(activeContexts);
                newActiveContexts.delete(context);
                set({ activeContexts: newActiveContexts });

                if (newActiveContexts.size === 0 && eventSubscriptions) {
                    eventSubscriptions.forEach((unsubscribe) => unsubscribe());
                    set({ eventSubscriptions: null });
                }
            },
        }),
        {
            name: 'shared-by-me-listing-store',
        }
    )
);
