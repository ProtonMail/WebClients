import type { MemberRole, NodeType } from '@proton/drive';

import type { directoryTreeStoreFactory } from './directoryTreeStoreFactory';

export enum DirectoryTreeRootType {
    FilesRoot = 'files-root',
    DevicesRoot = 'devices-root',
    Device = 'device',
    SharesRoot = 'shares-root',
}

export interface TreeStoreItem {
    // Unique within the filesystem
    nodeUid: string;
    // Unique within the directory tree
    // Format: $PARENT_UID___$NODE_UID
    treeItemId: string;
    parentUid: string | null;
    name: string;
    type: NodeType | DirectoryTreeRootType;
    expandable: boolean;
    isSharedWithMe: boolean;
    treeEventScopeId?: string;
    highestEffectiveRole?: MemberRole;
    deprecatedShareId?: string;
    // This flag is false if the item has never tried to load its children
    // after loading it remains true regardless of the item having children
    hasLoadedChildren?: boolean;
    // This flag is true if the item has children
    // it maintains its value even if the `children` prop is emptied after collapsing the branch
    hasChildren?: boolean;
}

export type DirectoryTreeStore = ReturnType<typeof directoryTreeStoreFactory>;
