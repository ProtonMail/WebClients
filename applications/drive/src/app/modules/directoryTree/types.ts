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
    highestEffectiveRole?: MemberRole;
}

export type DirectoryTreeStore = ReturnType<typeof directoryTreeStoreFactory>;
