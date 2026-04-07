import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import type { NodeType } from '@proton/drive/index';
import { MemberRole } from '@proton/drive/index';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';

import type { SortConfig } from '../../modules/sorting';
import { SortField } from '../../modules/sorting';
import type { EnrichedError } from '../../utils/errorHandling/EnrichedError';
import { sortFolderItems } from './folder.sorting';

export type FolderViewItem = {
    uid: string;
    name: string;
    rootShareId: string;
    parentLinkId: string;
    linkId: string;
    volumeId: string;
    activeRevisionUid: string | undefined;
    id: string;
    mimeType: string;
    isFile: boolean;
    isShared?: boolean;
    isSharedPublicly?: boolean;
    hasThumbnail: boolean;
    size: number;
    metaDataModifyTime: number;
    fileModifyTime: Date;
    trashed: number | null;
    rootUid?: string;
    parentUid: string | undefined;
    hasSignatureIssues: boolean;
    type: NodeType;
    effectiveRole: MemberRole;
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
    canOpenInDocs: boolean;
    canShareNode: boolean;
    canMove: boolean;
    canCopy: boolean;
    canRename: boolean;
    canTrash: boolean;
};

type FolderState = {
    isLoading: boolean;
    hasEverLoaded: boolean;
    items: Map<string, FolderViewItem>;
    sortedItemUids: string[];
    sortField: SortField;
    sortDirection: SORT_DIRECTION;
    folder?: FolderViewData;
    treeEventScopeId?: string;
    error: EnrichedError | null;
    role: MemberRole;
    permissions: FolderPermissions;
};

type FolderActions = {
    setIsLoading: (isLoading: boolean) => void;
    setFolder: (folderData: FolderViewData, treeEventScopeId: string) => void;
    setPermissions: (perms: FolderPermissions) => void;
    setError: (error: EnrichedError | null) => void;
    setRole: (role: MemberRole) => void;
    setItem: (item: FolderViewItem) => void;
    setItems: (items: FolderViewItem[]) => void;
    updateItem: (uid: string, item: Partial<FolderViewItem>) => void;
    removeItem: (uid: string) => void;
    setSorting: (params: { sortField: SortField; direction: SORT_DIRECTION; sortConfig: SortConfig }) => void;
    reset: () => void;
    setHasEverLoaded: () => void;
    checkAndSetHasEverLoaded: () => void;
};

export type FolderStore = FolderState & FolderActions;

const initialState: FolderState = {
    isLoading: false,
    hasEverLoaded: false,
    items: new Map(),
    sortedItemUids: [],
    sortField: SortField.modificationTime,
    sortDirection: SORT_DIRECTION.DESC,
    folder: undefined,
    error: null,
    role: MemberRole.Viewer,
    permissions: {
        canEdit: false,
        canShare: false,
        canCreateNode: false,
        canCreateDocs: false,
        canCreateSheets: false,
        canOpenInDocs: false,
        canShareNode: false,
        canMove: false,
        canCopy: false,
        canRename: false,
        canTrash: false,
    },
};

function resort(state: FolderState): string[] {
    return sortFolderItems(Array.from(state.items.values()), state.sortField, state.sortDirection);
}

export const useFolderStore = create<FolderStore>()(
    devtools((set, get) => ({
        ...initialState,
        setIsLoading: (isLoading) => {
            set({ isLoading });
            get().checkAndSetHasEverLoaded();
        },
        setItem: (item: FolderViewItem) =>
            set((state) => {
                const updatedItems = new Map(state.items);
                updatedItems.set(item.uid, item);
                const newState = { ...state, items: updatedItems };
                return {
                    items: updatedItems,
                    sortedItemUids: resort(newState),
                };
            }),
        setItems: (items: FolderViewItem[]) =>
            set((state) => {
                const updatedItems = new Map(state.items);
                items.forEach((item) => {
                    updatedItems.set(item.uid, item);
                });
                const newState = { ...state, items: updatedItems };
                return {
                    items: updatedItems,
                    sortedItemUids: resort(newState),
                };
            }),
        updateItem: (uid: string, item: Partial<FolderViewItem>) =>
            set((state) => {
                const existingItem = state.items.get(uid);
                if (!existingItem) {
                    return {};
                }
                const updatedItems = new Map(state.items);
                updatedItems.set(uid, { ...existingItem, ...item });
                const newState = { ...state, items: updatedItems };
                return {
                    items: updatedItems,
                    sortedItemUids: resort(newState),
                };
            }),
        removeItem: (uid: string) =>
            set((state) => {
                if (!state.items.has(uid)) {
                    return {};
                }
                const updatedItems = new Map(state.items);
                updatedItems.delete(uid);
                return {
                    items: updatedItems,
                    sortedItemUids: state.sortedItemUids.filter((id) => id !== uid),
                };
            }),
        setSorting: ({ sortField, direction }) => {
            const state = get();
            const allItems = Array.from(state.items.values());
            const sortedItemUids = sortFolderItems(allItems, sortField, direction);
            set({ sortField, sortDirection: direction, sortedItemUids });
        },
        setPermissions: (permissions) => set({ permissions }),
        setFolder: (folder, treeEventScopeId) => set({ folder, treeEventScopeId }),
        setError: (error) => set({ error }),
        setRole: (role) => set({ role }),
        reset: () =>
            set((state) => ({
                ...initialState,
                sortField: state.sortField,
                sortDirection: state.sortDirection,
            })),
        setHasEverLoaded: () => set({ hasEverLoaded: true }),
        checkAndSetHasEverLoaded: () => {
            const state = get();
            if (!state.isLoading && !state.hasEverLoaded) {
                state.setHasEverLoaded();
            }
        },
    }))
);
