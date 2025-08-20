import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { MemberRole } from '@proton/drive/index';

import type { EnrichedError } from '../../utils/errorHandling/EnrichedError';

export type FolderViewItem = {
    uid: string;
    name: string;
    rootShareId: string;
    parentLinkId: string;
    linkId: string;
    volumeId: string;
    thumbnailId: string;
    id: string;
    mimeType: string;
    isFile: boolean;
    isShared?: boolean;
    hasThumbnail: boolean;
    size: number;
    metaDataModifyTime: number;
    fileModifyTime: number;
    trashed: number | null;
    rootUid?: string;
    parentUid: string | undefined;
};

export type FolderViewData = {
    uid: string;
    name: string;
    parentUid: string | undefined;
    isRoot: boolean;
    shareId: string;
};

type FolderPermissions = {
    canEdit: boolean;
    canShare: boolean;
    canCreateNode: boolean;
    canCreateDocs: boolean;
    canCreateSheets: boolean;
    canShareNode: boolean;
    canMove: boolean;
    canRename: boolean;
};

type FolderState = {
    isLoading: boolean;
    items: Map<string, FolderViewItem>;
    itemUids: Set<string>;
    folder?: FolderViewData;
    error: EnrichedError | null;
    role: MemberRole;
    permissions: FolderPermissions;
};

type FolderActions = {
    setIsLoading: (isLoading: boolean) => void;
    setFolder: (folderData: FolderViewData) => void;
    setPermissions: (perms: FolderPermissions) => void;
    setError: (error: EnrichedError | null) => void;
    setRole: (role: MemberRole) => void;
    setItem: (item: FolderViewItem) => void;
    updateItem: (uid: string, item: Partial<FolderViewItem>) => void;
    removeItem: (uid: string) => void;
    reset: () => void;
    getFolderItems: () => FolderViewItem[];
    getItemUids: () => string[];
};

type FolderStore = FolderState & FolderActions;

const initialState: FolderState = {
    isLoading: true,
    items: new Map(),
    itemUids: new Set(),
    folder: undefined,
    error: null,
    role: MemberRole.Viewer,
    permissions: {
        canEdit: false,
        canShare: false,
        canCreateNode: false,
        canCreateDocs: false,
        canCreateSheets: false,
        canShareNode: false,
        canMove: false,
        canRename: false,
    },
};

export const useFolderStore = create<FolderStore>()(
    devtools((set, get) => ({
        ...initialState,
        setIsLoading: (isLoading) => set({ isLoading }),
        setItem: (item: FolderViewItem) =>
            set((state) => {
                const updatedItems = new Map(state.items);
                updatedItems.set(item.uid, item);

                if (!state.itemUids.has(item.uid)) {
                    const newUids = new Set(state.itemUids);
                    newUids.add(item.uid);
                    return {
                        items: updatedItems,
                        itemUids: newUids,
                    };
                }

                return {
                    items: updatedItems,
                };
            }),
        updateItem: (uid: string, item: Partial<FolderViewItem>) =>
            set((state) => {
                const updatedItems = new Map(state.items);
                const existingItem = state.items.get(uid);
                if (existingItem) {
                    updatedItems.set(uid, {
                        ...existingItem,
                        ...item,
                    });

                    return {
                        items: updatedItems,
                    };
                }

                return {};
            }),
        removeItem: (uid: string) =>
            set((state) => {
                if (!state.items.has(uid)) {
                    return {};
                }
                const updatedItems = new Map(state.items);
                updatedItems.delete(uid);
                const newUids = new Set(state.itemUids);
                newUids.delete(uid);

                return {
                    items: updatedItems,
                    itemUids: newUids,
                };
            }),
        getFolderItems: () => Array.from(get().items.values()),
        getItemUids: () => Array.from(get().itemUids),
        setPermissions: (permissions) => set({ permissions }),
        setFolder: (folder) => set({ folder }),
        setError: (error) => set({ error }),
        setRole: (role) => set({ role }),
        reset: () => set(initialState),
    }))
);
