import type { NodeType } from '@proton/drive';

import type { directoryTreeStoreFactory } from './directoryTreeStoreFactory';

export enum DirectoryTreeRootType {
    Device = 'device',
    PlaceholderRoot = 'placeholder-root',
}

export interface TreeStoreItem {
    uid: string;
    parentUid: string | null;
    name: string;
    type: NodeType | DirectoryTreeRootType;
    expanded: boolean;
    expandable: boolean;
}

export interface DirectoryTreeState {
    items: Map<string, TreeStoreItem>;
    addItem: (newItem: TreeStoreItem) => void;
    getChildrenOf: (uid: string) => TreeStoreItem[];
    setExpanded: (uid: string, expanded: boolean) => void;
}

export type DirectoryTreeStore = ReturnType<typeof directoryTreeStoreFactory>;
