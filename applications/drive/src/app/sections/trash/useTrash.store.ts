import { create } from 'zustand';

import { getDrive } from '@proton/drive';

import { getActionEventManager } from '../../utils/ActionEventManager/ActionEventManager';
import { ActionEventName } from '../../utils/ActionEventManager/ActionEventManagerTypes';
import { EnrichedError } from '../../utils/errorHandling/EnrichedError';
import { handleSdkError } from '../../utils/errorHandling/useSdkErrorHandler';
import { type LegacyItem, mapNodeToLegacyItem } from '../../utils/sdk/mapNodeToLegacyItem';

interface TrashStore {
    clearAllNodes: () => void;
    trashNodes: Record<string, LegacyItem>;
    setNodes: (trashNodes: Record<string, LegacyItem>) => void;
    removeNodes: (nodeIds: string[]) => void;
    isLoading: boolean;
    setLoading: (value: boolean) => void;
    eventSubscriptions: (() => void)[] | null;
    activeContexts: Set<string>;
    subscribeToEvents: (context: string) => Promise<void>;
    unsubscribeToEvents: (context: string) => Promise<void>;
}

export const useTrashStore = create<TrashStore>((set, get) => ({
    trashNodes: {},
    isLoading: false,
    eventSubscriptions: null,
    activeContexts: new Set<string>(),
    setNodes: (trashNodes: Record<string, LegacyItem>) =>
        set((state) => {
            return { trashNodes: { ...state.trashNodes, ...trashNodes } };
        }),
    removeNodes: (nodeIds: string[]) =>
        set((state) => {
            const remainingNodes = { ...state.trashNodes };
            nodeIds.forEach((nodeId) => delete remainingNodes[nodeId]);
            return { trashNodes: remainingNodes };
        }),
    setLoading: (value: boolean) =>
        set(() => {
            return { isLoading: value };
        }),
    clearAllNodes: () => set({ trashNodes: {} }),
    subscribeToEvents: async (context: string) => {
        const eventManager = getActionEventManager();
        await eventManager.subscribeSdkEventsMyUpdates(context);

        const { activeContexts, eventSubscriptions } = get();

        const newActiveContexts = new Set(activeContexts);
        newActiveContexts.add(context);
        set({ activeContexts: newActiveContexts });

        if (eventSubscriptions) {
            return;
        }

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
            const { trashNodes, setNodes } = get();
            for (const item of event.items) {
                try {
                    if (item.isTrashed && !trashNodes[item.uid]) {
                        const node = await drive.getNode(item.uid);
                        const legacyItem = await mapNodeToLegacyItem(node, deprecatedRootShareId, drive);
                        setNodes({ [item.uid]: legacyItem });
                    }
                } catch (error) {
                    handleSdkError(error);
                }
            }
        });

        const updateSubscription = eventManager.subscribe(ActionEventName.UPDATED_NODES, async (event) => {
            const { trashNodes, removeNodes, setNodes } = get();
            for (const item of event.items) {
                try {
                    if (!item.isTrashed && trashNodes[item.uid]) {
                        removeNodes([item.uid]);
                    } else if (item.isTrashed) {
                        const node = await drive.getNode(item.uid);
                        const legacyItem = await mapNodeToLegacyItem(node, deprecatedRootShareId, drive);
                        setNodes({ [item.uid]: legacyItem });
                    }
                } catch (error) {
                    handleSdkError(error);
                }
            }
        });

        const deleteSubscription = eventManager.subscribe(ActionEventName.DELETED_NODES, async (event) => {
            const { trashNodes, removeNodes } = get();
            const uidsToRemove = event.uids.filter((uid) => trashNodes[uid]);
            if (uidsToRemove.length > 0) {
                removeNodes(uidsToRemove);
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
}));
