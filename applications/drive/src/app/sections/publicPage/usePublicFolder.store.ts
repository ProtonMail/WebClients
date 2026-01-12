import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import type { NodeType } from '@proton/drive';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';

import { sortItems } from '../../modules/sorting';
import { type SortConfig, SortField } from '../../modules/sorting/types';
import { getPublicFolderSortValue } from './publicFolder.sorting';

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

export interface PublicFolderPermissions {
    canEdit: boolean;
    canDownload: boolean;
    canUpload: boolean;
    canDelete: boolean;
    canRename: boolean;
    canOpenInDocs: boolean;
    canShowPreview: boolean;
}

interface PublicFolderStore {
    folderItems: Map<string, PublicFolderItem>;
    itemUids: Set<string>;

    isLoading: boolean;
    hasEverLoaded: boolean;
    permissions: PublicFolderPermissions;

    sortField: SortField;
    direction: SORT_DIRECTION;

    setLoading: (loading: boolean) => void;
    setHasEverLoaded: () => void;
    setPermissions: (permissions: PublicFolderPermissions) => void;
    setSorting: (params: { sortField: SortField; direction: SORT_DIRECTION; sortConfig: SortConfig }) => void;

    setFolderItem: (item: PublicFolderItem) => void;
    updateFolderItem: (uid: string, updates: Partial<PublicFolderItem>) => void;
    removeFolderItem: (uid: string) => void;
    clearAll: () => void;

    getFolderItem: (uid: string) => PublicFolderItem | undefined;
    getAllFolderItems: () => PublicFolderItem[];
    getItemUids: () => string[];
}

export const usePublicFolderStore = create<PublicFolderStore>()(
    devtools(
        (set, get) => ({
            folderItems: new Map(),
            itemUids: new Set(),

            isLoading: false,
            hasEverLoaded: false,
            permissions: {
                canEdit: false,
                canDownload: true,
                canUpload: false,
                canDelete: false,
                canRename: false,
                canOpenInDocs: false,
                canShowPreview: false,
            },

            sortField: SortField.name,
            direction: SORT_DIRECTION.ASC,

            setPermissions: (permissions: PublicFolderPermissions) => {
                set({ permissions });
            },

            setSorting: ({ sortField, direction, sortConfig }) => {
                const state = get();
                const sortedUids = sortItems(
                    state.getAllFolderItems(),
                    sortConfig,
                    direction,
                    getPublicFolderSortValue,
                    (item) => item.uid
                );

                set({ sortField, direction, itemUids: new Set(sortedUids) });
            },

            setFolderItem: (item: PublicFolderItem) => {
                set((state) => {
                    const newItemUids = new Set(state.itemUids);
                    newItemUids.add(item.uid);

                    const newFolderItems = new Map(state.folderItems);
                    newFolderItems.set(item.uid, item);
                    return {
                        folderItems: newFolderItems,
                        itemUids: newItemUids,
                    };
                });
            },

            updateFolderItem: (uid: string, updates: Partial<PublicFolderItem>) => {
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

            removeFolderItem: (uid: string) => {
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
        }),
        {
            name: 'public-folder-store',
        }
    )
);
