import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import type { NodeType } from '@proton/drive';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';

import { sortItems } from '../../modules/sorting';
import { nodeTypeComparator, stringComparator } from '../../modules/sorting/comparators';
import { type SortConfig, SortField } from '../../modules/sorting/types';
import { getPublicFolderSortValue } from './publicFolder.sorting';

export type PublicFolderViewData = {
    uid: string;
    name: string;
    parentUid: string | undefined;
};

export type PublicFolderItem = {
    uid: string;
    name: string;
    type: NodeType;
    mediaType: string | undefined;
    thumbnailId: string | undefined;
    size: number | undefined;
    parentUid: string | undefined;
    creationTime?: Date;
    modificationTime?: Date;
    haveSignatureIssues: boolean | undefined;
    signatureEmail?: string;
    uploadedBy: string | undefined;
};

interface PublicFolderStore {
    folder: PublicFolderViewData | undefined;
    folderItems: Map<string, PublicFolderItem>;
    itemUids: Set<string>;

    isLoading: boolean;
    hasEverLoaded: boolean;

    sortField: SortField;
    direction: SORT_DIRECTION;
    sortConfig: SortConfig | undefined;

    setFolder: (folderData: PublicFolderViewData) => void;

    setLoading: (loading: boolean) => void;
    setHasEverLoaded: () => void;
    setSorting: (params: { sortField: SortField; direction: SORT_DIRECTION; sortConfig: SortConfig }) => void;

    setItem: (item: PublicFolderItem) => void;
    updateItem: (uid: string, updates: Partial<PublicFolderItem>) => void;
    removeItem: (uid: string) => void;
    clearAll: () => void;

    getFolderItem: (uid: string) => PublicFolderItem | undefined;
    getAllFolderItems: () => PublicFolderItem[];
    getItemUids: () => string[];
}

const defaultSortConfig: SortConfig = [
    { field: SortField.nodeType, comparator: nodeTypeComparator, direction: SORT_DIRECTION.ASC },
    { field: SortField.name, comparator: stringComparator },
];

export const usePublicFolderStore = create<PublicFolderStore>()(
    devtools(
        (set, get) => ({
            folderItems: new Map(),
            itemUids: new Set(),
            folder: undefined,
            isLoading: false,
            hasEverLoaded: false,

            sortField: SortField.name,
            direction: SORT_DIRECTION.ASC,
            sortConfig: defaultSortConfig,

            setSorting: ({ sortField, direction, sortConfig }) => {
                const state = get();
                const sortedUids = sortItems(
                    state.getAllFolderItems(),
                    sortConfig,
                    direction,
                    getPublicFolderSortValue,
                    (item) => item.uid
                );

                set({ sortField, direction, sortConfig, itemUids: new Set(sortedUids) });
            },

            setItem: (item: PublicFolderItem) => {
                set((state) => {
                    const newFolderItems = new Map(state.folderItems);
                    newFolderItems.set(item.uid, item);

                    if (state.sortConfig) {
                        const allItems = Array.from(newFolderItems.values());
                        const sortedUids = sortItems(
                            allItems,
                            state.sortConfig,
                            state.direction,
                            getPublicFolderSortValue,
                            (item) => item.uid
                        );

                        const currentUids = Array.from(state.itemUids);
                        const orderChanged =
                            sortedUids.length !== currentUids.length ||
                            sortedUids.some((uid, index) => {
                                return uid !== currentUids[index];
                            });

                        if (orderChanged) {
                            return {
                                folderItems: newFolderItems,
                                itemUids: new Set(sortedUids),
                            };
                        }

                        return {
                            folderItems: newFolderItems,
                        };
                    }

                    const newItemUids = new Set(state.itemUids);
                    newItemUids.add(item.uid);
                    return {
                        folderItems: newFolderItems,
                        itemUids: newItemUids,
                    };
                });
            },

            updateItem: (uid: string, updates: Partial<PublicFolderItem>) => {
                set((state) => {
                    const existingItem = state.folderItems.get(uid);
                    if (!existingItem) {
                        return state;
                    }

                    const updatedItem = { ...existingItem, ...updates };
                    const newFolderItems = new Map(state.folderItems);
                    newFolderItems.set(uid, updatedItem);

                    return {
                        ...state,
                        folderItems: newFolderItems,
                    };
                });
            },

            removeItem: (uid: string) => {
                set((state) => {
                    const newFolderItems = new Map(state.folderItems);
                    newFolderItems.delete(uid);
                    const newItemUids = new Set(state.itemUids);
                    newItemUids.delete(uid);
                    return {
                        folderItems: newFolderItems,
                        itemUids: newItemUids,
                    };
                });
            },

            clearAll: () => {
                set({
                    folderItems: new Map(),
                    itemUids: new Set(),
                });
            },

            getItemUids: () => Array.from(get().itemUids),

            getFolderItem: (uid: string) => get().folderItems.get(uid),
            getAllFolderItems: () => Array.from(get().folderItems.values()),

            setLoading: (loading: boolean) => {
                set({ isLoading: loading });
                if (!loading && !get().hasEverLoaded) {
                    get().setHasEverLoaded();
                }
            },

            setHasEverLoaded: () => set({ hasEverLoaded: true }),
            setFolder: (folder) => set({ folder }),
        }),
        {
            name: 'public-folder-store',
        }
    )
);
