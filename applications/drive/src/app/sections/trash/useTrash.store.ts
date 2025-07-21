import { create } from 'zustand';

import type { LegacyItem } from '../../utils/sdk/mapNodeToLegacyItem';

interface TrashStore {
    clearAllNodes: () => void;
    trashNodes: Record<string, LegacyItem>;
    setNodes: (trashNodes: Record<string, LegacyItem>) => void;
    removeNodes: (nodeIds: string[]) => void;
    isLoading: boolean;
    setLoading: (value: boolean) => void;
}

export const useTrashStore = create<TrashStore>((set) => ({
    trashNodes: {},
    isLoading: false,
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
}));
