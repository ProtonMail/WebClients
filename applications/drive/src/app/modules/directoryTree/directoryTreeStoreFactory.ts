import { create } from 'zustand';

import type { TreeStoreItem } from './types';

interface DirectoryTreeState {
    items: Map<string, TreeStoreItem>;
    expandedTreeIds: Map<string, boolean>;
    addItem: (newItem: TreeStoreItem) => void;
    setExpanded: (treeItemId: string, newValue: boolean) => void;
}

export const directoryTreeStoreFactory = () => {
    return create<DirectoryTreeState>()((set) => ({
        items: new Map(),
        expandedTreeIds: new Map(),

        addItem: (newItem) =>
            set((state) => ({
                items: new Map(state.items).set(newItem.nodeUid, newItem),
            })),

        setExpanded: (treeItemId, newValue) =>
            set((state) => ({
                expandedTreeIds: new Map(state.expandedTreeIds).set(treeItemId, newValue),
            })),
    }));
};
