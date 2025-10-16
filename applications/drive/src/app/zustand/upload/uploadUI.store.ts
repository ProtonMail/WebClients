import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import type { UploadStatus } from './uploadQueue.store';

export type UploadUIItem = {
    uploadId: string;
    name: string;
    progress: number;
    status: UploadStatus;
    error?: Error;
    speedBytesPerSecond?: number;
};

// TODO: This can be merge with download and transform to transferManager store
type UploadUIStore = {
    items: Map<string, UploadUIItem>;
    itemIds: Set<string>;

    addItem: (item: UploadUIItem) => void;
    updateItem: (uploadId: string, update: Partial<UploadUIItem>) => void;
    removeItems: (uploadIds: string[]) => void;
    clearAll: () => void;
    getItem: (uploadId: string) => UploadUIItem | undefined;
    getAll: () => UploadUIItem[];
    getItemIds: () => Set<string>;
};

export const useUploadUIStore = create<UploadUIStore>()(
    devtools(
        (set, get) => ({
            items: new Map(),
            itemIds: new Set(),

            addItem: (item) => {
                set((state) => {
                    const items = new Map(state.items).set(item.uploadId, item);
                    const itemIds = state.itemIds.has(item.uploadId)
                        ? state.itemIds
                        : new Set(state.itemIds).add(item.uploadId);
                    return { items, itemIds };
                });
            },

            updateItem: (uploadId, update) => {
                set((state) => {
                    const existing = state.items.get(uploadId);
                    if (!existing) {
                        return {};
                    }
                    const items = new Map(state.items);
                    items.set(uploadId, { ...existing, ...update });
                    return { items };
                });
            },

            removeItems: (uploadIds) => {
                set((state) => {
                    if (uploadIds.length === 0) {
                        return {};
                    }
                    const items = new Map(state.items);
                    const itemIds = new Set(state.itemIds);
                    uploadIds.forEach((id) => {
                        items.delete(id);
                        itemIds.delete(id);
                    });
                    return { items, itemIds };
                });
            },

            clearAll: () => {
                set({ items: new Map(), itemIds: new Set() });
            },

            getItem: (uploadId) => get().items.get(uploadId),

            getAll: () => Array.from(get().items.values()),

            getItemIds: () => get().itemIds,
        }),
        { name: 'UploadUIStore' }
    )
);
