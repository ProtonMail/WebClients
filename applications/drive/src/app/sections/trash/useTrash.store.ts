import { create } from 'zustand';

import type { NodeEntity } from '@proton/drive';

interface TrashStore {
    items: Map<string, NodeEntity>;
    isLoading: boolean;
    hasEverLoaded: boolean;

    setItem: (item: NodeEntity) => void;
    updateItem: (uid: string, updates: Partial<NodeEntity>) => void;
    removeItem: (uid: string) => void;
    clearAll: () => void;

    getItem: (uid: string) => NodeEntity | undefined;

    setLoading: (source: string, loading: boolean) => void;
}

export const useTrashStore = create<TrashStore>((set, get) => {
    const loadingSources = new Set<string>();

    return {
        items: new Map(),
        isLoading: false,
        hasEverLoaded: false,

        getItem: (uid: string) => get().items.get(uid),

        setItem: (item: NodeEntity) =>
            set((state) => {
                const items = new Map(state.items);
                items.set(item.uid, item);
                return { items };
            }),

        updateItem: (uid: string, updates: Partial<NodeEntity>) =>
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
                return { items };
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

        clearAll: () => set({ items: new Map() }),
    };
});
