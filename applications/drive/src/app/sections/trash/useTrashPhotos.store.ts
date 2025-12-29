import { create } from 'zustand';

import type { NodeEntity } from '@proton/drive';

interface TrashStore {
    clearAllNodes: () => void;
    trashNodes: Record<string, NodeEntity>;
    setNodes: (trashNodes: Record<string, NodeEntity>) => void;
    addNode: (node: NodeEntity) => void;
    removeNodes: (nodeIds: string[]) => void;
    isLoading: boolean;
    hasEverLoaded: boolean;
    setLoading: (loading: boolean) => void;
    setHasEverLoaded: () => void;
    checkAndSetHasEverLoaded: () => void;
    eventSubscriptions: (() => void)[] | null;
    activeContexts: Set<string>;
}

export const useTrashPhotosStore = create<TrashStore>((set, get) => ({
    trashNodes: {},
    isLoading: false,
    hasEverLoaded: false,
    eventSubscriptions: null,
    activeContexts: new Set<string>(),
    setNodes: (trashNodes: Record<string, NodeEntity>) =>
        set((state) => {
            return { trashNodes: { ...state.trashNodes, ...trashNodes } };
        }),
    addNode: (node: NodeEntity) =>
        set((state) => {
            return { trashNodes: { ...state.trashNodes, [node.uid]: node } };
        }),
    removeNodes: (nodeIds: string[]) =>
        set((state) => {
            const remainingNodes = { ...state.trashNodes };
            nodeIds.forEach((nodeId) => delete remainingNodes[nodeId]);
            return { trashNodes: remainingNodes };
        }),
    setLoading: (isLoading: boolean) => {
        set({ isLoading });
        get().checkAndSetHasEverLoaded();
    },

    setHasEverLoaded: () => set({ hasEverLoaded: true }),
    checkAndSetHasEverLoaded: () => {
        const state = get();
        if (!state.isLoading && !state.hasEverLoaded) {
            state.setHasEverLoaded();
        }
    },

    clearAllNodes: () => set({ trashNodes: {} }),
}));
