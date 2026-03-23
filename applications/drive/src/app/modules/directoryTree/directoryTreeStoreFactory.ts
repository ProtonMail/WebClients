import { create } from 'zustand';

import type { TreeStoreItem } from './types';

interface DirectoryTreeState {
    items: Map<string, TreeStoreItem>;
    expandedTreeIds: Map<string, boolean>;
    addItem: (newItem: TreeStoreItem) => void;
    removeItem: (nodeUid: string) => void;
    updateItem: (nodeUid: string, partial: Partial<Pick<TreeStoreItem, 'name' | 'parentUid' | 'treeItemId'>>) => void;
    setExpanded: (treeItemId: string, newValue: boolean) => void;
    clearStore: () => void;
    getItemsByParentUid: (parentUid: string) => TreeStoreItem[];
}

export const directoryTreeStoreFactory = () => {
    return create<DirectoryTreeState>()((set, get) => ({
        items: new Map(),
        expandedTreeIds: new Map(),

        addItem: (newItem) =>
            set((state) => ({
                items: new Map(state.items).set(newItem.nodeUid, newItem),
            })),

        removeItem: (nodeUid) =>
            set((state) => {
                const items = new Map(state.items);
                items.delete(nodeUid);
                return { items };
            }),

        updateItem: (nodeUid, partial) =>
            set((state) => {
                const existing = state.items.get(nodeUid);
                if (!existing) {
                    return {};
                }
                return {
                    items: new Map(state.items).set(nodeUid, { ...existing, ...partial }),
                };
            }),

        setExpanded: (treeItemId, newValue) =>
            set((state) => ({
                expandedTreeIds: new Map(state.expandedTreeIds).set(treeItemId, newValue),
            })),

        clearStore: () =>
            set(() => ({
                items: new Map(),
                expandedTreeIds: new Map(),
            })),
        getItemsByParentUid: (parentUid: string) =>
            Array.from(get().items)
                .filter(([, node]) => node.parentUid === parentUid)
                .map(([, item]) => item),
    }));
};
