import type { NodeEntity } from '@proton/drive/index';

export const getNodeStorageSize = (node: NodeEntity) => {
    return node.activeRevision?.storageSize || node.totalStorageSize || 0;
};
