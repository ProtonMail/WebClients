import { create } from 'zustand';

import type { NodeEntity, NodeType } from '@proton/drive';
import type { BusDriverClient } from '@proton/drive/internal/BusDriver';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';

import type { SortConfig } from '../../modules/sorting';
import { SortField, sortItems } from '../../modules/sorting';
import { getNodeStorageSize } from '../../utils/sdk/getNodeStorageSize';
import { getRootNode } from '../../utils/sdk/mapNodeToLegacyItem';
import { getTrashSortValue } from './trash.sorting';

export interface TrashItem {
    uid: string;
    name: string;
    type: NodeType;
    mediaType?: string;
    trashTime?: Date;
    modificationTime: Date;
    activeRevisionUid?: string;
    parentUid?: string;
    rootShareId?: string;
    haveSignatureIssues?: boolean;
    location?: string;
    size: number;
}

export const createTrashItem = async (
    node: NodeEntity,
    location: string,
    client: BusDriverClient,
    haveSignatureIssues?: boolean
): Promise<TrashItem> => {
    const rootNode = await getRootNode(node, client);
    return {
        uid: node.uid,
        name: node.name,
        type: node.type,
        mediaType: node.mediaType,
        trashTime: node.trashTime,
        modificationTime: node.modificationTime,
        activeRevisionUid: node.activeRevision?.uid,
        parentUid: node.parentUid,
        rootShareId: rootNode.deprecatedShareId,
        haveSignatureIssues,
        location,
        size: getNodeStorageSize(node),
    };
};

interface TrashStore {
    items: Map<string, TrashItem>;
    sortedItemUids: Set<string>;

    sortField: SortField;
    direction: SORT_DIRECTION;
    sortConfig: SortConfig | undefined;

    isLoading: boolean;
    hasEverLoaded: boolean;

    setItem: (item: TrashItem) => void;
    updateItem: (uid: string, updates: Partial<TrashItem>) => void;
    removeItem: (uid: string) => void;
    clearAll: () => void;

    getItem: (uid: string) => TrashItem | undefined;

    setLoading: (source: string, loading: boolean) => void;

    setSorting: (params: { sortField: SortField; direction: SORT_DIRECTION; sortConfig: SortConfig }) => void;
}

export const useTrashStore = create<TrashStore>((set, get) => {
    const loadingSources = new Set<string>();

    return {
        items: new Map(),
        sortedItemUids: new Set(),

        sortField: SortField.name,
        direction: SORT_DIRECTION.ASC,
        sortConfig: undefined,

        isLoading: false,
        hasEverLoaded: false,

        getItem: (uid: string) => get().items.get(uid),

        setItem: (item: TrashItem) =>
            set((state) => {
                const items = new Map(state.items);
                items.set(item.uid, item);
                const sortedItemUids = new Set(state.sortedItemUids);
                sortedItemUids.add(item.uid);
                return { items, sortedItemUids };
            }),

        updateItem: (uid: string, updates: Partial<TrashItem>) =>
            set((state) => {
                const existing = state.items.get(uid);
                if (!existing) {
                    return state;
                }
                const items = new Map(state.items);
                items.set(uid, { ...existing, ...updates });
                return { items };
            }),

        removeItem: (uid: string) =>
            set((state) => {
                const items = new Map(state.items);
                items.delete(uid);
                const sortedItemUids = new Set<string>();
                for (const id of state.sortedItemUids) {
                    if (id !== uid) {
                        sortedItemUids.add(id);
                    }
                }
                return { items, sortedItemUids };
            }),

        setLoading: (source: string, loading: boolean) => {
            if (loading) {
                loadingSources.add(source);
            } else {
                loadingSources.delete(source);
            }
            const isLoading = loadingSources.size > 0;
            set((state) => ({
                isLoading,
                hasEverLoaded: state.hasEverLoaded || !isLoading,
            }));
        },

        setSorting: ({ sortField, direction, sortConfig }) => {
            const allItems = Array.from(get().items.values());
            const sortedUids = sortItems(allItems, sortConfig, direction, getTrashSortValue, (item) => item.uid);
            set({ sortField, direction, sortConfig, sortedItemUids: new Set(sortedUids) });
        },

        clearAll: () => set({ items: new Map(), sortedItemUids: new Set(), sortConfig: undefined }),
    };
});
