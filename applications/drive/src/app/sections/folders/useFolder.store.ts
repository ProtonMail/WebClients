import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { MemberRole } from '@proton/drive/index';

import type { EnrichedError } from '../../utils/errorHandling/EnrichedError';

type FolderViewItem = {
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
};

type FolderViewData = {
    uid: string;
    name: string;
    parentUid?: string;
    isRoot: boolean;
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
    reset: () => void;
    getItemUids: () => string[];
    getFolderItems: () => FolderViewItem[];
};

type FolderStore = FolderState & FolderActions;

const initialState: FolderState = {
    isLoading: true,
    items: new Map(),
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
                return {
                    items: updatedItems,
                };
            }),
        getItemUids: () => Array.from(get().items.keys()),
        getFolderItems: () => Array.from(get().items.values()),
        setPermissions: (permissions) => set({ permissions }),
        setFolder: (folder) => set({ folder }),
        setError: (error) => set({ error }),
        setRole: (role) => set({ role }),
        reset: () => set(initialState),
    }))
);
